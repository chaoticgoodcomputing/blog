import sourceMapSupport from "source-map-support"
// Install source map support to get proper stack traces with line numbers
sourceMapSupport.install(options)
import path from "path"
import { PerfTimer } from "./util/perf"
import { rimraf } from "rimraf"
import { GlobbyFilterFunction, isGitIgnored } from "globby"
import chalk from "chalk"
import { parseMarkdown } from "./processors/parse"
import { filterContent } from "./processors/filter"
import { emitContent } from "./processors/emit"
import cfg from "../quartz.config"
import { FilePath, joinSegments, slugifyFilePath } from "./util/path"
import chokidar from "chokidar"
import { ProcessedContent } from "./plugins/vfile"
import { Argv, BuildCtx } from "./util/ctx"
import { glob, toPosixPath } from "./util/glob"
import { trace } from "./util/trace"
import { options } from "./util/sourcemap"
import { Mutex } from "async-mutex"
import { getStaticResourcesFromPlugins } from "./plugins"
import { randomIdNonSecure } from "./util/random"
import { ChangeEvent } from "./plugins/types"
import { minimatch } from "minimatch"

// ContentMap tracks all files in the project - either markdown (with parsed content) or other types
type ContentMap = Map<
  FilePath,
  | {
      type: "markdown"
      content: ProcessedContent
    }
  | {
      type: "other"
    }
>

// BuildData holds state information used during builds and rebuilds
type BuildData = {
  ctx: BuildCtx,                                         // Build context with args, config, etc.
  ignored: GlobbyFilterFunction,                         // Function to check if a file should be ignored
  mut: Mutex,                                            // Mutex to prevent concurrent builds
  contentMap: ContentMap,                                // Map of all content files and their processed state
  changesSinceLastBuild: Record<FilePath, ChangeEvent["type"]>, // Tracks file changes
  lastBuildMs: number                                    // Timestamp of the last build
}

/**
 * Main build function for Quartz
 * This is the entry point called from bootstrap-cli.mjs after transpilation
 */
async function buildQuartz(argv: Argv, mut: Mutex, clientRefresh: () => void) {
  // Initialize build context with configuration and command line arguments
  const ctx: BuildCtx = {
    buildId: randomIdNonSecure(),
    argv,
    cfg,
    allSlugs: [],
    allFiles: [],
    incremental: false,
  }

  const perf = new PerfTimer()
  const output = argv.output

  // Log plugin information if in verbose mode
  const pluginCount = Object.values(cfg.plugins).flat().length
  const pluginNames = (key: "transformers" | "filters" | "emitters") =>
    cfg.plugins[key].map((plugin) => plugin.name)
  if (argv.verbose) {
    console.log(`Loaded ${pluginCount} plugins`)
    console.log(`  Transformers: ${pluginNames("transformers").join(", ")}`)
    console.log(`  Filters: ${pluginNames("filters").join(", ")}`)
    console.log(`  Emitters: ${pluginNames("emitters").join(", ")}`)
  }

  // Acquire mutex lock to prevent concurrent builds
  const release = await mut.acquire()
  
  // Step 1: Clean the output directory
  perf.addEvent("clean")
  await rimraf(path.join(output, "*"), { glob: true })
  console.log(`Cleaned output directory \`${output}\` in ${perf.timeSince("clean")}`)

  // Step 2: Recursively glob all files in content folder
  perf.addEvent("glob")
  const allFiles = await glob("**/*.*", argv.directory, cfg.configuration.ignorePatterns)
  const markdownPaths = allFiles.filter((fp) => fp.endsWith(".md")).sort()
  console.log(
    `Found ${markdownPaths.length} input files from \`${argv.directory}\` in ${perf.timeSince("glob")}`,
  )

  // Generate full file paths and update context with all files and their slugs
  const filePaths = markdownPaths.map((fp) => joinSegments(argv.directory, fp) as FilePath)
  ctx.allFiles = allFiles
  ctx.allSlugs = allFiles.map((fp) => slugifyFilePath(fp as FilePath))

  // Step 3: Parse the Markdown files using unified and remark/rehype
  const parsedFiles = await parseMarkdown(ctx, filePaths)
  
  // Step 4: Filter content using plugins
  const filteredContent = filterContent(ctx, parsedFiles)

  // Step 5: Emit files using plugins (convert to HTML, gather resources, etc.)
  await emitContent(ctx, filteredContent)
  console.log(chalk.green(`Done processing ${markdownPaths.length} files in ${perf.timeSince()}`))
  release()

  // If watch mode is enabled, start file watchers for incremental builds
  if (argv.watch) {
    ctx.incremental = true
    return startWatching(ctx, mut, parsedFiles, clientRefresh)
  }
}

/**
 * Setup watcher for incremental rebuilds when files change
 * This is activated with the --serve flag
 */
