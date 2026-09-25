// cgc-annotator: shows annotations written with Obsidian's Annotator plugin (CONTEXT.md). One
// package, three halves, as #37 settled:
//   - the transformer takes each annotation page's annotations out of its markdown and renders
//     their notes through the site's pipeline (./transformer);
//   - the page type gives an annotation page the full-width frame, and a body of the Viewer beside
//     the annotations (./page);
//   - the emitter mirrors every annotation page's source document into the site, and emits the
//     Viewer's browser files. Mirrors are pinned on first fetch, and a document that can't be
//     fetched costs a warning, never the build (docs/adr/0001).
//
// Quartz makes a separate instance of this plugin for each of the three, from the same options.
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { styleText } from "node:util"
import { annotationTarget, cacheEntry, mirrorName, pinned, sourceUrl, Unmirrorable } from "./mirror"
import { Body, STATIC_DIR } from "./page"
import { DEFAULT_DENYLIST, NAME, Transformer } from "./transformer"

// Written in by build.mjs: the plugin's stylesheet, already in its family layer (ADR-0003).
declare const __CGC_ANNOTATOR_CSS__: string

export interface Options {
  /** Where mirrors are served from, relative to the site root. Keep it out of search in `robots.txt`. */
  mirrorDir: string
  /** Where source documents are pinned between builds: relative to the Quartz root, or absolute. */
  cacheDir: string
  /** How long to wait for a source document before building without it, in milliseconds. */
  fetchTimeout: number
  /**
   * Transformers a note is rendered without, by transformer name: the ones that act on a whole page.
   * Replaces the default list, so a site adding one lists the defaults too.
   */
  denylist: string[]
}

const defaults: Options = {
  mirrorDir: "mirrors",
  cacheDir: "node_modules/.cache/cgc-annotator",
  fetchTimeout: 60_000,
  denylist: DEFAULT_DENYLIST,
}

// The little of Quartz's build context and content this plugin reads.
interface Ctx {
  argv: { output: string }
}
interface File {
  path?: string
  data?: { frontmatter?: Record<string, unknown>; relativePath?: string }
}
type Content = [unknown, File | undefined][]
interface ChangeEvent {
  type: "add" | "change" | "delete"
  file?: File
}

const warn = (message: string) => console.warn(styleText("yellow", "⚠") + ` cgc-annotator: ${message}`)

// The Viewer's browser files, built beside this module by build.mjs: its entry and chunks, PDF.js's
// worker and wasm.
const CLIENT_DIR = fileURLToPath(new URL("./client/", import.meta.url))

// Each instance offers the stylesheet, and the first one Quartz asks in a build keeps it, so the
// page gets it once, not once per instance.
const stylesheetOwner = new WeakMap<object, object>()

export default function CgcAnnotator(userOpts?: Partial<Options>) {
  const opts = { ...defaults, ...userOpts }
  // Quartz runs from its root, so a relative cache directory is taken from there.
  const cacheDir = path.resolve(opts.cacheDir)
  const mirrorDir = opts.mirrorDir.replace(/^\/+|\/+$/g, "")
  const body = Body(mirrorDir)

  // Mirrors the source documents the given pages annotate, one fetch per document however many
  // pages share it. Resolves with the files written.
  async function mirror(ctx: Ctx, files: (File | undefined)[]): Promise<string[]> {
    const sources = new Map<string, { url: URL; pages: string[] }>()
    for (const file of files) {
      const target = annotationTarget(file?.data?.frontmatter)
      if (!target) continue
      const page = file?.data?.relativePath ?? file?.path ?? "?"
      const url = sourceUrl(target)
      if (url instanceof Unmirrorable) {
        warn(`no mirror for ${page}: its annotation-target "${target}" is ${url.message}.`)
        continue
      }
      const name = mirrorName(url)
      const source = sources.get(name) ?? { url, pages: [] }
      source.pages.push(page)
      sources.set(name, source)
    }

    const written = await Promise.all(
      [...sources].map(async ([name, { url, pages }]) => {
        try {
          const entry = await pinned(url, cacheDir, opts.fetchTimeout)
          const dest = path.join(ctx.argv.output, mirrorDir, name)
          await fs.promises.mkdir(path.dirname(dest), { recursive: true })
          await fs.promises.copyFile(entry, dest)
          return [dest]
        } catch (err) {
          // Never the build: someone else's host being down or blocking us is not the author's fault.
          const reason = err instanceof Unmirrorable ? err.message : String(err)
          warn(
            `could not mirror ${url.href} (${reason}) for ${pages.join(", ")}. Its viewer will link to the source instead. ` +
              `To pin a copy by hand, save it as ${cacheEntry(url, cacheDir)}`,
          )
          return []
        }
      }),
    )
    return written.flat()
  }

  // The Viewer's browser files, for a site with an annotation page to show them on.
  async function viewerFiles(ctx: Ctx, files: (File | undefined)[]): Promise<string[]> {
    if (!files.some((file) => annotationTarget(file?.data?.frontmatter))) return []
    const dest = path.join(ctx.argv.output, STATIC_DIR)
    await fs.promises.cp(CLIENT_DIR, dest, { recursive: true })
    return (await fs.promises.readdir(dest, { recursive: true, withFileTypes: true }))
      .filter((entry) => entry.isFile())
      .map((entry) => path.join(entry.parentPath, entry.name))
  }

  const instance = {
    name: NAME,
    ...Transformer(opts.denylist),

    // Page type: a non-empty `annotation-target` makes a note an annotation page. Above
    // content-page (0), whose pages these would otherwise be.
    priority: 30,
    match: ({ fileData }: { fileData: File["data"] }) => annotationTarget(fileData?.frontmatter) !== undefined,
    layout: "annotation",
    frame: "full-width",
    body: () => body,

    // Emitter.
    async emit(ctx: Ctx, content: Content) {
      const files = content.map(([, file]) => file)
      return [...(await mirror(ctx, files)), ...(await viewerFiles(ctx, files))]
    },
    // Under `serve`, only pages that were added or changed can name a new source document. Output
    // is not cleaned between rebuilds, so every other mirror is still in place.
    async partialEmit(ctx: Ctx, _content: Content, _resources: unknown, changes: ChangeEvent[]) {
      const files = changes.filter((change) => change.type !== "delete").map((change) => change.file)
      return [...(await mirror(ctx, files)), ...(await viewerFiles(ctx, files))]
    },

    // ADR-0003 rule 11: the stylesheet goes in the family layer, `cgc.annotator`, from here. It is
    // global, like every plugin stylesheet in Quartz 5, so SPA navigation never drops it.
    externalResources(ctx: object) {
      if (!stylesheetOwner.has(ctx)) stylesheetOwner.set(ctx, instance)
      if (stylesheetOwner.get(ctx) !== instance) return {}
      return { css: [{ content: __CGC_ANNOTATOR_CSS__, inline: true }] }
    },
  }
  return instance
}
