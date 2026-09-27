// The vault's live .mdx articles and their widgets (#79), proven on a scratch site built from the
// site config. The articles are the vault's own files, unchanged. Beside them are the vault's
// widgets, and a `node_modules` link, so the articles' package imports resolve as the vault's do,
// from the repo root's. Building all of `content/public` is the `site:build` target's job.
import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"
import { test, expect, resolvedColour, routeSite, toggleScheme } from "../harness/test.mjs"
import { buildScratchSite, editConfig, siteConfig, testsRoot } from "../harness/site.mjs"
// The site is served at its own `baseUrl`, where Quartz points its absolute URLs.
const ORIGIN = "https://blog.chaoticgood.computer"
const REPO = path.resolve(testsRoot, "../..")
const VAULT = path.join(REPO, "content/public")

// Every .mdx article in the vault, by the URL it lives at, and the widgets its imports reach. The
// URL keeps the extension, as stock page types' do (the owner's 2026-09-26 decision, cgc-mdx
// ADR-0005), and the clean URL v4 served it at redirects there.
const ARTICLES = {
  "resume.mdx": ["PDFViewer"],
  "content/notes/ants-in-the-neighborhood.mdx": ["RandomWalk"],
  "content/notes/mdx-widgets-test.mdx": ["GameOfLife"],
  "content/notes/roll-advantage.mdx": ["ProbabilityConvolutions"],
  "content/notes/scratch/dice-widget.mdx": ["ProbabilityConvolutions"],
}


const vaultFiles = (dir, keep = () => true) =>
  fs
    .readdirSync(path.join(VAULT, dir), { recursive: true })
    .map((rel) => path.join(dir, rel))
    .filter((rel) => fs.statSync(path.join(VAULT, rel)).isFile() && keep(rel))

const RESUME_PDF = "assets/Elkington_Resume.pdf"

const mdxFiles = () => vaultFiles(".", (rel) => rel.endsWith(".mdx") && !rel.startsWith("private"))

function content() {
  const files = {
    "index.md": "---\ntitle: Home\n---\nWelcome.\n",
    // Where the vault's own imports of packages resolve from: the repo root's install.
    node_modules: { symlink: path.join(REPO, "node_modules") },
  }
  // The resume's PDF too, so the build emits it where v5 puts the vault's assets.
  for (const rel of [...mdxFiles(), ...vaultFiles("widgets"), RESUME_PDF]) {
    files[rel] = fs.readFileSync(path.join(VAULT, rel))
  }
  return files
}

// The site config as it is, plus the `node_modules` link kept out of the content.
const config = () => editConfig(siteConfig({ offline: true }), (doc) => doc.get("configuration").get("ignorePatterns").add("node_modules"))

// One build per colour-scheme project, shared by that project's tests.
test.describe.configure({ mode: "serial" })

let site
test.beforeAll(async () => {
  test.setTimeout(300_000)
  site = await buildScratchSite("site-widgets", content(), { config: config(), keep: true })
  expect(site.code, site.output).toBe(0)
})
test.afterAll(() => site?.remove())

// Every page browses the scratch site. A test's own routes, added later, take precedence.
test.beforeEach(({ page }) => routeSite(page, site.public, ORIGIN))

// A page of the scratch site, with every island on it hydrated.
async function open(page, slug) {
  await page.goto(`${ORIGIN}/${slug}`)
  const islands = page.locator(".cgc-mdx-island")
  await expect(islands.first()).toBeAttached()
  for (const island of await islands.all()) await expect(island).toHaveAttribute("data-cgc-hydrated", "")
  return islands
}

// One pixel of a canvas, as `rgb(…)`.
const pixel = (canvas, x, y) =>
  canvas.evaluate((c, [x, y]) => {
    const [r, g, b] = c.getContext("2d").getImageData(x, y, 1, 1).data
    return `rgb(${r}, ${g}, ${b})`
  }, [x, y])

test("every .mdx article in the vault builds, at its .mdx URL, and its clean URL redirects there", () => {
  expect(mdxFiles().sort()).toEqual(Object.keys(ARTICLES).sort())
  const read = (url) => fs.readFileSync(path.join(site.public, `${url}.html`), "utf8")
  for (const slug of Object.keys(ARTICLES)) {
    expect(read(slug), slug).not.toContain('http-equiv="refresh"')
    expect(read(slug.replace(/\.mdx$/, "")), `${slug}'s clean URL`).toContain('http-equiv="refresh"')
  }
})

