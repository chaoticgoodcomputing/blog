// The shared harness. Every spec — central, or beside its plugin in `plugins/<pkg>/e2e/` —
// imports `test` and `expect` from here, so there is one @playwright/test and one set of fixtures.
import { test as base, expect } from "@playwright/test"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { buildScratchSite, fileFor, outputFor } from "./site.mjs"
import { BASELINE_PORT } from "./env.mjs"
import { quietAnalytics } from "./analytics.mjs"
import { blueskyStandIn } from "./bluesky.mjs"
import { githubStandIn } from "./github.mjs"

export const BASELINE_URL = `http://localhost:${BASELINE_PORT}`

export const test = base.extend({
  // No spec reaches a real analytics service: every context answers PostHog itself (analytics.mjs).
  // Nor Bluesky: every context answers it from the fixture's posts (bluesky.mjs). Nor GitHub: every
  // context answers it from the fixture's user (github.mjs).
  context: async ({ context }, use) => {
    await quietAnalytics(context)
    await blueskyStandIn(context)
    await githubStandIn(context)
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
    await blueskyStandIn(context)
    await githubStandIn(context)
    await use(await context.newPage())
    await context.close()
  },
  // What a test makes for itself, deleted once it ends, pass or fail: `dir(name)`, a fresh directory
  // outside the repo, and `site(name, files, options)`, a scratch site built as `buildScratchSite`
  // builds one and kept until then. For a spec whose helpers make them as they go; a spec that builds
  // one site for a whole file removes it itself, in `afterAll`.
  scratch: async ({}, use) => {
    const removals = []
    await use({
      dir(name) {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), `cgc-${name}-`))
        removals.push(() => fs.rmSync(dir, { recursive: true, force: true }))
        return dir
      },
      async site(name, files, options = {}) {
        const site = await buildScratchSite(name, files, { ...options, keep: true })
        removals.push(site.remove)
        return site
      },
    })
    for (const remove of removals) remove()
  },
})
export { expect }
export { layerOrder, layersOf, stackDeclaration, styleRules, unreadableSheets } from "./layers.mjs"

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
 * What `color: <value>` resolves to on a loaded page right now, as `rgb(…)`, through a probe element:
 * a theme colour such as `var(--gray)` in the scheme the page is showing, or any other colour value,
 * such as a `color-mix()` of two.
 */
export const resolvedColour = (page, value) =>
  page.evaluate((value) => {
    const probe = document.body.appendChild(document.createElement("i"))
    probe.style.color = value
    const colour = getComputedStyle(probe).color
    probe.remove()
    return colour
  }, value)

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
