// ADR-0001: one esbuild build with shared chunks, and each page loads only what its imports reach.
// ADR-0002's widget-layer amendment: that CSS lands in `cgc.mdx.widgets`, above core and themes,
// below the site.
import { test, expect, layerOrder, resolvedColour, routeSite } from "../../../tests/harness/test.mjs"
import { fixtureConfig, othersOff, withPlugins } from "../../../tests/harness/site.mjs"

// Every cgc-mdx asset the page fetches from here on.
function recordWidgetRequests(page) {
  const seen = []
  page.on("request", (req) => {
    const path = new URL(req.url()).pathname
    if (path.startsWith("/static/cgc-mdx/")) seen.push(path)
  })
  return seen
}

// Bring client:visible islands into view and wait until each has hydrated, so everything the page
// can load has loaded. `networkidle` alone isn't enough: it's sticky, so once the page has idled it
// returns before a visible island's import() starts (#51).
async function hydrateIslands(page) {
  for (const island of await page.locator(".cgc-mdx-island").all()) {
    await island.scrollIntoViewIfNeeded()
    await expect(island).toHaveAttribute("data-cgc-hydrated", "")
  }
  await page.waitForLoadState("networkidle")
}

// Every cgc-mdx asset a page fetches, once its islands are hydrated.
async function widgetRequests(page, url) {
  const seen = recordWidgetRequests(page)
  await page.goto(url)
  await hydrateIslands(page)
  return seen
}

const entry = (paths) => paths.filter((p) => /GameOfLife-[^/]+\.js$/.test(p))

test("a page with no widget loads no widget code", async ({ page }) => {
  expect(await widgetRequests(page, "/mdx-article.mdx")).toEqual([])
})

test("a markdown page loads no widget code", async ({ page }) => {
  expect(await widgetRequests(page, "/plain-note")).toEqual([])
})

test("two pages importing one widget load the same entry", async ({ browser }) => {
  const load = async (url) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    const seen = await widgetRequests(page, url)
    await context.close()
    return seen
  }
  const life = await load("/lab/life.mdx")
  const again = await load("/lab/life-again.mdx")
  expect(entry(life)).toHaveLength(1)
  expect(entry(again)).toEqual(entry(life))
})

// The #51 flake made deterministic: a loaded machine idles the page before the scroll.
test("a visible island's entry is counted even when the page idles before it scrolls into view", async ({ page }) => {
  const seen = recordWidgetRequests(page)
  await page.goto("/lab/life-again.mdx")
  await page.waitForLoadState("networkidle")
  expect(entry(seen)).toEqual([])
  await hydrateIslands(page)
  expect(entry(seen)).toHaveLength(1)
})

test("a page loads only the widgets it imports", async ({ page }) => {
  const seen = await widgetRequests(page, "/lab/echo.mdx")
  expect(seen.some((p) => p.includes("Echo-"))).toBe(true)
  expect(seen.some((p) => p.includes("GameOfLife-"))).toBe(false)
})

test("the widget's imported CSS reaches the page", async ({ page }) => {
  await page.goto("/lab/life.mdx")
  await expect(page.locator(".cgc-mdx-island")).toHaveAttribute("data-cgc-hydrated", "")
  await expect(page.locator(".life")).toHaveCSS("border-radius", "8px")
})

test("the widget's CSS is in the served head, so build-time markup is styled on first paint", async ({ emitted }) => {
  const head = emitted.read("lab/life.mdx.html").split("</head>")[0]
  expect(head).toMatch(/<link rel="stylesheet" href="\.\.\/static\/cgc-mdx\/GameOfLife-[^"]+\.css" data-persist/)
  expect(emitted.read("lab/echo.mdx.html")).not.toContain("GameOfLife-")
})

// The widget layer (ADR-0002, #45). The fixture sites stay stock, so the site's CSS is stood in for
// by a stylesheet the spec adds: the stack's `cgc, site` and one `site` rule, placed where
// site-styles' externalResources() sheet sits on the real site, ahead of every widget link.
async function addSiteCss(page, rules) {
  await page.evaluate((rules) => {
    const style = document.createElement("style")
    style.setAttribute("data-persist", "")
    style.textContent = `@layer cgc, site;\n@layer site { ${rules} }`
    const widgetLink = document.querySelector('link[href*="static/cgc-mdx/"]')
    if (widgetLink) widgetLink.before(style)
    else document.head.append(style)
  }, rules)
}

