// cgc-email-subscribe: v4's Buttondown subscribe box (EmailSubscribe, #42/#44), at parity.
// Buttondown itself is never reached: every request to it is intercepted.
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { execFile } from "node:child_process"
import { createRequire } from "node:module"
import { promisify } from "node:util"
import { test, expect, toggleScheme } from "../../../tests/harness/test.mjs"
import { buildScratchSite, testsRoot, vendored } from "../../../tests/harness/site.mjs"

// The fixture's `buttondownUsername` is `cgc-fixture`.
const ENDPOINT = "https://buttondown.com/api/emails/embed-subscribe/cgc-fixture"
const pluginRoot = path.resolve(testsRoot, "../plugins/cgc-email-subscribe")
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
const palette = async (page, names) =>
  Object.fromEntries(await Promise.all(names.map(async (name) => [name, await colour(page, `var(--${name})`)])))

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

const expectStyles = async (locator, styles) => {
  for (const [property, value] of Object.entries(styles)) await expect(locator, property).toHaveCSS(property, value)
}

test("renders v4's subscribe box, with its default title and description", async ({ page }) => {
  await page.goto("/plain-note")
  const box = page.locator(".cgc-email-subscribe")
  await expect(box).toHaveCount(1)
  await expect(box.locator("h3.cgc-email-subscribe__title")).toHaveText("Newsletter")
  await expect(box.locator("p.cgc-email-subscribe__description")).toHaveText("Weekly updates about any new notes!")
  const form = box.locator("form.cgc-email-subscribe__form")
  await expect(form).toHaveAttribute("action", ENDPOINT)
  await expect(form).toHaveAttribute("method", "post")
  const input = form.locator("input.cgc-email-subscribe__input")
  await expect(input).toHaveAttribute("type", "email")
  await expect(input).toHaveAttribute("name", "email")
  await expect(input).toHaveAttribute("placeholder", "you@youmail.com")
  await expect(input).toHaveJSProperty("required", true)
  await expect(form.locator("input.cgc-email-subscribe__submit")).toHaveAttribute("value", "Subscribe")
  // After the body, where v4 put it on notes.
  await expect(page.locator(".page-footer .cgc-email-subscribe")).toHaveCount(1)
})

test("submits the reader's address to the configured Buttondown endpoint", async ({ page }) => {
  const sent = []
  await page.route("https://buttondown.com/**", (route) => {
    sent.push(route.request())
    return route.fulfill({ status: 200, contentType: "text/html", body: "<p>Thanks!</p>" })
  })
  await page.goto("/plain-note")
  const box = page.locator(".cgc-email-subscribe")

  // An empty address is held back by the browser, as v4's `required` did.
  await box.getByRole("button", { name: "Subscribe" }).click()
  expect(await box.getByPlaceholder("you@youmail.com").evaluate((input) => input.validity.valueMissing)).toBe(true)
  expect(sent).toHaveLength(0)

  await box.getByPlaceholder("you@youmail.com").fill("reader@example.com")
  await box.getByRole("button", { name: "Subscribe" }).click()
  await expect.poll(() => sent.length).toBe(1)
  expect(sent[0].url()).toBe(ENDPOINT)
  expect(sent[0].method()).toBe("POST")
  expect(new URLSearchParams(sent[0].postData()).get("email")).toBe("reader@example.com")
})

