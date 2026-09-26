// Compares two built sites (see read.mjs) and lists every difference between them, each labelled
// with the allowlist entry that accepts it, if any. The verdict is the report's: a difference no
// entry allows fails the run.

/**
 * How v5 addresses what v4 served at a URL. Descriptive, not normative: a move pairs the two URLs so
 * the report can compare what is served there. Whether the move is acceptable is for the allowlist
 * to say. Applied in this order.
 */
export const MOVES = [
  {
    id: "tag-slash",
    describe: "a tag's page is /tags/<t>, not v4's /tags/<t>/",
    apply: (url) => (/^\/tags\/.+\/$/.test(url) ? url.slice(0, -1) : url),
  },
  {
    id: "lowercase",
    describe: "v5 lowercases every URL it generates",
    apply: (url) => url.toLowerCase(),
  },
  {
    id: "folder-note",
    describe: "v5 slugs a/b/b as a/b/index, Obsidian's folder-note convention",
    apply: (url, kind) => {
      const segments = url.split("/")
      const [parent, last] = segments.slice(-2)
      if (segments.length < 3 || !parent || !last) return url
      const dot = kind === "page" ? -1 : last.lastIndexOf(".")
      const base = dot > 0 ? last.slice(0, dot) : last
      if (base !== parent) return url
      return kind === "page" ? `${segments.slice(0, -1).join("/")}/` : `${segments.slice(0, -1).join("/")}/index${last.slice(base.length)}`
    },
  },
]

/** The URL v5 is expected to serve v4's `url` at, and the moves that took it there. */
export function v5UrlFor(url, kind) {
  let to = url
  const how = []
  for (const move of MOVES) {
    const next = move.apply(to, kind)
    if (next !== to) how.push(move.id)
    to = next
  }
  return { to, how }
}

const kindOfPath = (site, url) => site.urls.get(url)?.kind ?? (/\.[a-z0-9]+$/i.test(url) ? "file" : "page")

// A timestamp inside the span a site was built in is the build's own clock, which Quartz uses for a
// page with no date of its own. Two builds never agree on it, so it compares as a placeholder.
export const BUILD_CLOCK = "(the build's clock)"
const TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/
function fromClock(value, site) {
  if (!TIMESTAMP.test(value)) return false
  const time = Date.parse(value)
  return time >= site.builtDuring.from && time <= site.builtDuring.to
}

// The v5 form of a value from a v4 head: a URL on the site's own origin follows its page's move, so a
// canonical that moved with its page is not reported a second time.
function mappedValue(value, v4) {
  if (fromClock(value, v4)) return BUILD_CLOCK
  if (!value.startsWith(`${v4.origin}/`)) return value
  let pathname
  try {
    pathname = decodeURI(new URL(value).pathname)
  } catch {
    return value
  }
  return `${v4.origin}${v5UrlFor(pathname, kindOfPath(v4, pathname)).to}`
}
function plainValue(value, site) {
  if (fromClock(value, site)) return BUILD_CLOCK
  if (!value.startsWith(`${site.origin}/`)) return value
  try {
    return `${site.origin}${decodeURI(new URL(value).pathname)}`
  } catch {
    return value
  }
}

// Values in `a` that `b` lacks, counting repeats.
function minus(a, b) {
  const rest = [...b]
  return a.filter((value) => {
    const i = rest.indexOf(value)
    if (i < 0) return true
    rest.splice(i, 1)
    return false
  })
}

// A page only v5 serves is compared with a head that has nothing in it, so each of its head values is
// a difference for the allowlist to accept or not.
const NO_HEAD = { fields: new Map() }

function compareHeads(url, to, v4, v5, differences) {
  const before = v4.pages.get(url) ?? NO_HEAD
  const after = v5.pages.get(to)
  // A redirect page is compared by where it sends the reader, nothing else.
  const redirect = before.fields.has("refresh") || after.fields.has("refresh")
  const fields = new Set([...before.fields.keys(), ...after.fields.keys()])
  for (const field of [...fields].sort()) {
    if (redirect !== (field === "refresh")) continue
    const a = (before.fields.get(field) ?? []).map((value) => mappedValue(value, v4))
    const b = (after.fields.get(field) ?? []).map((value) => plainValue(value, v5))
    const removed = minus(a, b)
    const added = minus(b, a)
    if (removed.length || added.length) differences.push({ area: "head", url, to, field, removed, added })
  }
}

