// cgc-tag-explorer's stylesheet is library CSS (ADR-0003): in its own sublayer of the family layer, and
// refused at build time if a selector reaches outside the package's BEM block.
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { test, expect } from "../../../tests/harness/test.mjs"
import { testsRoot } from "../../../tests/harness/site.mjs"

const pluginRoot = path.resolve(testsRoot, "../plugins/cgc-tag-explorer")

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

test("ships its CSS in the family layer, cgc.tag-explorer", async ({ page }) => {
  await page.goto("/plain-note")
  const layers = await layersOf(page, "cgc-tag-explorer")
  expect(layers.length).toBeGreaterThan(0)
  expect(new Set(layers)).toEqual(new Set(["cgc.tag-explorer"]))
})

// ADR-0003 rule 3: a selector that escapes the package's namespace fails the plugin's own build.
test("refuses to build a stylesheet that selects what it does not own", async () => {
  const copy = fs.mkdtempSync(path.join(os.tmpdir(), "cgc-tag-explorer-"))
  try {
    for (const entry of ["package.json", "build.mjs", "src"])
      fs.cpSync(path.join(pluginRoot, entry), path.join(copy, entry), { recursive: true })
    fs.symlinkSync(path.join(pluginRoot, "node_modules"), path.join(copy, "node_modules"))
    fs.appendFileSync(
      path.join(copy, "src/style.css"),
      "@layer cgc.tag-explorer {\n  .sidebar .cgc-tag-explorer { order: -1; }\n}\n",
    )
    const build = await promisify(execFile)("node", ["build.mjs"], { cwd: copy }).then(
      () => ({ code: 0, output: "" }),
      (err) => ({ code: err.code, output: `${err.stdout}${err.stderr}` }),
    )
    expect(build.code).not.toBe(0)
    expect(build.output).toContain(".sidebar")
    expect(fs.existsSync(path.join(copy, "dist"))).toBe(false)
  } finally {
    fs.rmSync(copy, { recursive: true, force: true })
  }
})
