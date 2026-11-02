#!/usr/bin/env node

// Tells IndexNow (Bing, Yandex, Seznam, Naver and the others that share it) which of the site's pages
// changed in a deploy. Google doesn't take IndexNow; it reads the sitemap.
//
// A page changed when the deploy added it to the sitemap, took it out, or moved its `lastmod`. The
// sitemaps before the deploy are the `pages` branch's, kept by the deploy job before it replaces them.
//
//   node indexnow.mjs --previous <dir> --next <dir> [--all] [--wait] [--dry-run]
//
// <dir> holds a site's sitemap-index.xml and the urlsets it names; a <dir> without one has no pages.
// --all     submits every page in --next, changed or not.
// --wait    first waits until the live site serves --next's sitemaps, so a search engine that comes
//           for a page finds the new one. GitHub Pages takes a minute or so after the push.
// --dry-run prints what would be submitted.
//
// The key is the text file at --next's root whose contents are its own name (astro/public).

import { existsSync, readdirSync, readFileSync } from "node:fs"
import { basename, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const SITE = "https://blog.chaoticgood.computer"
const ENDPOINT = "https://api.indexnow.org/indexnow"
// The most URLs one IndexNow request takes.
const BATCH_SIZE = 10_000
const WAIT_INTERVAL_MS = 15_000
const WAIT_LIMIT_MS = 10 * 60_000

const unescape = (text) =>
  text.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&")

const locs = (xml) => [...xml.matchAll(/<loc>(.*?)<\/loc>/gs)].map((match) => unescape(match[1].trim()))

/** A urlset's pages: each address, and its `lastmod` or null. */
export function parseUrlset(xml) {
  const pages = new Map()
  for (const [, entry] of xml.matchAll(/<url>(.*?)<\/url>/gs)) {
    const [loc] = locs(entry)
    if (loc === undefined) continue
    const lastmod = entry.match(/<lastmod>(.*?)<\/lastmod>/s)?.[1].trim() ?? null
    pages.set(loc, lastmod)
  }
  return pages
}

/** A built site's pages, from its sitemap index and the urlsets it names, which sit beside it. */
export function readSitemaps(dir) {
  const indexFile = join(dir, "sitemap-index.xml")
  if (!existsSync(indexFile)) return { pages: new Map(), files: [] }
  const files = locs(readFileSync(indexFile, "utf8")).map((loc) => basename(new URL(loc).pathname))
  const pages = new Map()
  for (const file of files) {
    for (const [loc, lastmod] of parseUrlset(readFileSync(join(dir, file), "utf8"))) pages.set(loc, lastmod)
  }
  return { pages, files }
}

/** The pages a deploy added, removed, or gave a new `lastmod`, sorted. */
export function changedUrls(before, after) {
  const changed = new Set()
  for (const [loc, lastmod] of after) if (!before.has(loc) || before.get(loc) !== lastmod) changed.add(loc)
  for (const loc of before.keys()) if (!after.has(loc)) changed.add(loc)
  return [...changed].sort()
}

/** The IndexNow key: the name of the root text file whose contents are that name. */
export function indexNowKey(dir) {
  for (const file of readdirSync(dir)) {
    if (!file.endsWith(".txt")) continue
    const key = file.slice(0, -".txt".length)
    if (readFileSync(join(dir, file), "utf8").trim() === key) return key
  }
  throw new Error(`No IndexNow key in ${dir}: a <key>.txt holding its own name`)
}

export function submission(urlList, key) {
  return { host: new URL(SITE).host, key, keyLocation: `${SITE}/${key}.txt`, urlList }
}

export function batches(items, size = BATCH_SIZE) {
  const out = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

/** Waits until the live site serves each of `files`, at the site's root, as `dir` holds it. */
export async function waitForLive(dir, files) {
  const deadline = Date.now() + WAIT_LIMIT_MS
  // A query no cache has seen, so the CDN in front of Pages asks for the file afresh.
  const fresh = () => `?indexnow=${Date.now()}`
  for (;;) {
    const pending = []
    for (const file of files) {
      const response = await fetch(`${SITE}/${file}${fresh()}`).catch(() => undefined)
      const live = response?.ok ? await response.text() : undefined
      if (live !== readFileSync(join(dir, file), "utf8")) pending.push(file)
    }
    if (pending.length === 0) return
    if (Date.now() > deadline) throw new Error(`The live site still doesn't serve the new ${pending.join(", ")}`)
    console.log(`⏳ Waiting for the live site to serve the new ${pending.join(", ")}`)
    await new Promise((done) => setTimeout(done, WAIT_INTERVAL_MS))
  }
}

async function submit(urlList, key) {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(submission(urlList, key)),
  })
  // 200: received. 202: received, the key not yet checked.
  if (response.status !== 200 && response.status !== 202) {
    throw new Error(`IndexNow answered ${response.status} ${response.statusText}: ${await response.text()}`)
  }
  return response.status
}

// ─── Main ───────────────────────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  const option = (name) => {
    const index = args.indexOf(name)
    return index === -1 ? undefined : args[index + 1]
  }
  const previous = option("--previous")
  const next = option("--next")
  if (!previous || !next) throw new Error("Usage: indexnow.mjs --previous <dir> --next <dir> [--all] [--wait] [--dry-run]")

  const after = readSitemaps(next)
  if (after.pages.size === 0) throw new Error(`No sitemap in ${next}`)
  const urls = args.includes("--all") ? [...after.pages.keys()].sort() : changedUrls(readSitemaps(previous).pages, after.pages)
  const key = indexNowKey(next)

  console.log(
    `🔍 ${urls.length} URL(s) to submit to IndexNow, with ${after.pages.size} page(s) in the sitemap${args.includes("--dry-run") ? " (dry run)" : ""}`,
  )
  for (const url of urls) console.log(`   ${url}`)
  if (urls.length === 0 || args.includes("--dry-run")) return

  if (args.includes("--wait")) await waitForLive(next, ["sitemap-index.xml", ...after.files])
  for (const batch of batches(urls)) {
    const status = await submit(batch, key)
    console.log(`✅ IndexNow took ${batch.length} URL(s) (${status})`)
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error("💥", error instanceof Error ? error.message : error)
    process.exit(1)
  })
}
