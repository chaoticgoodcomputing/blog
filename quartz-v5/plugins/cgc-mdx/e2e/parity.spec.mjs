// The body stays on Quartz's configured pipeline (#19): an .mdx page renders like its .md twin.
import fs from "node:fs"
import path from "node:path"
import { test, expect } from "../../../tests/harness/test.mjs"
import { testsRoot } from "../../../tests/harness/site.mjs"

// A redirect stub, as stock alias-redirects writes one: a page with nothing but a meta refresh.
const isRedirect = (html) => /<meta http-equiv="refresh"/.test(html)

test("an .mdx page is served at its .mdx URL, as stock page types serve theirs", async ({ emitted }) => {
  // The owner's 2026-09-26 decision (cgc-mdx ADR-0005): `slugifyFilePath` keeps the extension, as
  // for canvas-page's `foo.canvas`.
  expect(emitted.exists("mdx-article.mdx.html")).toBe(true)
  expect(isRedirect(emitted.read("mdx-article.mdx.html"))).toBe(false)
})

test("the old extensionless URL redirects to the page", async ({ page, emitted }) => {
  expect(isRedirect(emitted.read("mdx-article.html"))).toBe(true)
  await page.goto("/mdx-article")
  await expect(page).toHaveURL(/\/mdx-article\.mdx$/)
  await expect(page.locator("article")).toContainText("This page is .mdx.")
})

// Whether a directory's filesystem tells `a` from `A`.
function caseSensitive(dir) {
  const probe = path.join(dir, ".Case-Probe")
  fs.writeFileSync(probe, "")
  try {
    return !fs.existsSync(path.join(dir, ".case-probe"))
  } finally {
    fs.rmSync(probe)
  }
}

test("no case-redirect stub collides with or duplicates an .mdx page", async ({ emitted }) => {
  // alias-redirects writes its case redirects only on a case-sensitive filesystem (#23), from each
  // page's case-preserved slug. With the page at its own slug, the two agree and it writes none.
  test.skip(!caseSensitive(emitted.root), "case redirects are only emitted on a case-sensitive filesystem")
  const pages = emitted.list(".mdx.html")
  // Every .mdx page in the fixture, each once, and none of them a redirect.
  const sources = fs
    .readdirSync(path.join(testsRoot, "content-fixture"), { recursive: true })
    .filter((file) => file.endsWith(".mdx"))
  expect(pages.sort()).toEqual(sources.map((file) => `${file}.html`).sort())
  expect(pages.filter((file) => isRedirect(emitted.read(file)))).toEqual([])
})

test("the configured transformers ran on the body", async ({ page }) => {
  await page.goto("/mdx-article.mdx")
  const article = page.locator("article")
  await expect(article.locator("a.internal", { hasText: "plain-note" })).toHaveAttribute("href", /plain-note$/)
  await expect(article.locator("table")).toBeVisible()
  await expect(article.locator("pre code[data-language='ts']")).toBeVisible()
  await expect(article.locator(".katex").first()).toBeAttached()
  await expect(article.locator(".callout")).toBeVisible()
  await expect(article.locator("section[data-footnotes]")).toBeAttached()
})

test("the page takes part in the site like a markdown page", async ({ page }) => {
  await page.goto("/plain-note")
  await expect(page.locator(".cgc-backlinks a", { hasText: "MDX Article" })).toBeVisible()
})
