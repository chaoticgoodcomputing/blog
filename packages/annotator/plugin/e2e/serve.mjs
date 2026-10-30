// The end-to-end suite's server: the built plugin's pages (dist/frames, from `build`) under
// /frames/, its OCR worker's files (dist/ocr) under /ocr/, the harness page that stands in for
// Obsidian at /, and the fixture PDFs: the plugin's, and pdf-ocr's scanned one. The harness is
// opened at localhost and reads the pages' files at 127.0.0.1, another origin, as Obsidian's window
// reads the plugin's folder at an `app://` origin of its own.
//
//   node --experimental-strip-types e2e/serve.mjs [port]

import fs from "node:fs"
import http from "node:http"
import path from "node:path"
import { fileURLToPath } from "node:url"
import esbuild from "esbuild"
import { fixturePdf } from "./fixture-pdf.mjs"
import { scannedPdf } from "../../../pdf-ocr/test/fixture-pdf.ts"

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const frames = path.join(root, "dist", "frames")
const ocr = path.join(root, "dist", "ocr")
const port = Number(process.argv[2] ?? 4317)

if (!fs.existsSync(path.join(frames, "viewer.html"))) {
  console.error("No build in dist/: build the plugin first.")
  process.exit(1)
}

const host = await esbuild.build({
  absWorkingDir: root,
  entryPoints: ["e2e/harness/host.ts"],
  bundle: true,
  format: "iife",
  target: "chrome120",
  write: false,
})

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".wasm": "application/wasm",
}

const routes = {
  // With Obsidian's own Content Security Policy (its index.html), which the pages, made by this one
  // as `blob:` documents, live under as they do in Obsidian.
  "/": ["text/html; charset=utf-8", '<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="style-src \'unsafe-inline\' \'self\' https://fonts.googleapis.com"><title>Harness</title><style>html,body{margin:0;height:100%}iframe{border:0;width:100%;height:100%}</style><body><script src="/host.js"></script></body>'],
  "/host.js": ["text/javascript", host.outputFiles[0].contents],
  "/fixture.pdf": ["application/pdf", fixturePdf()],
  "/scanned.pdf": ["application/pdf", scannedPdf()],
}

http
  .createServer((request, response) => {
    const { pathname } = new URL(request.url, "http://localhost")
    const route = routes[pathname]
    if (route) {
      response.writeHead(200, { "Content-Type": route[0] }).end(route[1])
      return
    }
    for (const [prefix, folder] of [["/frames/", frames], ["/ocr/", ocr]]) {
      if (!pathname.startsWith(prefix)) continue
      const file = path.join(folder, decodeURIComponent(pathname.slice(prefix.length)))
      if (file.startsWith(folder) && fs.existsSync(file) && fs.statSync(file).isFile()) {
        // The pages' files are read from another origin than the harness's, as in Obsidian.
        response.writeHead(200, { "Content-Type": TYPES[path.extname(file)] ?? "application/octet-stream", "Access-Control-Allow-Origin": "*" })
        fs.createReadStream(file).pipe(response)
        return
      }
    }
    response.writeHead(404).end()
  })
  .listen(port, () => console.log(`Serving the end-to-end harness on http://localhost:${port}/`))
