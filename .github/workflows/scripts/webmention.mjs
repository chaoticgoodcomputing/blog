#!/usr/bin/env node

// Sends the webmentions a deploy owes: for each site a note links to, the note's mention excerpt
// (astro/src/lib/mention-excerpts.ts) is the source, and the page it links to the target.
//
// The build's manifest, webmentions.json, names every mention excerpt, its target and a digest of
// what it says. One is sent when the deploy added it, or changed what it says, so the receiver
// shows it as it is now; and when the deploy took it out, so the receiver, finding the excerpt
// gone, can take it down. The manifest before the deploy is the `pages` branch's, kept by the
// deploy job before it replaces it. With none, as on the first deploy, nothing is sent: what the
// site linked to before is sent only by --all.
//
//   node webmention.mjs --previous <dir> --next <dir> [--all] [--wait] [--dry-run]
//
// <dir> holds a site's webmentions.json; a <dir> without one has none.
// --all     sends every mention excerpt in --next, changed or not.
// --wait    first waits until the live site serves --next's manifest, so a receiver that fetches an
//           excerpt finds the new one. GitHub Pages takes a minute or so after the push.
// --dry-run prints what would be sent, finding no endpoints.
//
// A target whose site has no webmention endpoint is skipped; most have none. A receiver that
// refuses one, or can't be reached, is reported, and the script fails once it has tried the rest.

import { existsSync, readFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { waitForLive } from "./indexnow.mjs"

const MANIFEST = "webmentions.json"
const TIMEOUT_MS = 15_000
const USER_AGENT = "blog.chaoticgood.computer webmention sender"

/** A site's manifest: its entries by source, or undefined for a <dir> without one. */
export function readManifest(dir) {
  const file = join(dir, MANIFEST)
  if (!existsSync(file)) return undefined
  return new Map(JSON.parse(readFileSync(file, "utf8")).map((entry) => [entry.source, entry]))
}

/**
 * The webmentions a deploy owes, each `{ source, target, why }`, sorted: an excerpt added or
 * changed, or one taken out. With no manifest before, none, unless `all`.
 */
export function owed(before, after, { all = false } = {}) {
  const out = []
  if (all) {
    for (const entry of after.values()) out.push({ source: entry.source, target: entry.target, why: "all" })
  } else if (before) {
    for (const entry of after.values()) {
      const was = before.get(entry.source)
      if (!was) out.push({ source: entry.source, target: entry.target, why: "added" })
      else if (was.digest !== entry.digest) out.push({ source: entry.source, target: entry.target, why: "changed" })
    }
    for (const entry of before.values()) {
      if (!after.has(entry.source)) out.push({ source: entry.source, target: entry.target, why: "removed" })
    }
  }
  return out.sort((a, b) => a.source.localeCompare(b.source))
}

const hasWebmentionRel = (rel) => rel.toLowerCase().split(/\s+/).includes("webmention")

/** The webmention endpoint a `Link` header names, unresolved, or undefined. */
export function endpointFromLinkHeader(header) {
  if (!header) return undefined
  for (const part of header.split(/,(?=\s*<)/)) {
    const match = part.match(/<([^>]*)>(.*)/s)
    if (!match) continue
    const rel = match[2].match(/;\s*rel\s*=\s*(?:"([^"]*)"|([^\s;,]+))/i)
    if (rel && hasWebmentionRel(rel[1] ?? rel[2])) return match[1]
  }
  return undefined
}

const attribute = (tag, name) => {
  const match = tag.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`, "i"))
  return match ? (match[1] ?? match[2] ?? match[3]).replace(/&amp;/g, "&") : undefined
}

/** The webmention endpoint the first `<link>` or `<a>` with `rel="webmention"` names, unresolved. */
export function endpointFromHtml(html) {
  const text = html.replace(/<!--[\s\S]*?-->/g, "")
  for (const [tag] of text.matchAll(/<(?:link|a)\b[^>]*>/gi)) {
    const rel = attribute(tag, "rel")
    const href = attribute(tag, "href")
    // An empty href is the page itself.
    if (rel && hasWebmentionRel(rel) && href !== undefined) return href
  }
  return undefined
}

/** The endpoint of the site `target` is on, resolved against where its page is, or undefined. */
export async function discover(target) {
  const response = await fetch(target, {
    headers: { Accept: "text/html", "User-Agent": USER_AGENT },
    redirect: "follow",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  const base = response.url || target
  const fromHeader = endpointFromLinkHeader(response.headers.get("link"))
  if (fromHeader !== undefined) return new URL(fromHeader, base).href
  if (!(response.headers.get("content-type") ?? "").includes("html")) return undefined
  const fromHtml = endpointFromHtml(await response.text())
  return fromHtml === undefined ? undefined : new URL(fromHtml, base).href
}

/** Sends one webmention. Any 2xx is taken. */
export async function send(endpoint, source, target) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": USER_AGENT },
    body: new URLSearchParams({ source, target }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (response.status < 200 || response.status >= 300) {
    throw new Error(`${response.status} ${response.statusText}: ${(await response.text()).slice(0, 200)}`)
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
  if (!previous || !next) throw new Error("Usage: webmention.mjs --previous <dir> --next <dir> [--all] [--wait] [--dry-run]")

  const after = readManifest(next)
  if (!after) throw new Error(`No ${MANIFEST} in ${next}`)
  const before = readManifest(previous)
  const all = args.includes("--all")
  const dryRun = args.includes("--dry-run")
  const mentions = owed(before, after, { all })

  if (!before && !all) console.log(`📌 No ${MANIFEST} before this deploy: its ${after.size} excerpt(s) are the baseline, and none is sent`)
  console.log(`📨 ${mentions.length} webmention(s) owed, of ${after.size} excerpt(s)${dryRun ? " (dry run)" : ""}`)
  for (const { source, target, why } of mentions) console.log(`   ${why}: ${target}\n      from ${source}`)
  if (mentions.length === 0 || dryRun) return

  if (args.includes("--wait")) await waitForLive(next, [MANIFEST])

  const endpoints = new Map()
  const failed = []
  let sent = 0
  for (const { source, target } of mentions) {
    try {
      if (!endpoints.has(target)) endpoints.set(target, await discover(target))
      const endpoint = endpoints.get(target)
      if (!endpoint) continue
      const status = await send(endpoint, source, target)
      console.log(`✅ ${target} took it (${status})`)
      sent++
    } catch (error) {
      console.log(`⚠️  ${target}: ${error instanceof Error ? error.message : error}`)
      failed.push(target)
    }
  }
  const without = [...endpoints.values()].filter((endpoint) => !endpoint).length
  console.log(`📬 ${sent} sent, ${without} target(s) with no endpoint, ${failed.length} failed`)
  if (failed.length > 0) process.exitCode = 1
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error("💥", error instanceof Error ? error.message : error)
    process.exit(1)
  })
}
