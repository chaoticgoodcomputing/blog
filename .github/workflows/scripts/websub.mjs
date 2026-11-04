#!/usr/bin/env node

// Tells the feed's WebSub hub that the feed changed (https://www.w3.org/TR/websub/#publishing), so
// a reader subscribed there hears of a new note at once rather than when it next polls.
//
// The feed names its hub (astro/src/lib/feed.ts), so the hub is the site config's alone. The feed
// before the deploy is the `pages` branch's, kept by the deploy job before it replaces it. The hub
// is told only when the deploy changed the feed: a deploy that changed no note's item, as most
// daily ones, tells it nothing. It waits first until the live site serves the new feed, since the
// hub fetches it as soon as it is told.
//
//   node websub.mjs --previous <dir> --next <dir> [--wait] [--dry-run]
//
// <dir> holds a site's index.xml; a <dir> without one has none. With no feed before, as on the first
// deploy, the hub is told. A hub that refuses is a warning on the run, not a failed job: it is
// someone else's server, and a failed job would read as a failed deploy.

import { existsSync, readFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { waitForLive } from "./indexnow.mjs"

const FEED = "index.xml"
const TIMEOUT_MS = 15_000

/** A dir's feed, or undefined for a dir without one. */
export function readFeed(dir) {
  const file = join(dir, FEED)
  return existsSync(file) ? readFileSync(file, "utf8") : undefined
}

/** The hub a feed names, and the address it names itself by: `<atom:link rel="hub">` and `rel="self"`. */
export function feedLinks(xml) {
  const link = (rel) => {
    for (const match of xml.matchAll(/<atom:link\b([^>]*)\/?>/g)) {
      const attributes = Object.fromEntries([...match[1].matchAll(/(\w+)="([^"]*)"/g)].map(([, name, value]) => [name, value]))
      if (attributes.rel === rel) return attributes.href
    }
    return undefined
  }
  return { hub: link("hub"), self: link("self") }
}

/** Whether the hub is owed word of the feed: there is a feed, and it isn't the one deployed before. */
export const owesPing = (before, after) => after !== undefined && before !== after

/** The body of a publish ping (WebSub's `hub.mode=publish`, as hubs such as Superfeedr take it). */
export const pingBody = (feed) => new URLSearchParams({ "hub.mode": "publish", "hub.url": feed })

async function ping(hub, feed) {
  const response = await fetch(hub, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: pingBody(feed),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  // 204: told. Some hubs answer 200 or 202.
  if (!response.ok) throw new Error(`${hub} answered ${response.status}: ${(await response.text()).slice(0, 200)}`)
  return response.status
}

async function main(args) {
  const value = (flag) => {
    const at = args.indexOf(flag)
    return at === -1 ? undefined : args[at + 1]
  }
  const previous = value("--previous")
  const next = value("--next")
  if (!previous || !next) throw new Error("Usage: websub.mjs --previous <dir> --next <dir> [--wait] [--dry-run]")
  const after = readFeed(next)
  if (!owesPing(readFeed(previous), after)) {
    console.log("The feed didn't change: the hub isn't told.")
    return
  }
  const { hub, self } = feedLinks(after)
  if (!hub || !self) {
    console.log("The feed names no hub: none is told.")
    return
  }
  if (args.includes("--dry-run")) {
    console.log(`Would tell ${hub} that ${self} changed.`)
    return
  }
  if (args.includes("--wait")) await waitForLive(next, [FEED])
  try {
    const status = await ping(hub, self)
    console.log(`✓ Told ${hub} that ${self} changed (${status}).`)
  } catch (error) {
    console.log(`::warning title=WebSub::${error.message}`)
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(`✗ ${error.message}`)
    process.exitCode = 1
  })
}
