// cgc-graph's CSS is library CSS (ADR-0003): it lands in the family layer, `cgc.graph` (rule 11), and a
// stylesheet that reaches outside the plugin's own block fails its build (rules 2 and 3).
import fs from "node:fs"
import path from "node:path"
import { test, expect, layersOf } from "../../../tests/harness/test.mjs"
import { buildPluginCopy } from "../../../tests/harness/site.mjs"

test("ships its CSS in the family layer, cgc.graph", async ({ page }) => {
  await page.goto("/plain-note")
  const layers = await layersOf(page, "cgc-graph")
  expect(layers.length).toBeGreaterThan(0)
  expect(new Set(layers)).toEqual(new Set(["cgc.graph"]))
})

const buildWith = (css) => buildPluginCopy("quartz-graph", (copy) => fs.appendFileSync(path.join(copy, "src/style.css"), css))

// ADR-0003 rule 3: a selector that escapes the package's namespace fails the plugin's own build.
test("refuses to build a stylesheet that selects what it does not own", async () => {
  const build = await buildWith("@layer cgc.graph {\n  .graph canvas { display: none; }\n}\n")
  expect(build.code).not.toBe(0)
  expect(build.output).toContain(".graph")
  expect(build.dist).toBe(false)
})

// Rule 5: skin comes from the theme, so a colour or a font of its own fails the build.
test("refuses to build a stylesheet with a colour or a font of its own", async () => {
  const build = await buildWith(
    "@layer cgc.graph {\n  .cgc-graph__title { color: #c54040; font-family: Georgia, serif; }\n}\n",
  )
  expect(build.code).not.toBe(0)
  expect(build.output).toContain("#c54040")
  expect(build.output).toContain("Georgia")
})
