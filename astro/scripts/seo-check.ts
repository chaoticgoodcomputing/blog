// `pnpm nx run astro:seo-check`: runs Lighthouse, through Unlighthouse, on every page of the
// sitemap of the site as built, and prints each category's score and the SEO and accessibility
// audits that fail, with what each points at.
// Unlighthouse's report, every audit of every page, is written to dist/seo-check (open
// dist/seo-check/index.html); its results as JSON are dist/seo-check/ci-result.json.
//
// The site is served by `astro preview` on a free port of its own, beside any other preview
// (`--ignore-lock`), so a dev server or another preview is never the one read. Every page in the sitemap is scanned: Unlighthouse's
// sampling, which scans a few pages of each kind, is off. A page is reached at its path on the
// preview, and its canonical address stays the live site's, so Lighthouse's canonical audit reads
// the address the site publishes.
//
// `--summary` prints the last report's summary again, without scanning: `pnpm run seo-check --summary`.
//
// SEO_CHECK_BUDGET, a score from 1 to 100, fails the check when a page scores under it in any
// category. Without it, the check only reports.

import { spawn, type ChildProcess } from "node:child_process"
import fs from "node:fs"
import net from "node:net"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = fileURLToPath(new URL("..", import.meta.url))
const DIST = path.join(ROOT, "dist")
const OUT = fileURLToPath(new URL("../../dist/seo-check", import.meta.url))
const CATEGORIES = ["seo", "accessibility", "best-practices", "performance"] as const
// The categories whose failing audits are listed, page by page. Lighthouse's SEO category includes
// image alt text, link text, the canonical address and whether a page may be indexed.
const CHECKED = ["seo", "accessibility"] as const

/** The path of each page in the built site's sitemaps. */
function sitemapPaths(): string[] {
  const locs = (file: string) =>
    [...fs.readFileSync(path.join(DIST, file), "utf8").matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => new URL(match[1]))
  const urlsets = locs("sitemap-index.xml").map((url) => path.basename(url.pathname))
  return urlsets.flatMap(locs).map((url) => decodeURI(url.pathname))
}

/** A port nothing is listening on. */
function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.once("error", reject)
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address() as net.AddressInfo
      server.close(() => resolve(port))
    })
  })
}

async function waitFor(url: string, server: ChildProcess) {
  for (let tries = 0; tries < 60; tries++) {
    if (server.exitCode !== null) throw new Error("astro preview stopped before it served the site")
    try {
      if ((await fetch(url)).ok) return
    } catch {}
    await new Promise((done) => setTimeout(done, 500))
  }
  throw new Error(`astro preview never served ${url}`)
}

const run = (command: string, args: string[]) =>
  new Promise<number>((resolve) => {
    const child = spawn(command, args, { cwd: ROOT, stdio: "inherit" })
    child.on("exit", (code) => resolve(code ?? 1))
  })

/** A page's scores, as Unlighthouse's ci-result.json gives them, each from 0 to 1. */
interface Route {
  path: string
  categories: Record<string, { score: number | null }>
}

interface Audit {
  title: string
  score: number | null
  details?: { items?: Record<string, unknown>[] }
}

interface Report {
  categories: Record<string, { auditRefs: { id: string; weight: number }[] }>
  audits: Record<string, Audit>
}