function compareFeed(area, v4, v5, differences) {
  const before = v4[area] ?? new Set()
  const after = v5[area] ?? new Set()
  const expected = new Map()
  for (const url of before) {
    const to = url.startsWith("/") ? v5UrlFor(url, kindOfPath(v4, url)).to : url
    expected.set(to, [...(expected.get(to) ?? []), url])
  }
  for (const [to, urls] of expected) {
    const moved = to === urls[0] ? undefined : to
    if (!after.has(to)) differences.push({ area, change: "removed", url: urls[0], to: moved })
    // What a feed reader shows of an item both feeds carry: its description, reading time included.
    else if (area === "rss") {
      const a = v4.rssItems?.get(urls[0])?.description
      const b = v5.rssItems?.get(to)?.description
      if (a !== b) differences.push({ area, change: "changed", url: urls[0], to: moved, field: "description", removed: a === undefined ? [] : [a], added: b === undefined ? [] : [b] })
    }
  }
  for (const url of after) if (!expected.has(url)) differences.push({ area, change: "added", url })
}

/**
 * Every difference between the v4 and v5 builds:
 * - `url`: `removed` (a v4 URL with nothing at its v5 address), `moved` (served at another address;
 *   `redirect` says whether the old URL redirects there, where that can be checked) or `added`;
 * - `sitemap`, `rss`: `removed` or `added` members, after each v4 URL's move; and, for an RSS item
 *   both feeds carry, `changed` with the `description` v5 `removed` and `added`;
 * - `head`: per page and field, the values v5 `removed` and `added`. A page only v5 serves has every
 *   value it carries `added`, against an empty head, under its own URL;
 * - and `also`, what checks of the v5 site alone found (cascade.mjs's `layers`), labelled the same way.
 *
 * Each difference carries `allowedBy`, the first allowlist entry accepting it, or `pending`, the
 * first open ticket expected to close it. `used` counts the differences each entry accepted. Both
 * lists see the two sites, whether the filesystem is case-sensitive, and the `vault` directory the
 * sites were built from.
 */
export function compare(v4, v5, { allowlist, pending = [], caseSensitive, vault, also = [] }) {
  const differences = []
  const claimed = new Set()
  const pairs = []

  for (const [url, { kind }] of v4.urls) {
    if (kind === "generated") continue
    const { to, how } = v5UrlFor(url, kind)
    if (to !== url && v5.urls.has(to)) {
      claimed.add(to)
      let redirect
      if (kind === "page" && how.includes("lowercase")) {
        const target = v5.pages.get(url)?.fields.get("refresh")?.[0]
        claimed.add(url)
        if (!caseSensitive) redirect = "unverifiable"
        else redirect = target && plainValue(target, v5) === `${v5.origin}${to}` ? "verified" : "missing"
      }
      differences.push({ area: "url", change: "moved", url, to, how, kind, ...(redirect && { redirect }) })
      if (kind === "page") pairs.push([url, to])
    } else if (v5.urls.has(url)) {
      claimed.add(url)
      if (kind === "page") pairs.push([url, url])
    } else {
      differences.push({ area: "url", change: "removed", url, kind, ...(to !== url && { to }) })
    }
  }
  const added = []
  for (const [url, { kind }] of v5.urls) {
    if (kind === "generated" || claimed.has(url) || v4.urls.has(url)) continue
    differences.push({ area: "url", change: "added", url, kind })
    if (kind === "page") added.push(url)
  }

  compareFeed("sitemap", v4, v5, differences)
  compareFeed("rss", v4, v5, differences)
  for (const [url, to] of pairs) if (v5.pages.has(to)) compareHeads(url, to, v4, v5, differences)
  for (const url of added) if (v5.pages.has(url)) compareHeads(url, url, v4, v5, differences)
  differences.push(...also)

  const context = { v4, v5, caseSensitive, vault }
  const used = new Map(allowlist.map((entry) => [entry, 0]))
  for (const difference of differences) {
    const entry = allowlist.find((candidate) => candidate.allows(difference, context))
    if (entry) {
      difference.allowedBy = entry
      used.set(entry, used.get(entry) + 1)
    } else {
      difference.pending = pending.find((candidate) => candidate.matches(difference, context))
    }
  }
  return { differences, pairs: pairs.length, added: added.length, used }
}
