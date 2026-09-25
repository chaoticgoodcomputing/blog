// Captures `v4-head.json`: what the v4 site (the repo-root `quartz/`, with the root
// `quartz.config.ts`) puts in the head of each page in `content.mjs`. The v4 copy is deleted at
// cutover, and this script with it; the JSON it wrote stays as the record of v4's output.
//
// Usage, from the repo root, with the root's pnpm install in place:
//   node quartz-v5/plugins/cgc-seo/e2e/v4-parity/capture.mjs
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { execFileSync } from "node:child_process"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import { CONTENT, URLS, extractHead } from "./content.mjs"

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, "../../../../..")
const testsRoot = path.join(repoRoot, "quartz-v5/tests")
const { chromium } = createRequire(path.join(testsRoot, "package.json"))("@playwright/test")
const { fileFor } = await import(path.join(testsRoot, "harness/site.mjs"))

const content = fs.mkdtempSync(path.join(os.tmpdir(), "cgc-seo-v4-content-"))
const output = fs.mkdtempSync(path.join(os.tmpdir(), "cgc-seo-v4-public-"))
for (const [rel, text] of Object.entries(CONTENT)) {
  fs.mkdirSync(path.dirname(path.join(content, rel)), { recursive: true })
  fs.writeFileSync(path.join(content, rel), text)
}
execFileSync("node", ["quartz/bootstrap-cli.mjs", "build", "-d", content, "-o", output], { cwd: repoRoot, stdio: "inherit" })

const browser = await chromium.launch()
const page = await browser.newPage({ javaScriptEnabled: false })
const heads = {}
for (const url of URLS) {
  await page.setContent(fs.readFileSync(fileFor(output, url).file, "utf8"))
  heads[url] = await page.evaluate(extractHead)
}
await browser.close()

const commit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot, encoding: "utf8" }).trim()
fs.writeFileSync(path.join(here, "v4-head.json"), JSON.stringify({ capturedFrom: commit, heads }, null, 2) + "\n")
fs.rmSync(content, { recursive: true, force: true })
fs.rmSync(output, { recursive: true, force: true })
console.log(`captured ${URLS.length} heads from v4 at ${commit}`)
