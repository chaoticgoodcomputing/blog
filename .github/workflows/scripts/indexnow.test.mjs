// node --test .github/workflows/scripts/*.test.mjs
import assert from "node:assert/strict"
import { mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { test } from "node:test"
import { batches, changedUrls, indexNowKey, parseUrlset, readSitemaps, submission } from "./indexnow.mjs"

const SITE = "https://blog.chaoticgood.computer"

const urlset = (entries) =>
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries
    .map(([loc, lastmod]) => `<url><loc>${loc}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}</url>`)
    .join("")}</urlset>`

const index = (children) =>
  `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${children
    .map((child) => `<sitemap><loc>${SITE}/${child}</loc></sitemap>`)
    .join("")}</sitemapindex>`

const site = (files) => {
  const dir = mkdtempSync(join(tmpdir(), "indexnow-"))
  for (const [name, content] of Object.entries(files)) writeFileSync(join(dir, name), content)
  return dir
}

test("a urlset is each address with when it last changed", () => {
  const pages = parseUrlset(urlset([[`${SITE}/a`, "2026-11-01T00:00:00.000Z"], [`${SITE}/b`]]))
  assert.deepEqual([...pages], [[`${SITE}/a`, "2026-11-01T00:00:00.000Z"], [`${SITE}/b`, null]])
})

test("escaped characters in an address are read as the characters", () => {
  const pages = parseUrlset(urlset([[`${SITE}/a?x=1&amp;y=2`]]))
  assert.deepEqual([...pages.keys()], [`${SITE}/a?x=1&y=2`])
})

test("the sitemaps are every urlset the index names, read from the built site", () => {
  const dir = site({
    "sitemap-index.xml": index(["sitemap-0.xml", "sitemap-1.xml"]),
    "sitemap-0.xml": urlset([[`${SITE}/a`, "2026-11-01"]]),
    "sitemap-1.xml": urlset([[`${SITE}/b`, "2026-11-02"]]),
  })
  const { pages, files } = readSitemaps(dir)
  assert.deepEqual([...pages.keys()], [`${SITE}/a`, `${SITE}/b`])
  assert.deepEqual(files, ["sitemap-0.xml", "sitemap-1.xml"])
})

test("a site with no sitemap index has no pages", () => {
  assert.equal(readSitemaps(site({})).pages.size, 0)
})

test("the changed pages are the new, the removed, and the ones whose lastmod moved", () => {
  const before = new Map([
    [`${SITE}/same`, "2026-10-01"],
    [`${SITE}/edited`, "2026-10-01"],
    [`${SITE}/removed`, "2026-10-01"],
  ])
  const after = new Map([
    [`${SITE}/same`, "2026-10-01"],
    [`${SITE}/edited`, "2026-11-02"],
    [`${SITE}/added`, "2026-11-02"],
  ])
  assert.deepEqual(changedUrls(before, after), [`${SITE}/added`, `${SITE}/edited`, `${SITE}/removed`])
})

test("with nothing before, every page is new", () => {
  assert.deepEqual(changedUrls(new Map(), new Map([[`${SITE}/a`, null]])), [`${SITE}/a`])
})

test("the key is the root text file named by its own contents", () => {
  const key = "a6e41ab6-6753-4d94-9b54-b4405d806883"
  const dir = site({ [`${key}.txt`]: `${key}\n`, "notes.txt": "something else" })
  assert.equal(indexNowKey(dir), key)
})

test("no key file is an error", () => {
  assert.throws(() => indexNowKey(site({ "notes.txt": "nope" })), /IndexNow key/)
})

test("a submission names the host, the key and where the key is published", () => {
  assert.deepEqual(submission([`${SITE}/a`], "k"), {
    host: "blog.chaoticgood.computer",
    key: "k",
    keyLocation: `${SITE}/k.txt`,
    urlList: [`${SITE}/a`],
  })
})

test("URLs go in batches no bigger than IndexNow takes", () => {
  assert.deepEqual(batches([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]])
  assert.deepEqual(batches([], 2), [])
})
