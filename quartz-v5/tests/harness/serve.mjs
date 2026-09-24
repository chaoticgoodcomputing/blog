// Static server for a built fixture site, with Quartz's extensionless URLs.
// Usage: node harness/serve.mjs <variant> <port>
import http from "node:http"
import fs from "node:fs"
import path from "node:path"
import { outputFor } from "./site.mjs"

const [variant = "main", port = "4173"] = process.argv.slice(2)
const root = outputFor(variant)
const TYPES = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".webp": "image/webp", ".xml": "application/xml" }

http.createServer((req, res) => {
  const url = decodeURIComponent(new URL(req.url, "http://x").pathname)
  const hit = [url, `${url}.html`, path.join(url, "index.html")]
    .map((candidate) => path.join(root, candidate))
    .find((file) => fs.existsSync(file) && fs.statSync(file).isFile())
  const file = hit ?? path.join(root, "404.html")
  res.writeHead(hit ? 200 : 404, { "content-type": TYPES[path.extname(file)] ?? "application/octet-stream" })
  fs.createReadStream(file).pipe(res)
}).listen(Number(port))
