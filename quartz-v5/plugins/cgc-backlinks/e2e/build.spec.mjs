// cgc-backlinks' own build: its stylesheet is library CSS (ADR-0003), in its own sublayer of the
// family layer and refused if a selector reaches outside the package's BEM block, and it carries the
// icons library's dependencies itself (libs/icons/docs/adr/0001).
import fs from "node:fs"
import path from "node:path"
import { test, expect, layersOf } from "../../../tests/harness/test.mjs"
import { buildPluginCopy } from "../../../tests/harness/site.mjs"

test("ships its CSS in the family layer, cgc.backlinks", async ({ page }) => {
  await page.goto("/backlinks/target")
  const layers = await layersOf(page, "cgc-backlinks")
  expect(layers.length).toBeGreaterThan(0)
  expect(new Set(layers)).toEqual(new Set(["cgc.backlinks"]))
})

// Builds a copy of the package, changed by `edit`, and resolves with how its build ended.
const buildCopy = (edit) => buildPluginCopy("cgc-backlinks", edit)

// ADR-0003 rule 3: a selector that escapes the package's namespace fails the plugin's own build.
test("refuses to build a stylesheet that selects what it does not own", async () => {
  const build = await buildCopy((copy) =>
    fs.appendFileSync(
      path.join(copy, "src/style.css"),
      "@layer cgc.backlinks {\n  .backlinks a { color: var(--dark); }\n}\n",
    ),
  )
  expect(build.code).not.toBe(0)
  expect(build.output).toContain(".backlinks")
  expect(build.dist).toBe(false)
})

// Iconify's packages run while the site builds and stay out of dist/, so this plugin carries them
// itself, at the icons library's versions. Its build refuses to drift.
test("refuses to build unless it carries the icons library's dependencies, at its versions", async () => {
  const build = await buildCopy((copy) => {
    const pkg = JSON.parse(fs.readFileSync(path.join(copy, "package.json"), "utf8"))
    pkg.dependencies["@iconify-json/mdi"] = "^1.0.0"
    fs.writeFileSync(path.join(copy, "package.json"), JSON.stringify(pkg))
  })
  expect(build.code).not.toBe(0)
  expect(build.output).toContain('"@iconify-json/mdi": "1.2.3" (here: ^1.0.0)')
  expect(build.dist).toBe(false)
})
