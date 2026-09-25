// cgc-backlinks' own build: its stylesheet is library CSS (ADR-0003), in its own sublayer of the
// family layer and refused if a selector reaches outside the package's BEM block, and it carries the
// icons library's dependencies itself (libs/icons/docs/adr/0001).
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { test, expect } from "../../../tests/harness/test.mjs"
import { testsRoot } from "../../../tests/harness/site.mjs"

const pluginRoot = path.resolve(testsRoot, "../plugins/cgc-backlinks")

// The cascade layer of every stylesheet rule whose selector mentions `name`.
const layersOf = (page, name) =>
  page.evaluate((name) => {
    const found = []
    const visit = (rules, layer) => {
      for (const rule of rules) {
        if (rule instanceof CSSLayerBlockRule) visit(rule.cssRules, [...layer, rule.name])
        else if (rule instanceof CSSStyleRule)
          rule.selectorText.includes(name) && found.push(layer.join("."))
        else if (rule.cssRules) visit(rule.cssRules, layer)
      }
    }
    for (const sheet of document.styleSheets) {
      try {
        visit(sheet.cssRules, [])
      } catch {
        // a cross-origin sheet, a font CDN's, is not ours
      }
    }
    return found
  }, name)

test("ships its CSS in the family layer, cgc.backlinks", async ({ page }) => {
  await page.goto("/backlinks/target")
  const layers = await layersOf(page, "cgc-backlinks")
  expect(layers.length).toBeGreaterThan(0)
  expect(new Set(layers)).toEqual(new Set(["cgc.backlinks"]))
})

// Builds a copy of the package, changed by `edit`, and resolves with how its build ended.
async function buildCopy(edit) {
  const copy = fs.mkdtempSync(path.join(os.tmpdir(), "cgc-backlinks-"))
  try {
    for (const entry of ["package.json", "build.mjs", "src"])
      fs.cpSync(path.join(pluginRoot, entry), path.join(copy, entry), { recursive: true })
    fs.symlinkSync(path.join(pluginRoot, "node_modules"), path.join(copy, "node_modules"))
    edit(copy)
    const build = await promisify(execFile)("node", ["build.mjs"], { cwd: copy }).then(
      () => ({ code: 0, output: "" }),
      (err) => ({ code: err.code, output: `${err.stdout}${err.stderr}` }),
    )
    return { ...build, dist: fs.existsSync(path.join(copy, "dist")) }
  } finally {
    fs.rmSync(copy, { recursive: true, force: true })
  }
}

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
