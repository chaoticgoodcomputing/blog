// tags-core's colour resolver, for code that paints on a canvas and can't use CSS (#31). cgc-graph
// paints every tag colour with it (#77), and its specs prove the resolver there: a hex, a
// `light-dark()` pair and a `var()` chain, each in both schemes and again after a switch
// (plugins/cgc-graph/e2e/colours.spec.mjs, scheme.spec.mjs). What no consumer paints yet is a colour
// whose computed value isn't `rgb()`, so a probe stands in for one: the resolver, bundled for the
// browser the way a consuming plugin's build would bundle it, run on a fixture page.
import path from "node:path"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import { test, expect } from "../../../tests/harness/test.mjs"
import { vendored } from "../../../tests/harness/site.mjs"

const esbuild = createRequire(path.join(vendored, "package.json"))("esbuild")
const source = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src/colour.ts")

let probe
test.beforeAll(async () => {
  const { outputFiles } = await esbuild.build({
    entryPoints: [source],
    bundle: true,
    write: false,
    format: "iife",
    globalName: "tagsCore",
    platform: "browser",
  })
  probe = outputFiles[0].text
})

test("normalises any colour syntax to rgba()", async ({ page }) => {
  await page.goto("/plain-note")
  await page.addScriptTag({ content: probe })
  expect(await page.evaluate(() => window.tagsCore.resolveColour("color(srgb 0 0.5 1)"))).toBe(
    "rgba(0, 128, 255, 1)",
  )
})