test("no article imports through a registry, alias or configured directory", () => {
  // Each import resolves the way Node resolves it from the article's own folder: a relative path to
  // a file beside it, or a package from `node_modules`. Nothing configures either.
  const unresolved = []
  for (const rel of mdxFiles()) {
    const file = path.join(VAULT, rel)
    const source = fs.readFileSync(file, "utf8")
    for (const [, specifier] of source.matchAll(/^import\s[^\n]*?\sfrom\s+["']([^"']+)["']/gm)) {
      const found = specifier.startsWith(".")
        ? ["", ".tsx", ".ts", ".jsx", ".js"].some((ext) => fs.existsSync(path.resolve(path.dirname(file), specifier + ext)))
        : (() => {
            try {
              return Boolean(createRequire(file).resolve(specifier))
            } catch {
              return false
            }
          })()
      if (!found) unresolved.push(`${rel}: ${specifier}`)
    }
  }
  expect(unresolved).toEqual([])
})

test("each article loads only the widget chunks its imports reach", async ({ page }) => {
  // The heavy dependencies, by a name only their own code carries.
  const chunks = fs.readdirSync(path.join(site.public, "static/cgc-mdx")).filter((f) => f.endsWith(".js"))
  const holding = (marker) => chunks.filter((f) => fs.readFileSync(path.join(site.public, "static/cgc-mdx", f), "utf8").includes(marker))
  const plotly = holding("plotly_afterplot")
  const pdfjs = holding("GlobalWorkerOptions")
  expect(plotly).toHaveLength(1)
  expect(pdfjs).toHaveLength(1)

  for (const [slug, widgets] of Object.entries(ARTICLES)) {
    const loaded = new Set()
    const listener = (req) => {
      const { pathname } = new URL(req.url())
      if (pathname.startsWith("/static/cgc-mdx/")) loaded.add(path.basename(pathname))
    }
    page.on("request", listener)
    // A fresh document each time, so nothing a previous article loaded is cached in it.
    await open(page, slug)
    await page.waitForLoadState("networkidle")
    page.off("request", listener)

    const entries = [...loaded].filter((f) => f.endsWith(".js") && !f.startsWith("chunk-")).map((f) => f.replace(/-[A-Z0-9]+\.js$/, ""))
    expect(entries.sort(), slug).toEqual(widgets)
    expect([...loaded].some((f) => plotly.includes(f)), `${slug} loads plotly`).toBe(widgets.includes("ProbabilityConvolutions"))
    expect([...loaded].some((f) => pdfjs.includes(f)), `${slug} loads PDF.js`).toBe(widgets.includes("PDFViewer"))
  }
})

test("widgets unmount and come back across SPA navigation, with no errors", async ({ page }) => {
  const errors = []
  page.on("pageerror", (err) => errors.push(err.message))
  const spa = async (slug) => {
    await page.evaluate((url) => window.spaNavigate(new URL(url)), `${ORIGIN}/${slug}`)
    await expect(page).toHaveURL(`${ORIGIN}/${slug}`)
    for (const island of await page.locator(".cgc-mdx-island").all()) await expect(island).toHaveAttribute("data-cgc-hydrated", "")
  }
  await open(page, "content/notes/roll-advantage.mdx")
  await expect(page.locator(".probability-convolutions .main-svg").first()).toBeVisible()
  await spa("content/notes/ants-in-the-neighborhood.mdx")
  await page.locator(".random-walk").first().getByRole("button", { name: "Auto-play" }).click()
  await spa("content/notes/mdx-widgets-test.mdx")
  await spa("content/notes/roll-advantage.mdx")
  await expect(page.locator(".probability-convolutions .main-svg").first()).toBeVisible()
  expect(errors).toEqual([])
})

