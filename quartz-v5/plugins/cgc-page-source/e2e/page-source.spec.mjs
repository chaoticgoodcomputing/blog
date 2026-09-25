// cgc-page-source: v4's "View source on GitHub" link (ShowPageSource, #42/#44), at parity.
// The fixture points `repoUrl` + `contentPath` at the fixture's own files in this repo, so a link
// can be checked against the file it names.
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { execFile } from "node:child_process"
import { createRequire } from "node:module"
import { promisify } from "node:util"
import { test, expect } from "../../../tests/harness/test.mjs"
import { buildScratchSite, testsRoot, vendored } from "../../../tests/harness/site.mjs"

const REPO = "https://github.com/chaoticgoodcomputing/blog/blob/main"
const repoRoot = path.resolve(testsRoot, "../..")
const pluginRoot = path.resolve(testsRoot, "../plugins/cgc-page-source")
const YAML = createRequire(path.join(vendored, "package.json"))("yaml")

// A theme colour as the page resolves it, e.g. `var(--gray)` → `rgb(…)`, in the page's scheme.
const colour = (page, value) =>
  page.evaluate((value) => {
    const probe = document.body.appendChild(document.createElement("i"))
    probe.style.color = value
    const resolved = getComputedStyle(probe).color
    probe.remove()
    return resolved
  }, value)

// The cascade layer of every stylesheet rule whose selector mentions `name`.
const layersOf = (page, name) =>
  page.evaluate((name) => {
    const found = []
    const visit = (rules, layer) => {
      for (const rule of rules) {
        if (rule instanceof CSSLayerBlockRule) visit(rule.cssRules, [...layer, rule.name])
        else if (rule instanceof CSSStyleRule) rule.selectorText.includes(name) && found.push(layer.join("."))
        else if (rule.cssRules) visit(rule.cssRules, layer)
      }
    }
    for (const sheet of document.styleSheets) {
      let rules
      try {
        rules = sheet.cssRules
      } catch {
        continue // a cross-origin sheet (a CDN's) cannot be read, and is not ours
      }
      visit(rules, [])
    }
    return found
  }, name)

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
  // A tag with no description file is a page the tag-page plugin makes up.
  await page.goto("/tags/markdown")
  await expect(page.locator("article")).toBeAttached()
  await expect(page.locator(".cgc-page-source")).toHaveCount(0)
  await page.goto("/no-such-page")
  await expect(page.locator(".cgc-page-source")).toHaveCount(0)
})

test("styles the link as v4 did, from the theme's colours", async ({ page }) => {
  await page.goto("/plain-note")
  const block = page.locator(".cgc-page-source")
  await expect(block).toHaveCSS("display", "block")
  await expect(block).toHaveCSS("margin-top", "16px")
  await expect(block).toHaveCSS("margin-bottom", "16px")

  const link = block.locator(".cgc-page-source__link")
  const [light, lightgray, darkgray, dark, secondary] = await Promise.all(
    ["light", "lightgray", "darkgray", "dark", "secondary"].map((name) => colour(page, `var(--${name})`)),
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
  const config = YAML.parseDocument(fs.readFileSync(path.join(testsRoot, "quartz.config.yaml"), "utf8"))
  const entry = config.get("plugins").items.find((item) => item.get("source") === "../../plugins/cgc-page-source")
  entry.deleteIn(["options", "repoUrl"])
  const { code, output } = await buildScratchSite("page-source-no-repo", { "index.md": "# home\n" }, { config: String(config) })
  expect(code).not.toBe(0)
  expect(output).toContain("cgc-page-source")
  expect(output).toContain("repoUrl")
})

// ADR-0003 rule 3: a selector that escapes the package's namespace fails the plugin's own build.
test("refuses to build a stylesheet that selects what it does not own", async () => {
  const copy = fs.mkdtempSync(path.join(os.tmpdir(), "cgc-page-source-"))
  try {
    for (const entry of ["package.json", "build.mjs", "src"]) fs.cpSync(path.join(pluginRoot, entry), path.join(copy, entry), { recursive: true })
    fs.symlinkSync(path.join(pluginRoot, "node_modules"), path.join(copy, "node_modules"))
    const css = path.join(copy, "src/style.css")
    fs.appendFileSync(css, "@layer cgc.page-source {\n  .sidebar a { color: var(--dark); }\n}\n")
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
