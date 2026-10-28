// Builds the plugin into dist/: src/main.tsx bundled by esbuild as main.js, as Obsidian loads a
// plugin, beside a copy of manifest.json. `--watch` rebuilds on every change.
//
// `import x from "./<folder>!zipStringEncoded"` imports a folder of the package as a zip, encoded as
// base64: how the plugin carries the files it serves its frames (src/resourcesFolder.tsx). It
// replaces upstream's rollup plugin of the same name, which encoded the zip as a binary string.

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import esbuild from "esbuild"
import JSZip from "jszip"

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const dist = path.join(root, "dist")
const watch = process.argv.includes("--watch")

// The modules Obsidian provides to a plugin at run time, which are never bundled.
const provided = ["obsidian", "electron", "@codemirror/*", "@lezer/*"]

const ZIP_SUFFIX = "!zipStringEncoded"
const FIXED_DATE = new Date("2000-01-01T00:00:00Z")

/** Every file under `folder`, as paths relative to it, with `/` between their parts. */
function filesUnder(folder) {
  return fs
    .readdirSync(folder, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.relative(folder, path.join(entry.parentPath, entry.name)).split(path.sep).join("/"))
}

const zippedFolders = {
  name: "zip-string-encoded",
  setup(build) {
    build.onResolve({ filter: /!zipStringEncoded$/ }, (args) => ({
      path: path.resolve(root, args.path.slice(0, -ZIP_SUFFIX.length)),
      namespace: "zipped-folder",
    }))
    build.onLoad({ filter: /.*/, namespace: "zipped-folder" }, async (args) => {
      const zip = new JSZip()
      const files = filesUnder(args.path).sort()
      // A fixed date for every entry, so that the same files make the same zip, and the same build.
      for (const file of files) zip.file(file, fs.readFileSync(path.join(args.path, file)), { date: FIXED_DATE, createFolders: false })
      const base64 = await zip.generateAsync({ type: "base64", compression: "DEFLATE", compressionOptions: { level: 9 } })
      return {
        contents: `export default ${JSON.stringify(base64)}`,
        loader: "js",
        watchFiles: files.map((file) => path.join(args.path, file)),
        watchDirs: [args.path],
      }
    })
  },
}

const copyManifest = {
  name: "copy-manifest",
  setup(build) {
    build.onEnd(() => {
      fs.mkdirSync(dist, { recursive: true })
      fs.copyFileSync(path.join(root, "manifest.json"), path.join(dist, "manifest.json"))
    })
  },
}

const options = {
  absWorkingDir: root,
  entryPoints: ["src/main.tsx"],
  outfile: path.join(dist, "main.js"),
  bundle: true,
  format: "cjs",
  platform: "browser",
  target: "es2021",
  external: provided,
  define: { "process.env.NODE_ENV": JSON.stringify(watch ? "development" : "production") },
  minify: !watch,
  sourcemap: watch ? "inline" : false,
  legalComments: "eof",
  logLevel: "info",
  plugins: [zippedFolders, copyManifest],
}

if (watch) {
  const context = await esbuild.context(options)
  await context.watch()
} else {
  fs.rmSync(dist, { recursive: true, force: true })
  await esbuild.build(options)
}