/** A page's Lighthouse result, which its HTML report holds as JSON. */
function reportOf(route: string): Report | undefined {
  const file = path.join(OUT, "reports", route.replace(/^\//, ""), "lighthouse.html")
  if (!fs.existsSync(file)) return undefined
  const json = /window\.__LIGHTHOUSE_JSON__ = (\{.*?\});\s*<\/script>/s.exec(fs.readFileSync(file, "utf8"))?.[1]
  return json ? (JSON.parse(json) as Report) : undefined
}

/** What an audit's item points at: the element's snippet, else its address or text. */
function itemOf(item: Record<string, unknown>): string | undefined {
  const node = item.node as { snippet?: string } | undefined
  // A link's text and where it goes, as the link-text audit gives them.
  if (typeof item.text === "string" && typeof item.href === "string") return `"${item.text}" → ${item.href}`
  const text = node?.snippet ?? item.href ?? item.url ?? item.text ?? item.source
  return typeof text === "string" ? text.replace(/\s+/g, " ").slice(0, 140) : undefined
}

/** Each category's lowest and mean score, then each failing audit of `CHECKED`, with its pages and what it points at. */
function summarize(routes: Route[]) {
  const pct = (score: number | null | undefined) => (typeof score === "number" ? Math.round(score * 100) : undefined)
  console.log(`\n${routes.length} pages. Lowest and mean score of each category:`)
  for (const category of CATEGORIES) {
    const scores = routes.map((route) => pct(route.categories[category]?.score)).filter((score) => score !== undefined)
    if (!scores.length) continue
    const mean = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    console.log(`  ${category.padEnd(15)} lowest ${String(Math.min(...scores)).padStart(3)}   mean ${String(mean).padStart(3)}`)
  }

  const failing = new Map<string, { title: string; pages: { path: string; items: string[] }[] }>()
  for (const route of routes) {
    const report = reportOf(route.path)
    if (!report) continue
    for (const category of CHECKED) {
      for (const { id, weight } of report.categories[category]?.auditRefs ?? []) {
        const audit = report.audits[id]
        if (!weight || audit?.score === null || audit === undefined || audit.score >= 1) continue
        const key = `${category}/${id}`
        const entry = failing.get(key) ?? { title: audit.title, pages: [] }
        entry.pages.push({ path: route.path, items: (audit.details?.items ?? []).map(itemOf).filter((each) => each !== undefined) })
        failing.set(key, entry)
      }
    }
  }
  if (!failing.size) console.log(`\nNo ${CHECKED.join(" or ")} audit fails on any page.`)
  const byPages = [...failing].sort(([, a], [, b]) => b.pages.length - a.pages.length)
  for (const [key, { title, pages }] of byPages) {
    console.log(`\n✗ ${key}: ${title} (${pages.length} page${pages.length === 1 ? "" : "s"})`)
    for (const page of pages.slice(0, 5)) {
      console.log(`    ${page.path}`)
      for (const item of page.items.slice(0, 3)) console.log(`      ${item}`)
    }
    if (pages.length > 5) console.log(`    … and ${pages.length - 5} more`)
  }
  console.log(`\nThe full report: ${path.relative(process.cwd(), path.join(OUT, "index.html"))}`)
}

const RESULT = path.join(OUT, "ci-result.json")
const readRoutes = () => (JSON.parse(fs.readFileSync(RESULT, "utf8")) as { routes: Route[] }).routes

async function main() {
  // `--summary` prints the last report's summary again, without scanning.
  if (process.argv.includes("--summary")) {
    if (!fs.existsSync(RESULT)) throw new Error(`No report in ${OUT}: run the check first`)
    return summarize(readRoutes())
  }
  if (!fs.existsSync(path.join(DIST, "sitemap-index.xml"))) throw new Error("No built site in astro/dist: build it first")
  const paths = sitemapPaths()
  const port = await freePort()
  const site = `http://127.0.0.1:${port}`

  const server = spawn("pnpm", ["exec", "astro", "preview", "--ignore-lock", "--host", "127.0.0.1", "--port", String(port)], {
    cwd: ROOT,
    stdio: "ignore",
  })
  try {
    await waitFor(`${site}/`, server)
    console.log(`Scanning ${paths.length} pages of the site as built, served at ${site}`)
    fs.rmSync(OUT, { recursive: true, force: true })
    const budget = process.env.SEO_CHECK_BUDGET
    const code = await run("pnpm", [
      "exec",
      "unlighthouse-ci",
      "--site",
      site,
      "--urls",
      paths.join(","),
      "--disable-dynamic-sampling",
      "--disable-robots-txt",
      "--disable-sitemap",
      "--no-cache",
      "--reporter",
      "jsonExpanded",
      "--build-static",
      "--output-path",
      OUT,
      ...(budget ? ["--budget", budget] : []),
    ])
    if (fs.existsSync(RESULT)) summarize(readRoutes())
    process.exitCode = code
  } finally {
    server.kill()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
