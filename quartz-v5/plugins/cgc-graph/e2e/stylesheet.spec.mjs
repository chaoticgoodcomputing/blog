// cgc-graph's CSS is library CSS (ADR-0003): it lands in the family layer, `cgc.graph` (rule 11), and a
// stylesheet that reaches outside the plugin's own block fails its build (rules 2 and 3).
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { test, expect } from "../../../tests/harness/test.mjs"
import { testsRoot } from "../../../tests/harness/site.mjs"

const pluginRoot = path.resolve(testsRoot, "../plugins/cgc-graph")

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

test("ships its CSS in the family layer, cgc.graph", async ({ page }) => {
  await page.goto("/plain-note")
  const layers = await layersOf(page, "cgc-graph")
  expect(layers.length).toBeGreaterThan(0)
  expect(new Set(layers)).toEqual(new Set(["cgc.graph"]))
})

const buildWith = async (css) => {
  const copy = fs.mkdtempSync(path.join(os.tmpdir(), "cgc-graph-"))
  try {
    for (const entry of ["package.json", "build.mjs", "src"])
      fs.cpSync(path.join(pluginRoot, entry), path.join(copy, entry), { recursive: true })
    fs.symlinkSync(path.join(pluginRoot, "node_modules"), path.join(copy, "node_modules"))
    fs.appendFileSync(path.join(copy, "src/style.css"), css)
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
