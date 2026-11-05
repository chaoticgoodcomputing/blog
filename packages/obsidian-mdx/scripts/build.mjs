// Builds the plugin into dist/, laid out as its folder in a vault is: main.js (src/main.ts,
// bundled as CommonJS, as Obsidian loads a plugin), manifest.json, styles.css, LICENSE.md and NOTICE.md.
// `--watch` rebuilds on every change, unminified, with inline source maps.

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import esbuild from "esbuild"

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const dist = path.join(root, "dist")
const watch = process.argv.includes("--watch")

fs.rmSync(dist, { recursive: true, force: true })
fs.mkdirSync(dist, { recursive: true })
for (const file of ["manifest.json", "styles.css", "LICENSE.md", "NOTICE.md"]) {
  fs.copyFileSync(path.join(root, file), path.join(dist, file))
}

const options = {
  entryPoints: [path.join(root, "src", "main.ts")],
  outfile: path.join(dist, "main.js"),
  bundle: true,
  format: "cjs",
  platform: "browser",
  target: "es2022",
  // Obsidian provides these to a plugin at run time.
  external: ["obsidian", "electron", "@codemirror/*", "@lezer/*"],
  minify: !watch,
  sourcemap: watch ? "inline" : false,
  logLevel: "info",
}

if (watch) await (await esbuild.context(options)).watch()
else await esbuild.build(options)
