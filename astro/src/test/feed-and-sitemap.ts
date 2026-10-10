// The feed and the sitemap as a reader's client and a crawler read them, for the specs over either
// vault. Every document is checked against its format on the way: the sitemap protocol's own
// schemas, from sitemaps.org, and RSS 2.0's specification written out as a schema, since RSS has
// none (schemas/rss-2.0.rng). libxml2 does the checking, as xmllint built for Node.

import fs from "node:fs"
import type { APIRequestContext, Page } from "@playwright/test"
import { validateXML } from "xmllint-wasm"
import { expect } from "./site.ts"

/** The site's address, which its documents write. */
export const SITE = "https://blog.chaoticgood.computer"

const SCHEMAS = {
  // https://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd
  sitemap: "sitemap.xsd",
  // https://www.sitemaps.org/schemas/sitemap/0.9/siteindex.xsd
  "sitemap index": "siteindex.xsd",
  rss: "rss-2.0.rng",
} as const

/** What is wrong with a document as its format says: nothing, for a valid one. */
export async function formatErrors(xml: string, format: keyof typeof SCHEMAS): Promise<string[]> {
  const file = SCHEMAS[format]
  const schema = fs.readFileSync(new URL(`./schemas/${file}`, import.meta.url), "utf8")
  const result = await validateXML({
    xml: { fileName: "document.xml", contents: xml },
    schema: { fileName: file, contents: schema },
    extension: file.endsWith(".rng") ? "relaxng" : "schema",
  })
  return result.valid ? [] : result.errors.map((error) => error.rawMessage)
}

// A document of the site, asked of the suite's server by the path of its address on the real one.
async function fetchXml(request: APIRequestContext, address: string): Promise<string> {
  const response = await request.get(new URL(address, SITE).pathname)
  expect(response.status(), address).toBe(200)
  return response.text()
}

export interface FeedItem {
  title: string | null
  link: string | null
  guid: string | null
  isPermaLink: string | null
  pubDate: string | null
  description: string | null
  categories: Array<string | null>
}

/** The feed at an address, checked against RSS 2.0, and its items as the browser's XML parser reads them. */
export async function readFeed(page: Page, request: APIRequestContext, address: string): Promise<FeedItem[]> {
  const xml = await fetchXml(request, address)
  expect(await formatErrors(xml, "rss")).toEqual([])
  return page.evaluate((xml) => {
    const feed = new DOMParser().parseFromString(xml, "application/xml")
    const text = (parent: Element, name: string) => parent.querySelector(`:scope > ${name}`)?.textContent ?? null
    return [...feed.querySelectorAll("channel > item")].map((item) => ({
      title: text(item, "title"),
      link: text(item, "link"),
      guid: text(item, "guid"),
      isPermaLink: item.querySelector(":scope > guid")?.getAttribute("isPermaLink") ?? null,
      pubDate: text(item, "pubDate"),
      description: text(item, "description"),
      categories: [...item.querySelectorAll(":scope > category")].map((category) => category.textContent),
    }))
  }, xml)
}

const locs = (xml: string) => [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map(([, loc]) => loc!)

/**
 * The sitemap a crawler finds, from robots.txt on: each page's address, with its last-modified date
 * or null. robots.txt names exactly one sitemap, at `expected`.
 */
export async function crawlSitemap(request: APIRequestContext, expected: string): Promise<Map<string, string | null>> {
  const robots = await (await request.get("/robots.txt")).text()
  const named = [...robots.matchAll(/^Sitemap:\s*(\S+)\s*$/gm)].map(([, address]) => address!)
  expect(named).toEqual([expected])
  return readSitemap(request, expected)
}

/** The sitemap index at an address, and the sitemaps it names: each page's address, with its last-modified date or null. */
export async function readSitemap(request: APIRequestContext, address: string): Promise<Map<string, string | null>> {
  const index = await fetchXml(request, address)
  expect(await formatErrors(index, "sitemap index")).toEqual([])

  const pages = new Map<string, string | null>()
  for (const sitemapAddress of locs(index)) {
    const sitemap = await fetchXml(request, sitemapAddress)
    expect(await formatErrors(sitemap, "sitemap")).toEqual([])
    for (const [, url] of sitemap.matchAll(/<url>(.*?)<\/url>/gs)) {
      pages.set(locs(url!)[0]!, /<lastmod>([^<]*)<\/lastmod>/.exec(url!)?.[1] ?? null)
    }
  }
  return pages
}