// A widget stylesheet's rules as the browser parsed them: imports with their layer, layer
// statements, layer blocks with their contents, and style rules by selector.
function widgetSheet(page, widget) {
  return page.evaluate((widget) => {
    const outline = (rules) =>
      [...rules].map((rule) => {
        if (rule instanceof CSSImportRule) return `@import ${rule.href}${rule.layerName === null ? "" : ` layer(${rule.layerName})`}`
        if (rule instanceof CSSLayerStatementRule) return `@layer ${rule.nameList.join(", ")};`
        if (rule instanceof CSSLayerBlockRule) return { [`@layer ${rule.name}`]: outline(rule.cssRules) }
        if (rule instanceof CSSStyleRule) return rule.selectorText
        return rule.cssText.split("{")[0].trim()
      })
    const sheet = [...document.styleSheets].find((s) => new RegExp(`/static/cgc-mdx/${widget}-[^/]+\\.css$`).test(s.href ?? ""))
    return sheet ? outline(sheet.cssRules) : null
  }, widget)
}

test("widget CSS in the served head is inside the widget layer", async ({ page }) => {
  await page.goto("/lab/life.mdx")
  expect(await widgetSheet(page, "GameOfLife")).toEqual([
    { "@layer cgc.mdx.widgets": [".life", ".life__reset", ".life__reset:hover", ".life__canvas"] },
  ])
})

test("a site-layer rule beats a widget rule on the same element", async ({ page }) => {
  await page.goto("/lab/life.mdx")
  await addSiteCss(page, ".life { border-radius: 2px }")
  await expect(page.locator(".life")).toHaveCSS("border-radius", "2px")
})

test("a site-layer rule beats a widget whose CSS arrived by SPA navigation", async ({ page }) => {
  await page.goto("/lab/echo.mdx")
  await addSiteCss(page, ".life { border-radius: 2px }")
  await page.locator("article a.internal", { hasText: "Life" }).click()
  await expect(page).toHaveURL(/\/lab\/life\.mdx$/)
  await expect(page.locator(".cgc-mdx-island")).toHaveAttribute("data-cgc-hydrated", "")
  await expect(page.locator(".life")).toHaveCSS("border-radius", "2px")
})

// /lab/cascade.mdx's widget carries its own layer and two remote imports. Their host never resolves
// (`.invalid`, RFC 2606), so these specs serve the imported sheets themselves.
const REMOTE = "https://widgets.cgc-fixture.invalid"
const REMOTE_CSS = {
  "/remote.css": ".cascade__remote { border-radius: 8px; outline-offset: 3px }",
  "/layered.css": "",
  // More specific than the widget's own `.cascade__anonymous`, which it must still lose to.
  "/anonymous.css": ".cascade p.cascade__anonymous { border-radius: 2px; outline-offset: 3px }",
}
const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
async function gotoCascade(page) {
  await page.route(`${REMOTE}/**`, (route) =>
    route.fulfill({ contentType: "text/css", body: REMOTE_CSS[new URL(route.request().url()).pathname] ?? "" }),
  )
  await page.goto("/lab/cascade.mdx")
}

test("a widget's own layer nests inside the widget layer", async ({ page }) => {
  await gotoCascade(page)
  expect((await widgetSheet(page, "Cascade"))?.at(-1)).toEqual({
    "@layer cgc.mdx.widgets": [".cascade", ".cascade__strong", ".cascade__anonymous", { "@layer cascade": [".cascade__nested"] }],
  })
  await addSiteCss(page, ".cascade__nested { border-radius: 2px }")
  await expect(page.locator(".cascade__nested")).toHaveCSS("border-radius", "2px")
})

