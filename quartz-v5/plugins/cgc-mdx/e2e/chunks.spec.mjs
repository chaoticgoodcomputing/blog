// ADR-0001: one esbuild build with shared chunks, and each page loads only what its imports reach.
// ADR-0002's widget-layer amendment: that CSS lands in `cgc.mdx.widgets`, above core, below the site.
import { test, expect, resolvedColour } from "../../../tests/harness/test.mjs"

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
  expect(await widgetRequests(page, "/mdx-article")).toEqual([])
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
  const life = await load("/lab/life")
  const again = await load("/lab/life-again")
  expect(entry(life)).toHaveLength(1)
  expect(entry(again)).toEqual(entry(life))
})

// The #51 flake made deterministic: a loaded machine idles the page before the scroll.
test("a visible island's entry is counted even when the page idles before it scrolls into view", async ({ page }) => {
  const seen = recordWidgetRequests(page)
  await page.goto("/lab/life-again")
  await page.waitForLoadState("networkidle")
  expect(entry(seen)).toEqual([])
  await hydrateIslands(page)
  expect(entry(seen)).toHaveLength(1)
})

test("a page loads only the widgets it imports", async ({ page }) => {
  const seen = await widgetRequests(page, "/lab/echo")
  expect(seen.some((p) => p.includes("Echo-"))).toBe(true)
  expect(seen.some((p) => p.includes("GameOfLife-"))).toBe(false)
})

test("the widget's imported CSS reaches the page", async ({ page }) => {
  await page.goto("/lab/life")
  await expect(page.locator(".cgc-mdx-island")).toHaveAttribute("data-cgc-hydrated", "")
  await expect(page.locator(".life")).toHaveCSS("border-radius", "8px")
})

test("the widget's CSS is in the served head, so build-time markup is styled on first paint", async ({ emitted }) => {
  const head = emitted.read("lab/life.html").split("</head>")[0]
  expect(head).toMatch(/<link rel="stylesheet" href="\.\.\/static\/cgc-mdx\/GameOfLife-[^"]+\.css" data-persist/)
  expect(emitted.read("lab/echo.html")).not.toContain("GameOfLife-")
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
  await page.goto("/lab/life")
  expect(await widgetSheet(page, "GameOfLife")).toEqual([
    { "@layer cgc.mdx.widgets": [".life", ".life__reset", ".life__reset:hover", ".life__canvas"] },
  ])
})

test("a site-layer rule beats a widget rule on the same element", async ({ page }) => {
  await page.goto("/lab/life")
  await addSiteCss(page, ".life { border-radius: 2px }")
  await expect(page.locator(".life")).toHaveCSS("border-radius", "2px")
})

test("a site-layer rule beats a widget whose CSS arrived by SPA navigation", async ({ page }) => {
  await page.goto("/lab/echo")
  await addSiteCss(page, ".life { border-radius: 2px }")
  await page.locator("article a.internal", { hasText: "Life" }).click()
  await expect(page).toHaveURL(/\/lab\/life$/)
  await expect(page.locator(".cgc-mdx-island")).toHaveAttribute("data-cgc-hydrated", "")
  await expect(page.locator(".life")).toHaveCSS("border-radius", "2px")
})

// /lab/cascade's widget carries its own layer and two remote imports. Their host never resolves
// (`.invalid`, RFC 2606), so these specs serve the imported sheets themselves.
const REMOTE = "https://widgets.cgc-fixture.invalid"
const REMOTE_CSS = {
  "/remote.css": ".cascade__remote { border-radius: 8px; outline-offset: 3px }",
  "/layered.css": "",
}
async function gotoCascade(page) {
  await page.route(`${REMOTE}/**`, (route) =>
    route.fulfill({ contentType: "text/css", body: REMOTE_CSS[new URL(route.request().url()).pathname] ?? "" }),
  )
  await page.goto("/lab/cascade")
}

test("a widget's own layer nests inside the widget layer", async ({ page }) => {
  await gotoCascade(page)
  expect((await widgetSheet(page, "Cascade"))?.at(-1)).toEqual({
    "@layer cgc.mdx.widgets": [".cascade", ".cascade__strong", { "@layer cascade": [".cascade__nested"] }],
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
  ])
  // The imported rule applies, and the site's rule still beats it.
  await addSiteCss(page, ".cascade__remote { border-radius: 2px }")
  await expect(page.locator(".cascade__remote")).toHaveCSS("outline-offset", "3px")
  await expect(page.locator(".cascade__remote")).toHaveCSS("border-radius", "2px")
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
