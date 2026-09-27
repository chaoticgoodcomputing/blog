// The v5 site's cascade layers, as the browser ranks them on the built pages: site-styles' guard
// (#64, ADR-0003's site-plugin amendment) run against the real build rather than a scratch one. The
// site's stack declaration must name every top-level layer on a page, in rank order, with the site
// last; a layer it doesn't name ranks above the site's own CSS.
//
// Pages share a cascade when they are served the same stylesheets (read.mjs, `readSheets`), and the
// whole site is served a handful of such sets, so one page of each is loaded. The page is served
// from disk at the site's origin; requests anywhere else are refused, so the check runs offline and
// a cross-origin stylesheet is never read (harness/layers.mjs skips one the page may not read).
import { layerOrder, stackDeclaration } from "../harness/layers.mjs"

const sameList = (a, b) => a.length === b.length && a.every((value, i) => value === b[i])

/**
 * Checks each set of stylesheets a site's pages are served, on the first of its pages in URL order.
 * Returns `summary` (`sets` checked, and the `pages` they cover) and a `layers` difference for each
 * set that fails: `{ area: "layers", url, pages, declared, ranked }`, where `declared` is the stack
 * declaration (null when the page has none) and `ranked` the top-level layers as the browser ranks
 * them. A page served no stylesheet has no cascade to check.
 */
export async function checkCascade(site) {
  const sets = new Map()
  for (const [url, { sheets }] of site.pages) {
    if (!sheets.length) continue
    const key = sheets.join("\n")
    sets.set(key, [...(sets.get(key) ?? []), url])
  }
  const summary = { sets: sets.size, pages: [...sets.values()].reduce((sum, urls) => sum + urls.length, 0) }
  const differences = []
  if (!sets.size) return { summary, differences }

  // Loaded only when there is a cascade to check: the browser, and the suite's URL resolver (which
  // reads Quartz Core's dependencies).
  const { fileFor } = await import("../harness/site.mjs")
  let browser
  try {
    const { chromium } = await import("@playwright/test")
    browser = await chromium.launch()
  } catch (err) {
    throw new Error(`the cascade check needs Playwright's Chromium (pnpm nx run site-v5-e2e:install): ${err.message.split("\n")[0]}`)
  }
  try {
    const page = await browser.newPage()
    await page.route("**/*", (route) => {
      const url = new URL(route.request().url())
      if (url.origin !== site.origin) return route.abort()
      const { file, status } = fileFor(site.root, decodeURIComponent(url.pathname))
      return route.fulfill({ status, path: file })
    })
    for (const urls of sets.values()) {
      const [url] = urls.sort()
      await page.goto(`${site.origin}${url}`, { waitUntil: "load" })
      const declared = await stackDeclaration(page)
      const ranked = (await layerOrder(page))[""] ?? []
      if (!declared || declared.at(-1) !== "site" || !sameList(ranked, declared)) {
        differences.push({ area: "layers", url, pages: urls.length, declared, ranked })
      }
    }
  } finally {
    await browser.close()
  }
  differences.sort((a, b) => (a.url < b.url ? -1 : 1))
  return { summary, differences }
}
