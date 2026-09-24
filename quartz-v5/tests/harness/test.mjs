// The shared harness. Every spec — central, or beside its plugin in `plugins/<pkg>/e2e/` —
// imports `test` and `expect` from here, so there is one @playwright/test and one set of fixtures.
import { test as base, expect } from "@playwright/test"
import fs from "node:fs"
import path from "node:path"
import { outputFor } from "./site.mjs"

export const BASELINE_URL = "http://localhost:4174"

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
  // A page on the baseline site: the same fixture with every one of our plugins disabled.
  baselinePage: async ({ browser }, use) => {
    const context = await browser.newContext({ baseURL: BASELINE_URL })
    await use(await context.newPage())
    await context.close()
  },
})
export { expect }
