// cgc-graph on the real site (#74), proven on a scratch site built from the site config, with pages in
// the vault's shapes: v4's settings, tag pages with the graph (the fixture's layout clears their right
// sidebar), a tag's description file in the vault's pre-cutover shape, and the plugin note.
import fs from "node:fs"
import path from "node:path"
import { test, expect, routeSite } from "../../../tests/harness/test.mjs"
import { buildScratchSite, siteConfig, testsRoot } from "../../../tests/harness/site.mjs"
import { drawnGraph, globalGraph, localGraph, marksNear, nodeFill } from "./graph.mjs"

// The site is served at its own `baseUrl`, where Quartz points its absolute URLs.
const ORIGIN = "https://blog.chaoticgood.computer"
const VAULT = path.resolve(testsRoot, "../../content/public")

const note = (title, tags, body = "") =>
  `---\ntitle: ${title}\ntags: [${tags.join(", ")}]\n---\n${body}\n`
const CONTENT = {
  "index.md": "---\ntitle: Home\n---\nWelcome. Read [[/content/notes/a-note|a note]].\n",
  "content/notes/a-note.md": note(
    "A note",
    ["engineering/ai"],
    "It leads to [[/content/notes/b-note|another]].",
  ),
  "content/notes/b-note.md": note("B note", ["engineering"]),
  "content/notes/c-note.md": note("C note", ["writing"]),
  "content/notes/secret.md": note(
    "Secret",
    ["private"],
    "A private stub, about [[/content/notes/a-note|a note]].",
  ),
  // A tag's description file, as the vault has them until cutover renames them (#43).
  "tags/engineering/index.md": "---\ntitle: Engineering\n---\nWhat the engineering tag is about.\n",
  // The plugin note, as the vault has it (#48).
  "plugins/cgc-graph.md": fs.readFileSync(path.join(VAULT, "plugins/cgc-graph.md"), "utf8"),
}

// One build per colour-scheme project, shared by that project's tests.
test.describe.configure({ mode: "serial" })

let site
test.beforeAll(async () => {
  test.setTimeout(180_000)
  site = await buildScratchSite("graph-site", CONTENT, {
    config: siteConfig({ offline: true }),
    keep: true,
  })
  expect(site.code, site.output).toBe(0)
})
test.afterAll(() => site?.remove())

test("draws the graph in the right sidebar, in stock graph's place", async ({ page }) => {
  await routeSite(page, site.public, ORIGIN)
  await page.goto(`${ORIGIN}/content/notes/a-note`)
  await expect(page.locator(".right .cgc-graph")).toHaveCount(1)
  await expect(page.locator(".graph")).toHaveCount(0)
  const graph = await drawnGraph(localGraph(page))
  expect(graph["content/notes/a-note"].current).toBe(true)
  expect(graph["content/notes/a-note"].edges).toEqual(
    expect.arrayContaining(["content/notes/b-note", "tags/engineering/ai"]),
  )
  // v4's private pages: drawn, and marked; the `private` tag itself is left out.
  expect(graph["content/notes/secret"]).toMatchObject({ private: true })
  expect(Object.keys(graph)).not.toContain("tags/private")
})

