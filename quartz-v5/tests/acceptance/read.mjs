// Reads a built site from disk into what the acceptance report compares: the URLs it serves, its
// sitemap and RSS membership, and the head metadata of every page. Only the build output is read,
// so the same code reads a v4 and a v5 site. Dependency-free on purpose: the report runs before
// either site's own install matters, and Quartz renders heads regularly enough for a tag scanner.
import crypto from "node:crypto"
import fs from "node:fs"
import path from "node:path"

/**
 * The URL a static host serves a built file at, the way GitHub Pages does for Quartz's extensionless
 * pages: `a/index.html` is `/a/`, `a.html` is `/a`, anything else keeps its extension.
 */
export function urlOf(file) {
  if (file === "index.html") return "/"
  if (file.endsWith("/index.html")) return `/${file.slice(0, -"index.html".length)}`
  if (file.endsWith(".html")) return `/${file.slice(0, -".html".length)}`
  return `/${file}`
}

/**
 * What a built file is, for the comparison:
 * - `page`: HTML, including redirect pages;
 * - `feed`: the sitemap and the RSS feed;
 * - `generated`: Quartz's own build output, which no reader or crawler addresses except through a
 *   page's head: everything under `/static/`, the root CSS and JS bundles, and OG images. Counted,
 *   never compared;
 * - `file`: everything else — the vault's assets and the site's root files (CNAME, robots.txt,
 *   verification files).
 */
export function kindOf(file) {
  if (file.startsWith("static/")) return "generated"
  if (!file.includes("/") && /\.(css|js)$/.test(file)) return "generated"
  if (file.endsWith("-og-image.webp")) return "generated"
  if (file === "sitemap.xml" || file === "index.xml") return "feed"
  if (file.endsWith(".html")) return "page"
  return "file"
}

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " }
export const decodeEntities = (text) =>
  text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, ref) => {
    if (ref[0] === "#") {
      const code = ref[1] === "x" || ref[1] === "X" ? parseInt(ref.slice(2), 16) : parseInt(ref.slice(1), 10)
      return String.fromCodePoint(code)
    }
    return ENTITIES[ref.toLowerCase()] ?? whole
  })

