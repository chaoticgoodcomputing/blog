// cgc-mdx: a page type that serves `.mdx` pages through Quartz's configured pipeline, and an
// emitter that writes the widget chunks those pages load. Both halves share one compile per build.
// Contract: docs/adr/0001 (widgets are real imports, the body stays Quartz's) and 0002 (islands).
//
// `generate` is async, which needs a vendored change to Quartz: see the vendored-changes table in
// quartz-v5/VENDORED.md (upstream proposal: #25).
import fs from "node:fs"
import path from "node:path"
import { h } from "preact"
import { toHtml } from "hast-util-to-html"
import { visit } from "unist-util-visit"
import { pathToRoot, slugifyFilePath } from "@quartz-community/utils/path"
import { renderMdx } from "./pipeline"
import { bundleWidgets, refKey, type Bundle } from "./bundle"
import { MdxError, type IslandUse } from "./islands"
import runtime from "./islands.inline.js"

const EXT = ".mdx"

interface Page {
  slug: string
  title: string
  data: Record<string, unknown>
}

// Keyed by build, not cached across them: `serve` rebuilds with a fresh buildId.
let compiled: { buildId: string; result: Promise<{ pages: Page[]; bundle: Bundle }> } | undefined
function compile(ctx: any) {
  if (compiled?.buildId !== ctx.buildId) compiled = { buildId: ctx.buildId, result: compileCorpus(ctx) }
  return compiled!.result
}

async function compileCorpus(ctx: any) {
  const rendered = []
  for (const relativePath of (ctx.allFiles ?? []).filter((fp: string) => fp.endsWith(EXT))) {
    const fullPath = path.join(ctx.argv.directory, relativePath)
    // Strip `.mdx` so the page lives at a clean URL: v5's slugifier only strips `.md`/`.html` (#23).
    const slug = slugifyFilePath((relativePath.slice(0, -EXT.length) + ".md") as any)
    const { hast, file } = await renderMdx(ctx, fs.readFileSync(fullPath, "utf8"), fullPath, relativePath, slug)
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
      Object.assign(el.properties, {
        dataCgcEntry: widget.entry,
        dataCgcCss: widget.css,
        dataCgcHydrate: use.directive,
        dataCgcProps: JSON.stringify(use.props),
      })
      el.children = [{ type: "raw", value: html }]
    })
    const data = file.data as any
    return {
      slug,
      title: data.frontmatter?.title ?? path.basename(relativePath, EXT),
      // What the pipeline derived, as a `.md` page would carry it, so layout components (TOC,
      // backlinks, tags, search) treat the page like any other.
      data: { ...data, filePath: fullPath, relativePath, slug, cgcMdxHtml: toHtml(hast as any, { allowDangerousHtml: true }), cgcMdxCss: [...css] },
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
  Component.afterDOMLoaded = runtime
  return Component
}

export default function CgcMdx() {
  return {
    name: "cgc-mdx",
    // Page type.
    priority: 25,
    fileExtensions: [EXT],
    // Virtual pages are routed by the page type that generated them; this only claims our own.
    match: ({ fileData }: any) => typeof fileData?.cgcMdxHtml === "string",
    async generate({ ctx }: any) {
      return (await compile(ctx)).pages
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
      const { bundle } = await compile(ctx)
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
