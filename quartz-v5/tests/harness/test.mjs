// The shared harness. Every spec — central, or beside its plugin in `plugins/<pkg>/e2e/` —
// imports `test` and `expect` from here, so there is one @playwright/test and one set of fixtures.
import { test as base, expect } from "@playwright/test"
import fs from "node:fs"
import path from "node:path"
import { outputFor } from "./site.mjs"
import { BASELINE_PORT } from "./env.mjs"

export const BASELINE_URL = `http://localhost:${BASELINE_PORT}`

export const test = base.extend({
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
    await use(await context.newPage())
    await context.close()
  },
})
export { expect }

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
