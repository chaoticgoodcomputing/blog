// The shared harness. Every spec — central, or beside its plugin in `plugins/<pkg>/e2e/` —
// imports `test` and `expect` from here, so there is one @playwright/test and one set of fixtures.
import { test as base, expect } from "@playwright/test"
import fs from "node:fs"
import path from "node:path"
import { fileFor, outputFor } from "./site.mjs"
import { BASELINE_PORT } from "./env.mjs"
import { quietAnalytics } from "./analytics.mjs"

export const BASELINE_URL = `http://localhost:${BASELINE_PORT}`

export const test = base.extend({
  // No spec reaches a real analytics service: every context answers PostHog itself (analytics.mjs).
  context: async ({ context }, use) => {
    await quietAnalytics(context)
    await use(context)
  },
  // The built fixture site on disk, for assertions on emitted files.
  emitted: async ({}, use) => {
    const root = outputFor("main")
    await use({
      root,
      exists: (rel) => fs.existsSync(path.join(root, rel)),
      read: (rel) => fs.readFileSync(path.join(root, rel), "utf8"),
      list: (ext) => fs.readdirSync(root, { recursive: true }).filter((file) => file.endsWith(ext)),
    })
  },
  // A page on the baseline site: the same fixture with every one of our plugins disabled, in the
  // same colour scheme as `page`.
  baselinePage: async ({ browser, colorScheme }, use) => {
    const context = await browser.newContext({ baseURL: BASELINE_URL, colorScheme })
    await quietAnalytics(context)
    await use(await context.newPage())
    await context.close()
  },
})
export { expect }

/**
 * Serve a built site from disk to `page` at `origin` (e.g. `https://example.com`), by intercepting
 * requests rather than listening on a port, so a scratch site can be browsed too. The site may be
 * given its own `baseUrl` as origin, which is where Quartz points its absolute URLs (self-hosted
 * fonts, OG images). Nothing sent to `origin` reaches the network: a path with no file gets the
 * site's 404 page. Requests to any other origin are left alone.
 */
export async function routeSite(page, root, origin) {
  await page.route(`${origin}/**`, (route) => {
    const { file, status } = fileFor(root, decodeURIComponent(new URL(route.request().url()).pathname))
    return route.fulfill({ status, path: file })
  })
}

/**
 * The page's cascade layers as the browser reads them: every layer name, dotted for a sublayer
 * (`cgc.mdx`), at its first appearance in document order. Layers rank by that first appearance
 * among their siblings, lowest first, so `order.filter((n) => !n.includes("."))` is the top-level
 * ranking. Walks statements, blocks, `@import … layer()` and grouping rules such as `@media`.
 */
export const layerOrder = (page) =>
  page.evaluate(() => {
    const order = []
    const add = (name) => {
      const parts = name.split(".")
      parts.forEach((_, i) => {
        const full = parts.slice(0, i + 1).join(".")
        if (!order.includes(full)) order.push(full)
      })
    }
    const join = (parent, name) => (parent ? `${parent}.${name}` : name)
    const walk = (rules, parent) => {
      for (const rule of rules) {
        if (rule instanceof CSSLayerStatementRule) rule.nameList.forEach((name) => add(join(parent, name)))
        else if (rule instanceof CSSLayerBlockRule) {
          // An anonymous block is a layer no one can name, so it holds no rank worth reading.
          if (!rule.name) continue
          add(join(parent, rule.name))
          walk(rule.cssRules, join(parent, rule.name))
        } else if (rule instanceof CSSImportRule) {
          if (rule.layerName) add(join(parent, rule.layerName))
          if (rule.styleSheet) walk(rule.styleSheet.cssRules, rule.layerName ? join(parent, rule.layerName) : parent)
        } else if (rule instanceof CSSGroupingRule) walk(rule.cssRules, parent)
      }
    }
    for (const sheet of document.styleSheets) {
      let rules
      try {
        rules = sheet.cssRules
      } catch {
        continue // cross-origin, such as a font CDN's
      }
      walk(rules, "")
    }
    return order
  })

/** The colour scheme a loaded page is showing: the stock darkmode plugin's `saved-theme`. */
export const schemeOf = (page) => page.evaluate(() => document.documentElement.getAttribute("saved-theme"))

/**
 * Switch the colour scheme on an already-loaded page, the way a reader does: through the stock
 * darkmode toggle, which flips `saved-theme` and dispatches `themechange` with no navigation
 * (ADR-0003's *the scheme changes under a loaded page* amendment). Resolves with the new scheme.
 */
export async function toggleScheme(page) {
  const before = await schemeOf(page)
  await page.locator(".darkmode").first().click()
  await expect.poll(() => schemeOf(page)).not.toBe(before)
  return schemeOf(page)
}