test("styles the box as v4 did, from the theme's colours", async ({ page }) => {
  await page.goto("/plain-note")
  const box = page.locator(".cgc-email-subscribe")
  const { light, lightgray, gray, dark, secondary } = await palette(page, ["light", "lightgray", "gray", "dark", "secondary"])

  await expectStyles(box.locator(".cgc-email-subscribe__panel"), {
    "margin-top": "0px",
    padding: "16px",
    "border-top-width": "1px",
    "border-top-style": "solid",
    "border-top-color": lightgray,
    "border-radius": "8px",
    "background-color": light,
  })
  await expectStyles(box.locator(".cgc-email-subscribe__description"), {
    "margin-top": "0px",
    "margin-bottom": "8px",
    color: gray,
    "font-size": "12.8px",
  })
  await expectStyles(box.locator(".cgc-email-subscribe__form"), { display: "flex", "flex-direction": "column", gap: "12px" })

  const input = box.locator(".cgc-email-subscribe__input")
  await expectStyles(input, {
    padding: "12px",
    "border-top-width": "1px",
    "border-top-style": "solid",
    "border-top-color": lightgray,
    "border-radius": "4px",
    "font-size": "16px",
    "background-color": light,
    color: dark,
  })
  await input.focus()
  await expectStyles(input, { "border-top-color": secondary, "outline-style": "none" })

  const submit = box.locator(".cgc-email-subscribe__submit")
  await expectStyles(submit, {
    padding: "12px 24px",
    "border-top-style": "none",
    "border-radius": "4px",
    "background-color": secondary,
    color: light,
    "font-weight": "600",
    "font-size": "16px",
    cursor: "pointer",
  })
  // Hovered again on each try: a widget hydrating above the box can move it from under the mouse.
  await expect(async () => {
    await submit.hover()
    await expect(submit).toHaveCSS("opacity", "0.9", { timeout: 1000 })
  }).toPass()
})

test("follows a scheme switch on a loaded page", async ({ page }) => {
  await page.goto("/plain-note")
  const submit = page.locator(".cgc-email-subscribe__submit")
  await expect(submit).toHaveCSS("background-color", await colour(page, "var(--secondary)"))
  const before = await colour(page, "var(--secondary)")
  await toggleScheme(page)
  const after = await colour(page, "var(--secondary)")
  expect(after).not.toBe(before)
  await expect(submit).toHaveCSS("background-color", after)
})

test("ships its CSS in the family layer, cgc.email-subscribe", async ({ page }) => {
  await page.goto("/plain-note")
  const layers = await layersOf(page, "cgc-email-subscribe")
  expect(layers.length).toBeGreaterThan(0)
  expect(new Set(layers)).toEqual(new Set(["cgc.email-subscribe"]))
})

test("fails the build when buttondownUsername is not set", async () => {
  const config = YAML.parseDocument(fs.readFileSync(path.join(testsRoot, "quartz.config.yaml"), "utf8"))
  const entry = config.get("plugins").items.find((item) => item.get("source") === "../../plugins/cgc-email-subscribe")
  entry.deleteIn(["options", "buttondownUsername"])
  const { code, output } = await buildScratchSite("email-no-user", { "index.md": "# home\n" }, { config: String(config) })
  expect(code).not.toBe(0)
  expect(output).toContain("cgc-email-subscribe")
  expect(output).toContain("buttondownUsername")
})

// ADR-0003 rule 3: a selector that escapes the package's namespace fails the plugin's own build.
test("refuses to build a stylesheet that selects what it does not own", async () => {
  const copy = fs.mkdtempSync(path.join(os.tmpdir(), "cgc-email-subscribe-"))
  try {
    for (const entry of ["package.json", "build.mjs", "src"]) fs.cpSync(path.join(pluginRoot, entry), path.join(copy, entry), { recursive: true })
    fs.symlinkSync(path.join(pluginRoot, "node_modules"), path.join(copy, "node_modules"))
    fs.appendFileSync(path.join(copy, "src/style.css"), "@layer cgc.email-subscribe {\n  input[type=\"email\"] { padding: 0; }\n}\n")
    const build = await promisify(execFile)("node", ["build.mjs"], { cwd: copy }).then(
      () => ({ code: 0, output: "" }),
      (err) => ({ code: err.code, output: `${err.stdout}${err.stderr}` }),
    )
    expect(build.code).not.toBe(0)
    expect(build.output).toContain("input")
    expect(fs.existsSync(path.join(copy, "dist"))).toBe(false)
  } finally {
    fs.rmSync(copy, { recursive: true, force: true })
  }
})
