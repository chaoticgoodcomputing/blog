// quartz-mdx: a page type that serves `.mdx` pages through Quartz's configured pipeline, and an
// emitter that writes the widget chunks those pages load. Both halves share one compile per build.
// A transformer points links written without the extension at the pages.
// Contract: docs/adr/0001 (widgets are real imports, the body stays Quartz's), 0002 (islands) and
// 0005 (`.mdx` pages at their own slugs, their clean URLs as aliases), which supersedes 0004.
//
// `generate` is async, which needs a vendored change to Quartz: see the vendored-changes table in
// quartz/VENDORED.md (upstream proposal: #25).
import fs from "node:fs"
import path from "node:path"
import { h } from "preact"
import { toHtml } from "hast-util-to-html"
import { visit } from "unist-util-visit"
import { pathToRoot, slugifyFilePath } from "@quartz-community/utils/path"
import { createPipeline } from "@chaoticgoodcomputing/pipeline"
import { islandAttributes, islandRuntime } from "@chaoticgoodcomputing/island-runtime"
import remarkMdx from "remark-mdx"
import { bundleWidgets, refKey, type Bundle } from "./bundle"
import { collectIslands, ISLAND_CLASS, MdxError, type IslandUse } from "./islands"
import { EXT, cleanUrl, mdxLinks } from "./links"

/** The plugin's options, the same for each of its factories. */
export interface Options {
  /**
   * Each `.mdx` page's clean URL (`lab/life` for `lab/life.mdx`) is added to its aliases, so stock
   * alias-redirects, where a site has it, redirects the clean URL to the page. On by default.
   */
  cleanUrlAliases?: boolean
}
const DEFAULTS: Required<Options> = { cleanUrlAliases: true }

interface Page {
  slug: string
  title: string
  data: Record<string, unknown>
}

// Keyed by build, not cached across them: `serve` rebuilds with a fresh buildId.
let compiled: { buildId: string; result: Promise<{ pages: Page[]; bundle: Bundle }> } | undefined
function compile(ctx: any, options: Required<Options>) {
  if (compiled?.buildId !== ctx.buildId) compiled = { buildId: ctx.buildId, result: compileCorpus(ctx, options) }
  return compiled!.result
}

async function compileCorpus(ctx: any, options: Required<Options>) {
  // The site's configured pipeline, as a `.md` page gets it (proven at parity on #19), plus MDX.
  const pipeline = createPipeline(ctx, {
    markdownPlugins: {
      // Registered before the Latex transformer's remark-math, which then claims `$…$` first and
      // keeps acorn from choking on `{…}` inside inline maths.
      before: [remarkMdx],
      // Turns what remark-mdx parsed into something remark-rehype understands, so it runs last.
      after: [collectIslands],
    },
  })
  const rendered = []
  for (const relativePath of (ctx.allFiles ?? []).filter((fp: string) => fp.endsWith(EXT))) {
    const fullPath = path.join(ctx.argv.directory, relativePath)
    // Core's slug for the file, extension kept, as stock page types keep `.canvas` and `.base`.
    const slug = slugifyFilePath(relativePath as any) as string
    const { hast, file } = await pipeline.run(fs.readFileSync(fullPath, "utf8"), { filePath: fullPath, relativePath, slug })
    rendered.push({ relativePath, fullPath, slug, hast, file, uses: (file.data.cgcMdxUses ?? []) as IslandUse[] })
  }

  const bundle = await bundleWidgets(
    rendered.flatMap((r) => r.uses.map((use) => ({ page: r.relativePath, resolveDir: path.dirname(r.fullPath), ...use }))),
  )

  const pages = rendered.map(({ relativePath, fullPath, slug, hast, file, uses }) => {
    const css = new Set<string>()
    visit(hast, "element", (el: any) => {
      const index = el.properties?.dataCgcUse
      if (index === undefined) return
      const use = uses[Number(index)]
      const widget = bundle.widgets.get(refKey({ resolveDir: path.dirname(fullPath), ...use }))!
      let html: string
      try {
        html = widget.ssr(use.props)
      } catch (err) {
        throw new MdxError(`${relativePath}: <${use.imported}> from "${use.specifier}" threw while rendering: ${(err as Error).message}`)
      }
      if (widget.css) css.add(widget.css)
      delete el.properties.dataCgcUse
      Object.assign(el.properties, islandAttributes({ entry: widget.entry, css: widget.css, directive: use.directive, props: use.props }))
      el.children = [{ type: "raw", value: html }]
    })
    const data = file.data as any
    // The clean URL as an alias, unless it is some other page's slug, which a redirect would overwrite.
    const alias = cleanUrl(relativePath)
    const aliases: string[] = data.aliases ?? []
    if (options.cleanUrlAliases && !ctx.allSlugs?.includes(alias) && !aliases.includes(alias)) aliases.push(alias)
    return {
      slug,
      title: data.frontmatter?.title ?? path.basename(relativePath, EXT),
      // What the pipeline derived, as a `.md` page would carry it, so layout components (TOC,
      // backlinks, tags, search) treat the page like any other.
      data: { ...data, ...(aliases.length && { aliases }), filePath: fullPath, relativePath, slug, cgcMdxHtml: toHtml(hast as any, { allowDangerousHtml: true }), cgcMdxCss: [...css] },
    }
  })
  return { pages, bundle }
}