async function startWatching(
  ctx: BuildCtx,
  mut: Mutex,
  initialContent: ProcessedContent[],
  clientRefresh: () => void,
) {
  const { argv, allFiles } = ctx

  // Initialize the content map with all files
  const contentMap: ContentMap = new Map()
  for (const filePath of allFiles) {
    contentMap.set(filePath, {
      type: "other",
    })
  }

  // Add the initially parsed markdown content to the map
  for (const content of initialContent) {
    const [_tree, vfile] = content
    contentMap.set(vfile.data.relativePath!, {
      type: "markdown",
      content,
    })
  }

  // Set up file ignore patterns using .gitignore and configuration
  const gitIgnoredMatcher = await isGitIgnored()
  const buildData: BuildData = {
    ctx,
    mut,
    contentMap,
    ignored: (path) => {
      if (gitIgnoredMatcher(path)) return true
      const pathStr = path.toString()
      for (const pattern of cfg.configuration.ignorePatterns) {
        if (minimatch(pathStr, pattern)) {
          return true
        }
      }

      return false
    },

    changesSinceLastBuild: {},
    lastBuildMs: 0,
  }

  // Set up chokidar to watch for file changes
  const watcher = chokidar.watch(".", {
    persistent: true,
    cwd: argv.directory,
    ignoreInitial: true,
  })

  // Track changes for debounced rebuilds
  const changes: ChangeEvent[] = []
  watcher
    .on("add", (fp) => {
      if (buildData.ignored(fp)) return
      changes.push({ path: fp as FilePath, type: "add" })
      void rebuild(changes, clientRefresh, buildData)
    })
    .on("change", (fp) => {
      if (buildData.ignored(fp)) return
      changes.push({ path: fp as FilePath, type: "change" })
      void rebuild(changes, clientRefresh, buildData)
    })
    .on("unlink", (fp) => {
      if (buildData.ignored(fp)) return
      changes.push({ path: fp as FilePath, type: "delete" })
      void rebuild(changes, clientRefresh, buildData)
    })

  // Return a function to close the watcher when needed
  return async () => {
    await watcher.close()
  }
}

/**
 * Handle incremental rebuilds when files change
 * This is debounced to avoid rebuilding too frequently
 */
async function rebuild(changes: ChangeEvent[], clientRefresh: () => void, buildData: BuildData) {
  const { ctx, contentMap, mut, changesSinceLastBuild } = buildData
  const { argv, cfg } = ctx

  // Generate new build ID and acquire mutex to prevent concurrent builds
  const buildId = randomIdNonSecure()
  ctx.buildId = buildId
  buildData.lastBuildMs = new Date().getTime()
  const numChangesInBuild = changes.length
  const release = await mut.acquire()

  // If there's another build after us, release and let them do it
  if (ctx.buildId !== buildId) {
    release()
    return
  }

  const perf = new PerfTimer()
  perf.addEvent("rebuild")
  console.log(chalk.yellow("Detected change, rebuilding..."))

  // Update the changes tracking map
  for (const change of changes) {
    changesSinceLastBuild[change.path] = change.type
  }

  // Get all static resources from plugins
  const staticResources = getStaticResourcesFromPlugins(ctx)
  
  // Identify markdown files that need to be reparsed
  const pathsToParse: FilePath[] = []
  for (const [fp, type] of Object.entries(changesSinceLastBuild)) {
    if (type === "delete" || path.extname(fp) !== ".md") continue
    const fullPath = joinSegments(argv.directory, toPosixPath(fp)) as FilePath
    pathsToParse.push(fullPath)
  }

  // Parse changed markdown files
  const parsed = await parseMarkdown(ctx, pathsToParse)
  for (const content of parsed) {
    contentMap.set(content[1].data.relativePath!, {
      type: "markdown",
      content,
    })
  }

  // Handle file deletions and additions to update the contentMap
  // We do this after parsing so emitters can access content of deleted files
  for (const [file, change] of Object.entries(changesSinceLastBuild)) {
    if (change === "delete") {
      // Remove deleted files from the content map
      contentMap.delete(file as FilePath)
    }

    // Track non-markdown files (they don't need parsing)
    if (change === "add" && path.extname(file) !== ".md") {
      contentMap.set(file as FilePath, {
        type: "other",
      })
    }
  }

  // Create change events for emitters to process
  const changeEvents: ChangeEvent[] = Object.entries(changesSinceLastBuild).map(([fp, type]) => {
    const path = fp as FilePath
    const processedContent = contentMap.get(path)
    if (processedContent?.type === "markdown") {
      const [_tree, file] = processedContent.content
      return {
        type,
        path,
        file,
      }
    }

    return {
      type,
      path,
    }
  })

  // Update the context with the current state of all files
  ctx.allFiles = Array.from(contentMap.keys())
  ctx.allSlugs = ctx.allFiles.map((fp) => slugifyFilePath(fp as FilePath))
  
  // Get all processed markdown files
  const processedFiles = Array.from(contentMap.values())
    .filter((file) => file.type === "markdown")
    .map((file) => file.content)

  // Run all emitter plugins to generate output files
  let emittedFiles = 0
  for (const emitter of cfg.plugins.emitters) {
    // Try to use partialEmit for incremental builds if available, otherwise use full emit
    const emitFn = emitter.partialEmit ?? emitter.emit
    const emitted = await emitFn(ctx, processedFiles, staticResources, changeEvents)
    if (emitted === null) {
      continue
    }

    if (Symbol.asyncIterator in emitted) {
      // Handle async generator case
      for await (const file of emitted) {
        emittedFiles++
        if (ctx.argv.verbose) {
          console.log(`[emit:${emitter.name}] ${file}`)
        }
      }
    } else {
      // Handle array case
      emittedFiles += emitted.length
      if (ctx.argv.verbose) {
        for (const file of emitted) {
          console.log(`[emit:${emitter.name}] ${file}`)
        }
      }
    }
  }

  console.log(`Emitted ${emittedFiles} files to \`${argv.output}\` in ${perf.timeSince("rebuild")}`)
  console.log(chalk.green(`Done rebuilding in ${perf.timeSince()}`))
  
  // Clear processed changes and signal client to refresh
  changes.splice(0, numChangesInBuild)
  clientRefresh()
  release()
}

/**
 * Module export - main entry point for Quartz build process
 * Called by bootstrap-cli.mjs after transpilation
 */
export default async (argv: Argv, mut: Mutex, clientRefresh: () => void) => {
  try {
    return await buildQuartz(argv, mut, clientRefresh)
  } catch (err) {
    trace("\nExiting Quartz due to a fatal error", err as Error)
  }
}
