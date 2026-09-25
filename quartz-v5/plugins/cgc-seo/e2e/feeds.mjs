// Reads the two files cgc-seo writes for crawlers and feed readers as they read them: the sitemap's
// entries, and the RSS feed's channel and items. Regular expressions, not an XML parser: both files
// are flat, the specs check well-formedness separately in the browser, and the site's IndexNow script
// reads the sitemap the same way. Used by the specs and by `v4-parity/capture.mjs`.

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" }
const decode = (value) =>
  value
    .replace(/^\s*<!\[CDATA\[([\s\S]*)\]\]>\s*$/, "$1")
    .replace(/&(#\d+|[a-z]+);/g, (whole, ref) => (ref[0] === "#" ? String.fromCodePoint(Number(ref.slice(1))) : (ENTITIES[ref] ?? whole)))

const all = (xml, tag) => [...xml.matchAll(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "g"))].map(([, body]) => decode(body))
const one = (xml, tag) => all(xml, tag)[0]

/** The sitemap's entries, in order: each `{ loc, lastmod }`, with `lastmod` absent when it has none. */
export function readSitemap(xml) {
  return [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(([, body]) => {
    const lastmod = one(body, "lastmod")
    return { loc: one(body, "loc"), ...(lastmod !== undefined && { lastmod }) }
  })
}

/** The RSS feed: its channel's own fields, and its items in order, each with its categories. */
export function readFeed(xml) {
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, body]) => ({
    title: one(body, "title"),
    link: one(body, "link"),
    guid: one(body, "guid"),
    description: one(body, "description")?.trim(),
    pubDate: one(body, "pubDate"),
    categories: all(body, "category"),
  }))
  const channel = xml.replace(/<item>[\s\S]*?<\/item>/g, "")
  return {
    channel: {
      title: one(channel, "title"),
      link: one(channel, "link"),
      description: one(channel, "description"),
      generator: one(channel, "generator"),
    },
    items,
  }
}

/** Runs in the page: whether `xml` parses, and its root element's name and namespace. */
export function parseXml(xml) {
  const doc = new DOMParser().parseFromString(xml, "application/xml")
  const error = doc.querySelector("parsererror")
  return error ? { error: error.textContent } : { root: doc.documentElement.localName, namespace: doc.documentElement.namespaceURI }
}
