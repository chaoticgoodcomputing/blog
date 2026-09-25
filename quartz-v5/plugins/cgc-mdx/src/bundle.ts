// Bundles every widget the corpus imports (ADR-0001): one browser build with code splitting, so a
// shared dependency — Preact first of all — loads once, and one Node build that renders each widget
// to HTML at build time (ADR-0002). Imports resolve the way a bundler resolves them, from the page's
// own directory, with no alias and no registry.
import esbuild, { type Plugin } from "esbuild"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { MdxError } from "./islands"
import { layerWidgetCss } from "./layer"

/** A widget as a page refers to it. */
export interface WidgetRef {
  page: string
  resolveDir: string
  specifier: string
  imported: string
}

export interface Widget {
  /** Site-relative path of its browser entry, e.g. `static/cgc-mdx/GameOfLife-XXXX.js`. */
  entry: string
  css?: string
  ssr: (props: Record<string, unknown>) => string
}

export interface Bundle {
  widgets: Map<string, Widget>
  files: { path: string; contents: Uint8Array }[]
}

export const OUT_DIR = "static/cgc-mdx"
export const refKey = (ref: Omit<WidgetRef, "page">) => `${ref.resolveDir}\0${ref.specifier}\0${ref.imported}`

// The Preact this plugin itself resolves: the host Quartz's, since Preact is a peer. Widgets resolve
// Preact from wherever they sit — possibly another copy entirely — so every Preact import is pinned
// here, the way an islands framework owns its renderer. One Preact per page, and it is Quartz's.
const HOST_DIR = path.dirname(fileURLToPath(import.meta.url))
const hostPreact: Plugin = {
  name: "cgc-mdx-host-preact",
  setup(build) {
    build.onResolve({ filter: /^preact(-render-to-string)?(\/.*)?$/ }, (args) => {
      if (args.pluginData === HOST_DIR) return undefined
      return build.resolve(args.path, { kind: args.kind, resolveDir: HOST_DIR, pluginData: HOST_DIR })
    })
  },
}

// Each widget's entry is a virtual module that re-exports it as `default`. The browser entry also
// re-exports Preact's `h`, `hydrate` and `render`, so the runtime drives the widget's own Preact.
function entries(widgets: { name: string; file: string; imported: string }[], target: "browser" | "ssr"): Plugin {
  const byName = new Map(widgets.map((w) => [w.name, w]))
  return {
    name: "cgc-mdx-entries",
    setup(build) {
      build.onResolve({ filter: /^cgc-island:/ }, (args) => ({ path: args.path.slice("cgc-island:".length), namespace: "cgc-island" }))
      build.onLoad({ filter: /.*/, namespace: "cgc-island" }, (args) => {
        const w = byName.get(args.path)!
        const from = JSON.stringify(w.file)
        const contents =
          target === "browser"
            ? `export { ${w.imported} as default } from ${from}\nexport { h, hydrate, render } from "preact"\n`
            : `import { h } from "preact"\nimport render from "preact-render-to-string"\nimport { ${w.imported} as Widget } from ${from}\nexport default (props) => render(h(Widget, props))\n`
        return { contents, resolveDir: path.dirname(w.file), loader: "js" }
      })
    },
  }
}

const shared = {
  bundle: true,
  logLevel: "silent" as const,
  jsx: "automatic" as const,
  jsxImportSource: "preact",
  // Widgets carry no tsconfig of ours, and a stray one above the vault must not re-point JSX.
  tsconfigRaw: { compilerOptions: { jsx: "react-jsx", jsxImportSource: "preact" } } as const,
}

async function resolveAll(refs: WidgetRef[]) {
  const resolved = new Map<string, string>()
  const failures: string[] = []
  await esbuild.build({
    stdin: { contents: "" },
    write: false,
    logLevel: "silent",
    plugins: [
      {
        name: "cgc-mdx-resolve",
        setup(build) {
          build.onStart(async () => {
            for (const ref of refs) {
              const key = refKey(ref)
              if (resolved.has(key)) continue
              const result = await build.resolve(ref.specifier, { resolveDir: ref.resolveDir, kind: "import-statement" })
              if (result.errors.length) failures.push(`${ref.page}: cannot resolve import "${ref.specifier}"`)
              else resolved.set(key, result.path)
            }
          })
        },
      },
    ],
  })
  if (failures.length) throw new MdxError(failures.join("\n"))
  return resolved
}