test.describe("resume", () => {
  test("the PDF viewer renders at build time and draws the resume", async ({ page }) => {
    const html = fs.readFileSync(path.join(site.public, "resume.mdx.html"), "utf8")
    expect(html).toMatch(/class="cgc-mdx-island"[^>]*>\s*<div class="cgc-pdf-viewer"/)
    // The widget fetches the URL the article gives it, the PDF's lowercase URL (#26).
    await page.route(`${ORIGIN}/${RESUME_PDF.toLowerCase()}`, (route) =>
      route.fulfill({ contentType: "application/pdf", path: path.join(VAULT, RESUME_PDF) }),
    )
    await open(page, "resume.mdx")
    await expect(page.locator(".cgc-pdf-viewer__title")).toHaveText("Spencer Elkington - Resume")
    await expect(page.locator(".cgc-pdf-viewer__page").first()).toBeVisible()
  })

  // v5 lowercases an asset's URL, and the article's `src` is a widget prop, which no build
  // re-resolves, so the article names the lowercase URL itself (#26: the owner's decision, no
  // redirect, which the viewer's fetch couldn't follow anyway). Checked on a listing, not a lookup,
  // which a case-insensitive filesystem would answer either way.
  test("the build serves the resume at the URL the article gives the viewer (#26)", () => {
    const src = fs.readFileSync(path.join(VAULT, "resume.mdx"), "utf8").match(/<PDFViewer\b[^>]*\ssrc="([^"]+)"/)[1]
    expect(fs.readdirSync(path.join(site.public, path.posix.dirname(src)))).toContain(path.posix.basename(src))
  })
})

test.describe("mdx-widgets-test", () => {
  test("documents the current contract, with no retired widget left in it", async ({ page }) => {
    const html = fs.readFileSync(path.join(site.public, "content/notes/mdx-widgets-test.mdx.html"), "utf8")
    // v4's status demos and its page-assets meter.
    for (const retired of ["widget-global-initialization", "widget-content-initialization", "widget-page-assets", "Initializing"]) {
      expect(html, retired).not.toContain(retired)
    }
    const islands = await open(page, "content/notes/mdx-widgets-test.mdx")
    await expect(islands).toHaveCount(1)
    // It says what replaced v4's widget system, and links the widget guide, which on v5 is the
    // plugin note's alias.
    await expect(page.locator("article")).toContainText("cgc-mdx")
    const hrefs = await page.locator("article a.internal").evaluateAll((links) => links.map((a) => new URL(a.href).pathname))
    expect(hrefs).toContain("/widgets/readme")
  })

  test("the game of life renders at build time, runs, and repaints on a scheme switch", async ({ page }) => {
    const html = fs.readFileSync(path.join(site.public, "content/notes/mdx-widgets-test.mdx.html"), "utf8")
    expect(html).toMatch(/<canvas class="game-of-life__canvas"/)
    await open(page, "content/notes/mdx-widgets-test.mdx")
    const canvas = page.locator(".game-of-life__canvas")
    const before = await canvas.evaluate((c) => c.toDataURL())
    await expect.poll(() => canvas.evaluate((c) => c.toDataURL())).not.toBe(before)

    // The top-left cell is in the blank rows above the pattern, so it shows the paper.
    expect(await pixel(canvas, 5, 5)).toBe(await resolvedColour(page, "var(--light)"))
    await toggleScheme(page)
    await expect.poll(async () => pixel(canvas, 5, 5)).toBe(await resolvedColour(page, "var(--light)"))
  })
})

