// quartz-post-listing's stylesheet is library CSS (ADR-0003): in its own sublayer of the family layer,
// and refused at build time if a selector reaches outside the package's BEM block.
import fs from "node:fs"
import path from "node:path"
import { test, expect, layersOf } from "../../../tests/harness/test.mjs"
import { buildPluginCopy } from "../../../tests/harness/site.mjs"

test("ships its CSS in the family layer, cgc.post-listing", async ({ page }) => {
  await page.goto("/")
  const layers = await layersOf(page, "cgc-post-listing")
  expect(layers.length).toBeGreaterThan(0)
  expect(new Set(layers)).toEqual(new Set(["cgc.post-listing"]))
})

// ADR-0003 rule 3: a selector that escapes the package's namespace fails the plugin's own build.
test("refuses to build a stylesheet that selects what it does not own", async () => {
  const build = await buildPluginCopy("quartz-post-listing", (copy) => {
    fs.appendFileSync(
      path.join(copy, "src/style.css"),
      "@layer cgc.post-listing {\n  .tags a { color: var(--dark); }\n}\n",
    )
  })
  expect(build.code).not.toBe(0)
  expect(build.output).toContain(".tags")
  expect(build.dist).toBe(false)
})