const formatErrors = (err: any) =>
  (err.errors ?? [err]).map((e: any) => (e.location ? `${e.location.file}:${e.location.line}: ${e.text}` : e.text ?? e.message)).join("\n")

export async function bundleWidgets(refs: WidgetRef[]): Promise<Bundle> {
  const resolved = await resolveAll(refs)

  // One widget per resolved file and export, however many pages and paths reach it.
  const unique = new Map<string, { name: string; file: string; imported: string }>()
  const taken = new Set<string>()
  for (const ref of refs) {
    const file = resolved.get(refKey(ref))!
    const id = `${file}#${ref.imported}`
    if (unique.has(id)) continue
    const base = (ref.imported === "default" ? path.basename(file).replace(/\.[^.]+$/, "") : ref.imported).replace(/[^\w-]/g, "_")
    let name = base
    for (let n = 2; taken.has(name); n++) name = `${base}${n}`
    taken.add(name)
    unique.set(id, { name, file, imported: ref.imported })
  }
  const list = [...unique.values()]
  const widgets = new Map<string, Widget>()
  if (!list.length) return { widgets, files: [] }

  const outdir = path.join(os.tmpdir(), "cgc-mdx-out")
  let browser
  try {
    browser = await esbuild.build({
      ...shared,
      entryPoints: Object.fromEntries(list.map((w) => [w.name, `cgc-island:${w.name}`])),
      outdir,
      entryNames: "[name]-[hash]",
      chunkNames: "chunk-[hash]",
      assetNames: "[name]-[hash]",
      splitting: true,
      format: "esm",
      platform: "browser",
      target: "es2020",
      minify: true,
      metafile: true,
      write: false,
      plugins: [hostPreact, entries(list, "browser")],
    })
  } catch (err) {
    throw new MdxError(`widget bundle failed:\n${formatErrors(err)}`)
  }

  const ssrDir = fs.mkdtempSync(path.join(os.tmpdir(), "cgc-mdx-ssr-"))
  try {
    const ssr = await esbuild.build({
      ...shared,
      entryPoints: Object.fromEntries(list.map((w) => [w.name, `cgc-island:${w.name}`])),
      outdir: ssrDir,
      format: "esm",
      platform: "node",
      target: "node20",
      loader: { ".css": "empty" },
      metafile: true,
      plugins: [hostPreact, entries(list, "ssr")],
    })
    const renderers = new Map<string, (props: Record<string, unknown>) => string>()
    for (const [out, meta] of Object.entries(ssr.metafile!.outputs)) {
      const name = meta.entryPoint?.replace(/^cgc-island:/, "")
      if (name) renderers.set(name, (await import(pathToFileURL(path.resolve(out)).href)).default)
    }

    const outputs = browser.metafile!.outputs
    const siteRel = (abs: string) => `${OUT_DIR}/${path.relative(outdir, abs).split(path.sep).join("/")}`
    const byName = new Map<string, Widget>()
    for (const [out, meta] of Object.entries(outputs)) {
      const name = meta.entryPoint?.replace(/^cgc-island:/, "")
      if (!name) continue
      byName.set(name, {
        entry: siteRel(path.resolve(out)),
        css: meta.cssBundle ? siteRel(path.resolve(meta.cssBundle)) : undefined,
        ssr: renderers.get(name)!,
      })
    }
    for (const ref of refs) {
      const w = unique.get(`${resolved.get(refKey(ref))}#${ref.imported}`)!
      widgets.set(refKey(ref), byName.get(w.name)!)
    }
    return {
      widgets,
      // All widget CSS lands in the widget layer, whatever the widget's source (ADR-0002).
      files: browser.outputFiles!.map((f) => ({
        path: siteRel(f.path),
        contents: f.path.endsWith(".css") ? new TextEncoder().encode(layerWidgetCss(f.text)) : f.contents,
      })),
    }
  } catch (err) {
    if (err instanceof MdxError) throw err
    throw new MdxError(`widget bundle failed:\n${formatErrors(err)}`)
  } finally {
    fs.rmSync(ssrDir, { recursive: true, force: true })
  }
}
