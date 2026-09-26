// What a feed reader reads from the fixture site's RSS feed, index.xml: its newest public articles,
// newest first, in v4's shape. The fixture config gives cgc-seo `rssLimit: 5` and no article folders,
// so every page built from a file of its own is an article; its content-index writes no feed of its
// own. The newest pages in the fixture are a private page and an external page (seo/), then the
// newest public article, seo/feed-article. They are dated 2999 so that nothing else overtakes them:
// every fixture page without a date of its own takes its latest commit's, or the build's clock while
// uncommitted, and those move forward on their own. v4 parity itself is v4-parity.spec.mjs.
import fs from "node:fs"
import path from "node:path"
import { test, expect } from "../../../tests/harness/test.mjs"
import { buildScratchSite, fixtureConfig, withPlugins } from "../../../tests/harness/site.mjs"
import { readFeed, parseXml } from "./feeds.mjs"

test.skip(({ colorScheme }) => colorScheme === "dark", "the feed has no colour scheme")

const ORIGIN = "https://localhost"
const feed = (emitted) => readFeed(emitted.read("index.xml"))

test("is a well-formed RSS 2.0 feed", async ({ page, emitted }) => {
  expect(await page.evaluate(parseXml, emitted.read("index.xml"))).toEqual({ root: "rss", namespace: null })
  expect(emitted.read("index.xml")).toMatch(/^<\?xml version="1.0" encoding="UTF-8" \?>\s*<rss version="2.0">/)
})

test("names the site, and how many of its notes it carries", ({ emitted }) => {
  expect(feed(emitted).channel).toEqual({
    title: "cgc fixture",
    link: ORIGIN,
    description: "Last 5 notes on cgc fixture",
    generator: "Quartz -- quartz.jzhao.xyz",
  })
})

test("carries the newest public articles, newest first, up to its limit", ({ emitted }) => {
  const { items } = feed(emitted)
  expect(items).toHaveLength(5)
  expect(items[0].link).toBe(`${ORIGIN}/seo/feed-article`)
  const times = items.map(({ pubDate }) => Date.parse(pubDate))
  expect(times.every((time, i) => i === 0 || time <= times[i - 1]), items.map((item) => item.pubDate).join("\n")).toBe(true)
})

test("leaves out private and external pages, even the newest", ({ emitted }) => {
  const links = feed(emitted).items.map(({ link }) => link)
  for (const url of ["/seo/private-descendant", "/seo/external-stub", "/seo/private-note"]) {
    expect(links, url).not.toContain(`${ORIGIN}${url}`)
  }
})

test("gives each article v4's item: its description and reading time, its date, and a category per tag", ({ emitted }) => {
  // 516 words, at 200 a minute, rounded up.
  expect(feed(emitted).items[0]).toEqual({
    title: "Feed Article",
    link: `${ORIGIN}/seo/feed-article`,
    guid: `${ORIGIN}/seo/feed-article`,
    description: "The newest public article, so it heads the feed. (3 min read)",
    pubDate: "Tue, 01 Jan 2999 00:00:00 GMT",
    categories: ["feeds/rss"],
  })
  for (const { description } of feed(emitted).items) expect(description).toMatch(/\(\d+ min read\)$/)
})

// The channel's description in the site's own language, as stock content-index's options give it:
// `rssLastFewNotesText` for a feed with a limit (`{count}` is the limit), `rssRecentNotesText` for one
// without. Built on scratch sites, since the fixture's feed is v4's English.
for (const [name, options, description] of [
  ["rss-few", { rssLimit: 2, rssLastFewNotesText: "Letzte {count} Notizen" }, "Letzte 2 Notizen on cgc fixture"],
  ["rss-all", { rssLimit: 0, rssRecentNotesText: "Neueste Notizen" }, "Neueste Notizen on cgc fixture"],
]) {
  test(`describes itself in the site's language: ${description}`, async () => {
    const config = withPlugins(fixtureConfig(), [{ source: "../../plugins/cgc-seo", enabled: true, options }])
    const pages = { "index.md": "# home\n", "one.md": "# one\n", "two.md": "# two\n", "three.md": "# three\n" }
    const site = await buildScratchSite(name, pages, { config, keep: true })
    try {
      expect(site.code, site.output).toBe(0)
      const { channel, items } = readFeed(fs.readFileSync(path.join(site.public, "index.xml"), "utf8"))
      expect(channel.description).toBe(description)
      expect(items).toHaveLength(options.rssLimit || 4)
    } finally {
      site.remove()
    }
  })
}
