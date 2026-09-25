// tags-core's colour resolver, for code that paints on a canvas and can't use CSS (#31). No plugin
// paints tag colours on a canvas until cgc-graph (#77), so a probe stands in for it: the resolver,
// bundled for the browser the way a consuming plugin's build would bundle it, run on a fixture page
// that carries the cgc-tags engine's `--cgc-tag-*` properties.
import path from "node:path"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import { test, expect, toggleScheme } from "../../../tests/harness/test.mjs"
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

const resolveTag = (page, property) =>
  page.evaluate((property) => window.tagsCore.resolveTagColour(property), property)

// The fixture's `markdown: { color: "light-dark(#b35f00, #de8200)" }`, and `writing/essays`, which
// inherits `writing: { color: "var(--secondary)" }`: the palette's `secondary` in each scheme.
const MARKDOWN = { light: "rgba(179, 95, 0, 1)", dark: "rgba(222, 130, 0, 1)" }
const ESSAYS = { light: "rgba(40, 75, 99, 1)", dark: "rgba(123, 151, 170, 1)" }

test("resolves a tag's colour property to the colour the page shows", async ({
  page,
  colorScheme,
}) => {
  await page.goto("/plain-note")
  await page.addScriptTag({ content: probe })
  expect(await resolveTag(page, "--cgc-tag-markdown")).toBe(MARKDOWN[colorScheme])
  expect(await resolveTag(page, "--cgc-tag-writing--essays")).toBe(ESSAYS[colorScheme])
})

test("resolves again in the new scheme once the reader switches", async ({ page, colorScheme }) => {
  await page.goto("/plain-note")
  await page.addScriptTag({ content: probe })
  expect(await resolveTag(page, "--cgc-tag-markdown")).toBe(MARKDOWN[colorScheme])
  const other = await toggleScheme(page)
  expect(await resolveTag(page, "--cgc-tag-markdown")).toBe(MARKDOWN[other])
  expect(await resolveTag(page, "--cgc-tag-writing--essays")).toBe(ESSAYS[other])
})

test("normalises any colour syntax to rgba()", async ({ page }) => {
  await page.goto("/plain-note")
  await page.addScriptTag({ content: probe })
  expect(await page.evaluate(() => window.tagsCore.resolveColour("color(srgb 0 0.5 1)"))).toBe(
    "rgba(0, 128, 255, 1)",
  )
})
