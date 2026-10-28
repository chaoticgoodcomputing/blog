// Builds the plugin into dist/, laid out as its folder in a vault is:
//
//   main.js, manifest.json     the plugin, as Obsidian loads one (src/main.ts, bundled)
//   frames/viewer.html, .js    the viewer page: the PDF, with the Hypothesis client in it (frames/)
//   frames/sidebar.html, .js   the sidebar page, with the fake service's fetch
//   frames/hypothesis/build/   the Hypothesis client, as the `hypothesis` package publishes it
//   frames/pdfjs/              PDF.js's worker, viewer styles, and the data it loads (CMaps, fonts, …)
//   LICENSE.TXT, NOTICE.md,    the plugin's license, and the notices of the work in it
//   licenses/
//
// Obsidian serves files of a plugin's folder by resource URL, which is how the plugin opens its
// pages (src/view.ts). `--watch` rebuilds on every change, unminified, with source maps.

import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import esbuild from "esbuild"

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const dist = path.join(root, "dist")
const frames = path.join(dist, "frames")
const watch = process.argv.includes("--watch")
const require = createRequire(path.join(root, "package.json"))

/** A package's folder, as this package resolves it. */
const packageDir = (name) => path.dirname(require.resolve(`${name}/package.json`))

// The modules Obsidian provides to a plugin at run time, which are never bundled.
const provided = ["obsidian", "electron", "@codemirror/*", "@lezer/*"]

/** Copies files and folders into dist/, as [from, to] pairs, `to` relative to dist/. */
function copy(pairs) {
  for (const [from, to] of pairs) {
    const target = path.join(dist, to)
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.cpSync(from, target, { recursive: true })
  }
}

const hypothesis = packageDir("hypothesis")
const pdfjs = packageDir("pdfjs-dist")

function copyAssets() {
  const clientBuild = path.join(hypothesis, "build")
  copy([
    [path.join(root, "manifest.json"), "manifest.json"],
    [path.join(root, "LICENSE.TXT"), "LICENSE.TXT"],
    [path.join(root, "NOTICE.md"), "NOTICE.md"],
    [path.join(root, "licenses"), "licenses"],
    ...["viewer.html", "viewer.css", "sidebar.html"].map((page) => [path.join(root, "frames", page), `frames/${page}`]),
    // The client, with its license; not its source maps, which are most of its size.
    ...fs
      .readdirSync(clientBuild, { recursive: true })
      .filter((file) => !file.endsWith(".map") && fs.statSync(path.join(clientBuild, file)).isFile())
      .map((file) => [path.join(clientBuild, file), `frames/hypothesis/build/${file}`]),
    [path.join(hypothesis, "LICENSE"), "frames/hypothesis/LICENSE"],
    // PDF.js: the worker, the viewer's styles and images, and the data a document may need. Each
    // folder carries its own licenses.
    [path.join(pdfjs, "build", "pdf.worker.min.mjs"), "frames/pdfjs/build/pdf.worker.min.mjs"],
    [path.join(pdfjs, "web", "pdf_viewer.css"), "frames/pdfjs/web/pdf_viewer.css"],
    [path.join(pdfjs, "web", "images"), "frames/pdfjs/web/images"],
    ...["cmaps", "standard_fonts", "wasm", "iccs"].map((folder) => [path.join(pdfjs, folder), `frames/pdfjs/${folder}`]),
    [path.join(pdfjs, "LICENSE"), "frames/pdfjs/LICENSE"],
  ])
}

const shared = {
  absWorkingDir: root,
  bundle: true,
  minify: !watch,
  sourcemap: watch ? "inline" : false,
  legalComments: "eof",
  logLevel: "info",
  define: { "process.env.NODE_ENV": JSON.stringify(watch ? "development" : "production") },
}

const builds = [
  // The plugin, as Obsidian loads one: CommonJS, Obsidian's own modules left out.
  {
    ...shared,
    entryPoints: ["src/main.ts"],
    outfile: path.join(dist, "main.js"),
    format: "cjs",
    platform: "browser",
    target: "es2022",
    external: provided,
    plugins: [{ name: "copy-assets", setup: (build) => build.onEnd(copyAssets) }],
  },
  // The pages' scripts, loaded as classic scripts in Obsidian's Chromium.
  {
    ...shared,
    entryPoints: { viewer: "frames/viewer.ts", sidebar: "frames/sidebar.ts" },
    // Bundling drops PDF.js's license comments, which esbuild doesn't know to keep; its license is
    // copied beside the page (frames/pdfjs/LICENSE), and named here.
    banner: { js: "/*! The Annotator's viewer page. Includes PDF.js (pdfjs-dist), Apache-2.0, (c) Mozilla Foundation: see pdfjs/LICENSE. */" },
    outdir: frames,
    format: "iife",
    platform: "browser",
    target: "chrome120",
  },
]

if (watch) {
  for (const options of builds) await (await esbuild.context(options)).watch()
} else {
  fs.rmSync(dist, { recursive: true, force: true })
  await Promise.all(builds.map((options) => esbuild.build(options)))
}
