// ADR-0003 rule 2 — never select what you do not own — checked where a collision shows up.
//
// The PostCSS pass polices one plugin's stylesheet; it cannot see two stylesheets interact. So
// every fixture page is rendered with our plugins on and off, and every element they do not own
// must compute identically. An element is owned if it, or an ancestor, carries a `cgc-` class.
import { test, expect } from "../harness/test.mjs"

const PAGES = ["/", "/plain-note", "/md-twin", "/mdx-article.mdx", "/lab/cascade.mdx", "/lab/pdf.mdx", "/lab/bluesky.mdx", "/links/from-md", "/links/from-mdx.mdx", "/nested/deep-note", "/tags/fixture", "/tags/articles", "/tags/writing", "/tags/listing", "/tag-engine/deeper-later", "/tag-engine/first-tag", "/seo/private-note", "/seo/private-descendant", "/seo/authored", "/seo/external-stub", "/seo/feed-article", "/backlinks/target", "/og/tag-nested", "/linked-note", "/posthog/navigation", "/annotations/fixture-paper", "/annotations/withdrawn", "/graph/old-note", "/tag-explorer/alpha"]
// A page one of our plugins creates has no baseline of its own, so it is compared against the
// stock page it stands in for: the .mdx article against its byte-identical .md twin. The explorer
// marks the current page `.active`, which is then a different link on each side, so it is skipped.
const BASELINE_OF = { "/mdx-article.mdx": "/md-twin", "/lab/cascade.mdx": "/lab/cascade-twin", "/lab/pdf.mdx": "/lab/pdf-twin", "/lab/bluesky.mdx": "/lab/bluesky-twin", "/links/from-mdx.mdx": "/links/from-md" }
const TWIN_SKIP = ".explorer .active"
const PROPS = ["color", "background-color", "font-family", "font-size", "font-weight", "letter-spacing", "line-height", "margin-top", "margin-bottom", "padding-left", "display", "text-decoration-line"]

// Runs in the page. Keys each unowned element by its path through unowned ancestors, so an
// inserted plugin element does not shift the keys of its siblings. A list item is keyed by its
// label rather than its position, because a plugin that adds pages (cgc-mdx) grows the explorer.
const snapshot = ([props, skip]) => {
  const owned = (el) => el.closest('[class*="cgc-"]') !== null
  const key = (el) => {
    const parts = []
    for (let node = el; node && node !== document.body; node = node.parentElement) {
      if (owned(node)) continue
      const label = node.tagName === "LI" ? node.querySelector("a, button, span")?.textContent.trim() : undefined
      if (label !== undefined) {
        parts.unshift(`li{${label}}`)
        continue
      }
      // A frame's slots (sidebars, center) are keyed by name, so a page a plugin puts in another
      // frame (cgc-annotator's, full-width) lines up with its baseline wherever the frames agree.
      if (node.parentElement.id === "quartz-body" && node.classList.length) {
        parts.unshift(`${node.tagName.toLowerCase()}.${node.classList[0]}`)
        continue
      }
      const index = [...node.parentElement.children].filter((c) => !owned(c) && c.tagName === node.tagName).indexOf(node)
      parts.unshift(`${node.tagName.toLowerCase()}[${index}]`)
    }
    return parts.join(">")
  }
  const out = {}
  for (const el of document.body.querySelectorAll("*")) {
    if (owned(el) || el.closest("script,style,svg") || (skip && el.closest(skip))) continue
    const style = getComputedStyle(el)
    out[key(el)] = Object.fromEntries(props.map((p) => [p, style.getPropertyValue(p)]))
  }
  return out
}

// The baseline turns our plugins off, and turns back on the stock plugin one of ours stands in for:
// stock tag-page for quartz-tag-page, keyed by the package name the fixture lists it by (#95). Without
// it the baseline's tag pages would be 404s, and the tag pages above would be compared with nothing.
test("the baseline swaps stock tag-page in for ours", async ({ page, baselinePage }) => {
  await page.goto("/tags/articles")
  await expect(page.locator(".cgc-tag-page")).toHaveCount(1)
  await expect(page.locator(".page-listing")).toHaveCount(0)
  const response = await baselinePage.goto("/tags/articles")
  expect(response.status()).toBe(200)
  await expect(baselinePage.locator(".page-listing")).toHaveCount(1)
  await expect(baselinePage.locator(".cgc-tag-page")).toHaveCount(0)
})

for (const url of PAGES) {
  test(`our plugins leave unowned elements alone on ${url}`, async ({ page, baselinePage }) => {
    await page.goto(url)
    await baselinePage.goto(BASELINE_OF[url] ?? url)
    const skip = BASELINE_OF[url] ? TWIN_SKIP : null
    const [withPlugins, baseline] = await Promise.all([page.evaluate(snapshot, [PROPS, skip]), baselinePage.evaluate(snapshot, [PROPS, skip])])
    const bled = Object.entries(withPlugins)
      .filter(([key]) => baseline[key])
      .flatMap(([key, props]) =>
        Object.entries(props)
          .filter(([prop, value]) => baseline[key][prop] !== value)
          .map(([prop, value]) => `${key} ${prop}: ${baseline[key][prop]} → ${value}`),
      )
    expect(bled).toEqual([])
  })
}