function attributesOf(source) {
  const attributes = {}
  for (const [, name, double, single, bare] of source.matchAll(/([^\s=/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
    attributes[name.toLowerCase()] = decodeEntities(double ?? single ?? bare ?? "")
  }
  return attributes
}

// An opening tag, with a `>` inside a quoted attribute value kept in its attributes.
const TAG = (names) => new RegExp(`<(${names})\\b((?:[^>"']|"[^"]*"|'[^']*')*)>`, "gi")

/** Leaf values of a JSON document, keyed by path: `{"a":{"b":[1]}}` gives `a.b[0]` → `1`. */
function flatten(value, prefix, into) {
  if (Array.isArray(value)) value.forEach((item, i) => flatten(item, `${prefix}[${i}]`, into))
  else if (value !== null && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) flatten(item, prefix ? `${prefix}.${key}` : key, into)
  } else into.push([prefix, String(value)])
}

/**
 * The head metadata the report compares, as fields with (possibly several) values:
 * - `robots`: each directive of `<meta name="robots">`;
 * - `canonical`: `<link rel="canonical">`, resolved against the page's URL;
 * - `article:*`: each `<meta property="article:…">`;
 * - `jsonld.<path>`: each leaf of each JSON-LD block (`jsonld[1].<path>` for a second block);
 * - `refresh`: a redirect page's target, resolved against the page's URL.
 */
export function readHead(html, pageUrl) {
  const start = html.search(/<head[\s>]/i)
  const end = html.search(/<\/head>/i)
  const head = start >= 0 && end > start ? html.slice(start, end) : ""
  const fields = new Map()
  const add = (field, value) => fields.set(field, [...(fields.get(field) ?? []), value])
  const resolve = (href) => {
    try {
      return new URL(href, pageUrl).href
    } catch {
      return href
    }
  }

  for (const [, tag, source] of head.matchAll(TAG("meta|link"))) {
    const a = attributesOf(source)
    if (tag.toLowerCase() === "link") {
      if ((a.rel ?? "").toLowerCase().split(/\s+/).includes("canonical") && a.href !== undefined) add("canonical", resolve(a.href))
    } else if ((a.name ?? "").toLowerCase() === "robots") {
      for (const directive of (a.content ?? "").split(",")) if (directive.trim()) add("robots", directive.trim().toLowerCase())
    } else if ((a.property ?? "").startsWith("article:")) {
      add(a.property, a.content ?? "")
    } else if ((a["http-equiv"] ?? "").toLowerCase() === "refresh") {
      const target = /url\s*=\s*(.*)$/i.exec(a.content ?? "")?.[1]?.trim()
      if (target) add("refresh", resolve(target.replace(/^['"]|['"]$/g, "")))
    }
  }

  const blocks = [...head.matchAll(new RegExp(`${TAG("script").source}([\\s\\S]*?)</script>`, "gi"))].filter(
    ([, , source]) => (attributesOf(source).type ?? "").toLowerCase() === "application/ld+json",
  )
  blocks.forEach(([, , , body], i) => {
    const prefix = i === 0 ? "jsonld" : `jsonld[${i}]`
    try {
      const leaves = []
      flatten(JSON.parse(body), "", leaves)
      for (const [key, value] of leaves) add(key ? `${prefix}.${key}` : prefix, value)
    } catch {
      add(prefix, `(unparseable) ${body.trim().slice(0, 80)}`)
    }
  })

  const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(head)?.[1]
  return { title: title === undefined ? undefined : decodeEntities(title).trim(), fields }
}

/**
 * The stylesheets a page is served, in document order: each `<link rel="stylesheet">` by its
 * resolved URL, and each `<style>` block by a hash of its text. Pages with the same list share a
 * cascade.
 */
export function readSheets(html, pageUrl) {
  const sheets = []
  for (const match of html.matchAll(/<(link|style)\b((?:[^>"']|"[^"]*"|'[^']*')*)>/gi)) {
    const [whole, tag, source] = match
    if (tag.toLowerCase() === "link") {
      const a = attributesOf(source)
      if (!(a.rel ?? "").toLowerCase().split(/\s+/).includes("stylesheet") || a.href === undefined) continue
      try {
        sheets.push(new URL(a.href, pageUrl).href)
      } catch {
        sheets.push(a.href)
      }
    } else {
      const start = match.index + whole.length
      const end = html.indexOf("</style>", start)
      sheets.push(`<style> ${crypto.createHash("sha1").update(html.slice(start, end < 0 ? undefined : end)).digest("hex")}`)
    }
  }
  return sheets
}

// Absolute URLs on the site's own origin become paths; anything else stays as written.
function pathOn(origin, href) {
  try {
    const url = new URL(decodeEntities(href.trim()), origin)
    return url.origin === new URL(origin).origin ? decodeURI(url.pathname) : url.href
  } catch {
    return href.trim()
  }
}

function readFeed(root, file, pattern, origin) {
  const feed = path.join(root, file)
  if (!fs.existsSync(feed)) return null
  const xml = fs.readFileSync(feed, "utf8")
  return new Set([...xml.matchAll(pattern)].map(([, href]) => pathOn(origin, href)))
}

// An RSS element's text: CDATA as written (a `]]>` inside it is split across two sections), anything
// else with its entities decoded.
const textOf = (xml) =>
  xml.includes("<![CDATA[") ? xml.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim() : decodeEntities(xml).trim()

/**
 * The RSS feed's items in feed order, by URL path: each one's date (milliseconds, NaN when it has
 * none) and description (undefined when it has none).
 */
function readItems(root, origin) {
  const feed = path.join(root, "index.xml")
  if (!fs.existsSync(feed)) return null
  const items = new Map()
  for (const [item] of fs.readFileSync(feed, "utf8").matchAll(/<item>[\s\S]*?<\/item>/g)) {
    const field = (tag) => new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`).exec(item)?.[1]
    const link = field("link")
    if (link === undefined) continue
    const description = field("description")
    items.set(pathOn(origin, link), {
      date: Date.parse(textOf(field("pubDate") ?? "")),
      description: description === undefined ? undefined : textOf(description),
    })
  }
  return items
}

// How long before its first page a build may have taken a date from its own clock: parsing, which
// is when Quartz dates a page that has no date of its own, comes before any page is written.
const PARSE_MARGIN_MS = 5 * 60 * 1000
// The longest a build spends writing its pages and feeds. One written longer than that before the
// last is not this build's own output (a copied file keeps its source's date), so it says nothing
// about when the build ran.
const WRITE_SPAN_MS = 10 * 60 * 1000

/**
 * The span a site was built in, from when Quartz wrote what it renders itself (pages and feeds):
 * from shortly before the first of this build's writes to the last. Other files are not evidence,
 * since Quartz copies some of them with their source's modification time.
 */
function clockOf(written) {
  const to = written.reduce((latest, time) => Math.max(latest, time), -Infinity)
  const from = written.reduce((earliest, time) => (time >= to - WRITE_SPAN_MS ? Math.min(earliest, time) : earliest), Infinity)
  return { from: from - PARSE_MARGIN_MS, to }
}

/**
 * A built site: every URL it serves with its kind, its sitemap and RSS membership (URL paths, or
 * `null` when the file is missing), the RSS items themselves in feed order (`rssItems`, see
 * readItems), and the head and stylesheets of each page. `origin` is the site's own
 * (`https://<baseUrl>`), which absolute URLs in heads and feeds are read against. `builtDuring` is
 * the span in which the build ran: a page with no date of its own gets the build's clock, and that
 * is not a date to compare. Pass it when it was measured; otherwise it is read from when the pages
 * and feeds were written.
 */
export function readSite(root, origin, { builtDuring } = {}) {
  if (!fs.existsSync(root)) throw new Error(`no built site at ${root}`)
  const urls = new Map()
  const pages = new Map()
  const written = []
  for (const entry of fs.readdirSync(root, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile()) continue
    const full = path.join(entry.parentPath ?? entry.path, entry.name)
    const file = path.relative(root, full).split(path.sep).join("/")
    const url = urlOf(file)
    const kind = kindOf(file)
    urls.set(url, { file, kind })
    if (kind === "page" || kind === "feed") written.push(fs.statSync(full).mtimeMs)
    if (kind === "page") {
      const html = fs.readFileSync(full, "utf8")
      pages.set(url, { ...readHead(html, `${origin}${url}`), sheets: readSheets(html, `${origin}${url}`) })
    }
  }
  return {
    root,
    origin,
    urls,
    pages,
    builtDuring: builtDuring ?? clockOf(written),
    sitemap: readFeed(root, "sitemap.xml", /<loc>([^<]*)<\/loc>/g, origin),
    rss: readFeed(root, "index.xml", /<item>[\s\S]*?<link>([^<]*)<\/link>[\s\S]*?<\/item>/g, origin),
    rssItems: readItems(root, origin),
  }
}

/**
 * Whether the filesystem holding a built site tells file names apart by case, found by looking up
 * one of its files under a case-swapped name. On one that doesn't (macOS's default APFS), stock
 * `alias-redirects` emits no case redirects, since the redirect and its target would be the same
 * file (#23).
 */
export function isCaseSensitive(site) {
  for (const { file } of site.urls.values()) {
    const swapped = file.replace(/[a-z]/gi, (c) => (c === c.toLowerCase() ? c.toUpperCase() : c.toLowerCase()))
    if (swapped !== file && !site.urls.has(urlOf(swapped))) return !fs.existsSync(path.join(site.root, swapped))
  }
  return true
}