// Below the desktop breakpoint the site stacks the right sidebar under the article and caps each of
// its components at 24rem. The graph's square box must shrink to fit its block there, not spill over
// the backlinks under it, as a box as tall as the sidebar is wide would.
for (const width of [600, 800, 1100, 1299]) {
  test(`keeps the graph above the backlinks at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await routeSite(page, site.public, ORIGIN)
    await page.goto(`${ORIGIN}/content/notes/a-note`)
    await drawnGraph(localGraph(page))
    const { box, block, next } = await page.locator(".right .cgc-graph").evaluate((graph) => {
      const bottom = (el) => el.getBoundingClientRect().bottom
      let next = graph.nextElementSibling
      while (next && next.getBoundingClientRect().height === 0) next = next.nextElementSibling
      return {
        box: bottom(graph.querySelector(".cgc-graph__outer")),
        block: bottom(graph),
        next: next?.getBoundingClientRect().top ?? null,
      }
    })
    expect(next, "a component under the graph").not.toBeNull()
    expect(box).toBeLessThanOrEqual(block + 0.5)
    expect(box).toBeLessThanOrEqual(next + 0.5)
    // The graph is drawn into the box it has, not the square it would have had.
    const outer = await page.locator(".right .cgc-graph__outer").boundingBox()
    const canvas = await localGraph(page).locator(".cgc-graph__canvas").boundingBox()
    expect(Math.abs(canvas.height - (outer.height - 2))).toBeLessThan(1)
  })
}

test("keeps the graph's box square on a desktop, and draws into all of it", async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 })
  await routeSite(page, site.public, ORIGIN)
  await page.goto(`${ORIGIN}/content/notes/a-note`)
  await drawnGraph(localGraph(page))
  const box = await page.locator(".right .cgc-graph__outer").boundingBox()
  expect(Math.abs(box.width - box.height)).toBeLessThan(1)
  const canvas = await localGraph(page).locator(".cgc-graph__canvas").boundingBox()
  expect(Math.abs(canvas.height - (box.height - 2))).toBeLessThan(1)
})

test("draws private pages in v4's red", async ({ page }) => {
  await routeSite(page, site.public, ORIGIN)
  await page.goto(`${ORIGIN}/content/notes/a-note`)
  await drawnGraph(localGraph(page))
  // `nodeColors: { private: "#c54040" }`
  const red = () =>
    localGraph(page)
      .locator(".cgc-graph__canvas")
      .evaluate((canvas) => {
        const data = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data
        let count = 0
        for (let i = 0; i < data.length; i += 4)
          if (data[i] === 197 && data[i + 1] === 64 && data[i + 2] === 64 && data[i + 3] === 255)
            count++
        return count
      })
  await expect.poll(red).toBeGreaterThan(10)
})

// The site's tag table (#77): `engineering: { color: "light-dark(#0070cc, #008CFF)", icon: mdi:wrench }`,
// with v4's blue as the dark half, and `engineering/ai: { icon: mdi:robot }`, which takes the colour.
const ENGINEERING = { light: [0, 112, 204], dark: [0, 140, 255] }
// The site palette's `light`, the page's background, which icons are cut out in.
const LIGHT = { light: [250, 248, 248], dark: [22, 22, 24] }

test("paints each node in its tag's colour, with its tag's icon", async ({ page, colorScheme }) => {
  await page.setViewportSize({ width: 1400, height: 900 })
  await routeSite(page, site.public, ORIGIN)
  await page.goto(`${ORIGIN}/content/notes/a-note`)
  const graph = localGraph(page)
  for (const label of ["A note", "B note", "#ai"]) {
    await expect.poll(() => nodeFill(graph, label), label).toEqual(ENGINEERING[colorScheme])
    await expect.poll(() => marksNear(graph, label, LIGHT[colorScheme]), label).toBeGreaterThan(3)
  }
})

test("draws the site's own icons, from its icon collection", () => {
  const { icons } = JSON.parse(
    fs.readFileSync(path.join(site.public, "static/cgcGraph.json"), "utf8"),
  )
  // The plugin note is tagged `projects/site/plugins`, which takes its parent's icon,
  // `projects/site: { icon: custom:quartz-filled }`, from quartz-v5/icons/.
  expect(Object.keys(icons)).toEqual(
    expect.arrayContaining(["custom:quartz-filled", "mdi:robot", "mdi:wrench", "mdi:pencil"]),
  )
  expect(icons["custom:quartz-filled"]).toContain("currentColor")
})

test("draws a tag page's graph around the tag: its parent and its pages", async ({ page }) => {
  await routeSite(page, site.public, ORIGIN)
  await page.goto(`${ORIGIN}/tags/engineering/ai`)
  const graph = await drawnGraph(localGraph(page))
  expect(graph["tags/engineering/ai"]).toMatchObject({ label: "#ai", current: true })
  expect(graph["tags/engineering"].edges).toContain("tags/engineering/ai")
  expect(graph["content/notes/a-note"].edges).toContain("tags/engineering/ai")
})

test("draws a tag's description file as the tag's own node", async ({ page }) => {
  await routeSite(page, site.public, ORIGIN)
  await page.goto(`${ORIGIN}/tags/engineering/`)
  const graph = await drawnGraph(localGraph(page))
  expect(graph["tags/engineering"]).toMatchObject({ label: "#engineering", current: true })
  expect(graph["content/notes/b-note"].edges).toContain("tags/engineering")
  expect(Object.keys(graph)).not.toContain("tags/engineering/")
})

test("opens the global graph with v4's filters: the last month, and no private pages", async ({
  page,
}) => {
  await routeSite(page, site.public, ORIGIN)
  await page.goto(`${ORIGIN}/content/notes/a-note`)
  await drawnGraph(localGraph(page))
  await page.getByRole("button", { name: "View Global Graph" }).click()
  // Every page here is new, so the adaptive period settles on the narrowest, a month.
  await expect(page.getByRole("slider", { name: "Time period" })).toHaveAttribute(
    "aria-valuetext",
    "Month",
  )
  await expect(page.getByRole("checkbox", { name: "Include private notes" })).not.toBeChecked()
  const graph = await drawnGraph(globalGraph(page))
  expect(Object.keys(graph)).toEqual(
    expect.arrayContaining(["/", "content/notes/a-note", "content/notes/c-note", "tags/writing"]),
  )
  expect(Object.keys(graph)).not.toContain("content/notes/secret")
})

test("publishes the index, with each page's date", () => {
  const { pages } = JSON.parse(
    fs.readFileSync(path.join(site.public, "static/cgcGraph.json"), "utf8"),
  )
  expect(pages["content/notes/a-note"]).toMatchObject({
    title: "A note",
    links: ["content/notes/b-note"],
    tags: ["engineering/ai"],
  })
  for (const [slug, entry] of Object.entries(pages))
    expect(Date.parse(entry.date), slug).not.toBeNaN()
})

test("publishes the plugin note at /plugins/cgc-graph, with absolute links only", async ({
  page,
}) => {
  await routeSite(page, site.public, ORIGIN)
  await page.goto(`${ORIGIN}/plugins/cgc-graph`)
  await expect(page).toHaveTitle("cgc-graph | Spencer Elkington")
  const hrefs = await page
    .locator("article a:not([role=anchor])")
    .evaluateAll((links) => links.map((a) => a.getAttribute("href")))
  expect(hrefs.length).toBeGreaterThan(0)
  expect(hrefs.filter((href) => !/^https:\/\//.test(href))).toEqual([])
})
