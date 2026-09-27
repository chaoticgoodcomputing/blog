// quartz-social's stylesheet is library CSS (ADR-0003): in its own sublayer of the family layer, the
// post card's rules included, and refused at build time if a selector reaches outside the package's
// BEM block.
import fs from "node:fs"
import path from "node:path"
import { test, expect, layersOf } from "../../../tests/harness/test.mjs"
import { buildPluginCopy } from "../../../tests/harness/site.mjs"

test("ships its CSS, and the post card's, in the family layer, cgc.social", async ({ page }) => {
  await page.goto("/")
  for (const block of ["cgc-social", "cgc-bluesky"]) {
    const layers = await layersOf(page, block)
    expect(layers.length, block).toBeGreaterThan(0)
    expect(new Set(layers), block).toEqual(new Set(["cgc.social"]))
  }
})

// ADR-0003 rule 3: a selector that escapes the package's namespace fails the plugin's own build.
test("refuses to build a stylesheet that selects what it does not own", async () => {
  const build = await buildPluginCopy("quartz-social", (copy) => {
    fs.appendFileSync(
      path.join(copy, "src/style.css"),
      "@layer cgc.social {\n  .cgc-social .cgc-bluesky__avatar { width: 32px; }\n}\n",
    )
  })
  expect(build.code).not.toBe(0)
  expect(build.output).toContain(".cgc-bluesky__avatar")
  expect(build.dist).toBe(false)
})
