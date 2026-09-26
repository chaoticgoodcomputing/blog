// cgc-page-source: v4's "View source on GitHub" link (ShowPageSource, #42/#44), at parity.
// The fixture points `repoUrl` + `contentPath` at the fixture's own files in this repo, so a link
// can be checked against the file it names.
import fs from "node:fs"
import path from "node:path"
import { test, expect, layersOf, resolvedColour } from "../../../tests/harness/test.mjs"
import { buildPluginCopy, buildScratchSite, editConfig, fixtureConfig, testsRoot } from "../../../tests/harness/site.mjs"

const REPO = "https://github.com/chaoticgoodcomputing/blog/blob/main"
const repoRoot = path.resolve(testsRoot, "../..")

test("links a page to its source file in the repository", async ({ page }) => {
  for (const [url, file] of [
    ["/plain-note", "plain-note.md"],
    ["/nested/deep-note", "nested/deep-note.md"],
    ["/mdx-article", "mdx-article.mdx"],
  ]) {
    await page.goto(url)
    const link = page.locator(".cgc-page-source__link")
    await expect(link).toHaveAttribute("href", `${REPO}/quartz-v5/tests/content-fixture/${file}`)
    const href = await link.getAttribute("href")
    const inRepo = decodeURIComponent(href.slice(REPO.length + 1))
    expect(fs.existsSync(path.join(repoRoot, inRepo)), `${inRepo} exists in the repo`).toBe(true)
  }
})

// A plugin note is its README, symlinked into the vault (#48). Its source is the README.
test("links a symlinked page to the file the link points at", async ({ page }) => {
  await page.goto("/linked-note")
  await expect(page.locator(".cgc-page-source__link")).toHaveAttribute(
    "href",
    `${REPO}/quartz-v5/plugins/cgc-page-source/e2e/linked-note.md`,
  )
})

test("renders v4's link: GitHub mark, text, new tab", async ({ page }) => {
  await page.goto("/plain-note")
  const block = page.locator(".cgc-page-source")
  await expect(block).toHaveCount(1)
  const link = block.locator("a.cgc-page-source__link")
  await expect(link).toHaveText("View source on GitHub")
  await expect(link).toHaveAttribute("target", "_blank")
  await expect(link).toHaveAttribute("rel", "noopener noreferrer")
  const icon = link.locator("svg.cgc-page-source__icon")
  await expect(icon).toHaveAttribute("stroke", "currentColor")
  expect(await icon.boundingBox()).toMatchObject({ width: 16, height: 16 })
  // After the body, where v4 put it.
  await expect(page.locator(".page-footer .cgc-page-source")).toHaveCount(1)
})

test("renders nothing on a page with no source file", async ({ page }) => {
  // A tag with no description file is a page the tag-page plugin makes up. Its afterBody slot is
  // drawn, the subscribe box shows, so the link is missing for want of a source file alone.
  await page.goto("/tags/markdown")
  await expect(page.locator(".page-footer .cgc-email-subscribe")).toHaveCount(1)
  await expect(page.locator(".cgc-page-source")).toHaveCount(0)
  // The fixture's 404 is stock's minimal frame, which draws no afterBody slot at all, so it proves
  // nothing here. site-config.spec checks the real site's 404, whose frame does draw it.
})

test("styles the link as v4 did, from the theme's colours", async ({ page }) => {
  await page.goto("/plain-note")
  const block = page.locator(".cgc-page-source")
  await expect(block).toHaveCSS("display", "block")
  await expect(block).toHaveCSS("margin-top", "16px")
  await expect(block).toHaveCSS("margin-bottom", "16px")

  const link = block.locator(".cgc-page-source__link")
  const [light, lightgray, darkgray, dark, secondary] = await Promise.all(
    ["light", "lightgray", "darkgray", "dark", "secondary"].map((name) => resolvedColour(page, `var(--${name})`)),
  )
  for (const [property, value] of Object.entries({
    display: "inline-flex",
    "align-items": "center",
    gap: "8px",
    padding: "8px 16px",
    "border-top-width": "1px",
    "border-top-style": "solid",
    "border-top-color": lightgray,
    "border-radius": "5px",
    "font-size": "14.4px",
    "text-decoration-line": "none",
    color: darkgray,
    "background-color": light,
  })) {
    await expect(link, property).toHaveCSS(property, value)
  }
  await expect(block.locator(".cgc-page-source__icon")).toHaveCSS("flex-shrink", "0")

  // Hovered again on each try: a widget hydrating above the link can move it from under the mouse.
  await expect(async () => {
    await link.hover()
    for (const [property, value] of Object.entries({ "background-color": lightgray, "border-top-color": secondary, color: dark })) {
      await expect(link, `${property} on hover`).toHaveCSS(property, value, { timeout: 1000 })
    }
  }).toPass()
})

test("ships its CSS in the family layer, cgc.page-source", async ({ page }) => {
  await page.goto("/plain-note")
  const layers = await layersOf(page, "cgc-page-source")
  expect(layers.length).toBeGreaterThan(0)
  expect(new Set(layers)).toEqual(new Set(["cgc.page-source"]))
})

test("fails the build when repoUrl is not set", async () => {
  const config = editConfig(fixtureConfig(), (_, entry) => entry("../../plugins/cgc-page-source").deleteIn(["options", "repoUrl"]))
  const { code, output } = await buildScratchSite("page-source-no-repo", { "index.md": "# home\n" }, { config })
  expect(code).not.toBe(0)
  expect(output).toContain("cgc-page-source")
  expect(output).toContain("repoUrl")
})

// ADR-0003 rule 3: a selector that escapes the package's namespace fails the plugin's own build.
test("refuses to build a stylesheet that selects what it does not own", async () => {
  const build = await buildPluginCopy("cgc-page-source", (copy) => {
    const css = path.join(copy, "src/style.css")
    fs.appendFileSync(css, "@layer cgc.page-source {\n  .sidebar a { color: var(--dark); }\n}\n")
  })
  expect(build.code).not.toBe(0)
  expect(build.output).toContain(".sidebar")
  expect(build.dist).toBe(false)
})