// Markup mirrors @quartz-community/content-page's body, so stylesheets aimed at `.md` pages apply.
const Body = () => {
  const Component = ({ fileData }: any) =>
    h(
      "article",
      { class: ["popover-hint", ...(fileData?.frontmatter?.cssclasses ?? [])].join(" ") },
      h("div", { class: "markdown-preview-view markdown-rendered", dangerouslySetInnerHTML: { __html: fileData?.cgcMdxHtml ?? "" } }),
    )
  // The island runtime, hydrating this plugin's markers only (ADR-0002).
  Component.afterDOMLoaded = islandRuntime(`.${ISLAND_CLASS}`)
  return Component
}

// Two factories, one per shape, as stock plugins with more than one role export them: the loader
// picks the one whose instance fits each category the manifest declares. One object for every role
// would have Quartz collect this plugin's `externalResources` twice, as a transformer and as an
// emitter.

/** The page type and the emitter: one object fits both shapes. */
export function CgcMdx(opts?: Options) {
  const options = { ...DEFAULTS, ...opts }
  return {
    name: "cgc-mdx",
    // Page type.
    priority: 25,
    fileExtensions: [EXT],
    // Virtual pages are routed by the page type that generated them; this only claims our own.
    match: ({ fileData }: any) => typeof fileData?.cgcMdxHtml === "string",
    async generate({ ctx }: any) {
      return (await compile(ctx, options)).pages
    },
    layout: "content",
    body: Body,
    // Emitter.
    // A page's widget CSS goes in its served <head>, so the build-time markup is styled on first
    // paint. Persisted, so SPA navigation never strips it; the runtime adds what a navigation lacks.
    externalResources: () => ({
      additionalHead: [
        (fileData: any) =>
          (fileData.cgcMdxCss ?? []).map((href: string) =>
            h("link", { rel: "stylesheet", href: `${pathToRoot(fileData.slug)}/${href}`, "data-persist": "" }),
          ),
      ],
    }),
    async emit(ctx: any) {
      const { bundle } = await compile(ctx, options)
      const written: string[] = []
      for (const file of bundle.files) {
        const dest = path.join(ctx.argv.output, file.path)
        await fs.promises.mkdir(path.dirname(dest), { recursive: true })
        await fs.promises.writeFile(dest, file.contents)
        written.push(dest)
      }
      return written
    },
  }
}

/**
 * The transformer: points every link to an `.mdx` page's clean URL at the page, before crawl-links
 * resolves it, for every page Quartz parses and for the `.mdx` pages themselves, whose pipeline is
 * rebuilt from the configured transformers, this one included. Takes the plugin's options, as each
 * factory does, and needs none of them.
 */
export function CgcMdxLinks(_opts?: Options) {
  return {
    name: "cgc-mdx-links",
    htmlPlugins(ctx: any) {
      return [mdxLinks(ctx)]
    },
  }
}