test.describe("roll-advantage and dice-widget", () => {
  test("each chart's statistics render at build time", async () => {
    const html = fs.readFileSync(path.join(site.public, "content/notes/roll-advantage.mdx.html"), "utf8")
    // The first chart is one d6 with its threshold at the median, 3: two faces of six below it.
    expect(html).toMatch(/probability-convolutions__mean">3\.50</)
    expect(html).toMatch(/Less than[^]*?3[^]*?33\.3%[^]*?3[^]*?or more[^]*?66\.7%/)
    // The d20 chart set at 6 (the article: "75% vs 16%").
    expect(html).toContain("75.0%")
  })

  test("the charts draw, follow their expression, and repaint on a scheme switch", async ({ page }) => {
    const islands = await open(page, "content/notes/roll-advantage.mdx")
    await expect(islands).toHaveCount(9)
    const first = page.locator(".probability-convolutions").first()
    await expect(first.locator(".main-svg").first()).toBeVisible()

    await first.locator("input").fill("2d6")
    await expect(first.locator(".probability-convolutions__mean")).toHaveText("7.00")
    await first.locator("input").fill("2d")
    await expect(first.locator(".probability-convolutions__error")).toBeVisible()

    const paper = () => first.locator(".main-svg").first().evaluate((svg) => getComputedStyle(svg).backgroundColor)
    await expect.poll(paper).toBe(await resolvedColour(page, "var(--light)"))
    await toggleScheme(page)
    await expect.poll(paper).toBe(await resolvedColour(page, "var(--light)"))
  })

  test("dragging the threshold reads off the odds either side of it, snapped between bars", async ({ page }) => {
    await open(page, "content/notes/roll-advantage.mdx")
    // One d6, with its threshold between 2 and 3.
    const first = page.locator(".probability-convolutions").first()
    // Plotly lays a wider, invisible path over the line to drag it by.
    const line = first.locator(".shapelayer [drag-helper] path")
    await line.scrollIntoViewIfNeeded()
    const value = first.locator(".probability-convolutions__threshold--below .probability-convolutions__threshold-value")
    await expect(value).toHaveText("3")

    // Two bars' width to the right, dropped off-centre.
    const [bar1, bar2] = await first.locator(".barlayer .point path").evaluateAll((bars) => bars.slice(0, 2).map((b) => b.getBoundingClientRect().x))
    const box = await line.boundingBox()
    const x = box.x + box.width / 2
    const y = box.y + box.height / 2
    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x + 2.3 * (bar2 - bar1), y, { steps: 10 })
    await page.mouse.up()

    await expect(value).toHaveText("5")
    // The line sits between the fourth and fifth bars, upright, wherever it was let go.
    const shape = () => first.locator(".js-plotly-plot").evaluate((plot) => (({ x0, x1, y0, y1 }) => ({ x0, x1, y0, y1 }))(plot.layout.shapes[0]))
    await expect.poll(shape).toEqual({ x0: 4.5, x1: 4.5, y0: 0, y1: 1 })
    await expect(first.locator(".probability-convolutions__threshold--below .probability-convolutions__threshold-odds")).toHaveText("66.7%")
    await expect(first.locator(".probability-convolutions__threshold--above .probability-convolutions__threshold-odds")).toHaveText("33.3%")
  })

  test("the scratch note's chart draws too", async ({ page }) => {
    await open(page, "content/notes/scratch/dice-widget.mdx")
    await expect(page.locator(".probability-convolutions .main-svg").first()).toBeVisible()
  })
})

test.describe("ants-in-the-neighborhood", () => {
  test("the random walks render at build time, step, and repaint on a scheme switch", async ({ page }) => {
    const html = fs.readFileSync(path.join(site.public, "content/notes/ants-in-the-neighborhood.mdx.html"), "utf8")
    expect(html).toContain("Steps: 0")
    expect(html).toContain("Current: A")

    const islands = await open(page, "content/notes/ants-in-the-neighborhood.mdx")
    await expect(islands).toHaveCount(3)
    const walk = page.locator(".random-walk").first()
    await walk.getByRole("button", { name: "Take one step" }).click()
    await expect(walk.locator(".random-walk__steps")).toHaveText("Steps: 1")
    await expect(walk.locator(".random-walk__current")).toHaveText(/Current: [BC]/)

    const canvas = walk.locator("canvas")
    expect(await pixel(canvas, 2, 2)).toBe(await resolvedColour(page, "var(--light)"))
    await toggleScheme(page)
    await expect.poll(async () => pixel(canvas, 2, 2)).toBe(await resolvedColour(page, "var(--light)"))
  })

  test("the random walks label their canvases in the theme's body font", async ({ page }) => {
    // Every font a random walk's canvas is set to, as the widget sets it.
    await page.addInitScript(() => {
      const fonts = (window.__canvasFonts = [])
      const font = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, "font")
      Object.defineProperty(CanvasRenderingContext2D.prototype, "font", {
        ...font,
        set(value) {
          if (this.canvas?.closest?.(".random-walk")) fonts.push(value)
          font.set.call(this, value)
        },
      })
    })
    await open(page, "content/notes/ants-in-the-neighborhood.mdx")
    const body = await page.locator("article").evaluate((article) => {
      const probe = article.appendChild(document.createElement("i"))
      probe.style.fontFamily = "var(--bodyFont)"
      const family = getComputedStyle(probe).fontFamily
      probe.remove()
      return family
    })
    await expect.poll(() => page.evaluate(() => window.__canvasFonts.length)).toBeGreaterThan(0)
    const families = await page.evaluate(() => [...new Set(window.__canvasFonts.map((font) => font.replace(/^(bold )?[\d.]+px /, "")))])
    expect(families).toEqual([body])
  })
})