test("a remote @import is hoisted into the widget layer", async ({ page }) => {
  await gotoCascade(page)
  expect((await widgetSheet(page, "Cascade"))?.slice(0, -1)).toEqual([
    "@layer cgc.mdx.widgets.cascade-remote, cgc.mdx.widgets.cascade;",
    `@import ${REMOTE}/remote.css layer(cgc.mdx.widgets)`,
    `@import ${REMOTE}/layered.css layer(cgc.mdx.widgets.cascade-remote)`,
    expect.stringMatching(new RegExp(`^@import ${escape(REMOTE)}/anonymous\\.css layer\\(cgc\\.mdx\\.widgets\\.anonymous-[\\w-]+\\)$`)),
  ])
  // The imported rule applies, and the site's rule still beats it.
  await addSiteCss(page, ".cascade__remote { border-radius: 2px }")
  await expect(page.locator(".cascade__remote")).toHaveCSS("outline-offset", "3px")
  await expect(page.locator(".cascade__remote")).toHaveCSS("border-radius", "2px")
})

// An anonymous layer can't be named under another, so the import gets a sublayer of its own, and the
// widget's own rules outrank it as they did before the wrapper, rather than tying with it on
// specificity inside the widget layer.
test("a remote @import into an anonymous layer stays below the widget's own rules", async ({ page }) => {
  await gotoCascade(page)
  const anonymous = page.locator(".cascade__anonymous")
  await expect(anonymous).toHaveCSS("outline-offset", "3px")
  await expect(anonymous).toHaveCSS("border-radius", "8px")
})

test("a widget rule beats a core rule of higher specificity", async ({ page }) => {
  await gotoCascade(page)
  // Core's `.page article p > strong { color: var(--dark) }` outranks `.cascade__strong` on
  // specificity, so only the layer order can let the widget's `var(--secondary)` win.
  const [secondary, dark] = [await resolvedColour(page, "var(--secondary)"), await resolvedColour(page, "var(--dark)")]
  expect(secondary).not.toBe(dark)
  await expect(page.locator(".cascade__strong")).toHaveCSS("color", secondary)
  // Without the widget's class, core's rule is what colours the same element.
  await page.locator(".cascade__strong").evaluate((el) => el.classList.remove("cascade__strong"))
  await expect(page.locator(".cascade strong")).toHaveCSS("color", dark)
})

// cgc-mdx takes no cgc-styles dependency (its ADR-0003), so on a site without that engine nothing
// positions `cgc` but the widget link itself. The link arrives through `additionalHead`, after every
// plugin's stylesheet, a theme's included, so the widget layer still ranks above the theme's layers.
// The theme is stood in for as cgc-styles' layer spec does: its layer statement, at its own order.
const THEME = "../fixture-plugins/fixture-theme"
const THEME_LAYERS = ["obsidian-theme", "quartz-themes-base", "obsidian-theme-overrides"]

test("a widget rule beats a theme's, on a site without cgc-styles", async ({ page, scratch }) => {
  const config = fixtureConfig()
  const site = await scratch.site(
    "mdx-over-theme",
    {
      "index.md": "# Home\n",
      "boxed.mdx": "---\ntitle: Boxed\n---\n\nimport { Boxed } from './Boxed'\n\n<Boxed />\n",
      "Boxed.tsx": 'import "./boxed.css"\n\nexport function Boxed() {\n  return <p class="boxed">A boxed widget.</p>\n}\n',
      "boxed.css": ".boxed { border-radius: 8px }\n",
    },
    {
      // Every other plugin of ours off, and the fixture plugins that need one of them.
      config: withPlugins(config, [
        ...othersOff(config, ["cgc-mdx"]),
        { source: "../fixture-plugins/fixture-consumer", enabled: false },
        { source: "../fixture-plugins/fixture-tag-reader", enabled: false },
        { source: THEME, enabled: true },
      ]),
    },
  )
  expect(site.code, site.output).toBe(0)
  await routeSite(page, site.public, "https://fixture.invalid")
  await page.goto("https://fixture.invalid/boxed.mdx")
  const top = (await layerOrder(page))[""]
  for (const layer of THEME_LAYERS) {
    expect(top, layer).toContain(layer)
    expect(top.indexOf("cgc"), `cgc above ${layer}`).toBeGreaterThan(top.indexOf(layer))
  }
  // A rule in the theme's highest layer still loses to the widget's.
  await page.evaluate(() => {
    const style = document.createElement("style")
    style.textContent = "@layer obsidian-theme-overrides { .boxed { border-radius: 3px } }"
    document.head.append(style)
  })
  await expect(page.locator(".boxed")).toHaveCSS("border-radius", "8px")
})
