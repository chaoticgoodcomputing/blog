// The debug panel (the `debugPanel` option): every graph setting as a control beside the global graph,
// a switch between the global and local graphs' settings, each change drawn at once, and the result
// as YAML for the site config. Off unless the site asks for it.
import { test, expect, routeSite } from "../../../tests/harness/test.mjs"
import { buildScratchSite, editConfig, fixtureConfig } from "../../../tests/harness/site.mjs"
import { drawnGraph, globalGraph, localGraph, nodePosition } from "./graph.mjs"

// Home links to Near, which links to Far; Lonely links nowhere. The local graph around Home, at its
// default depth of 1, holds Home, Near and Home's tag; the global graph holds every page.
const CONTENT = {
  "index.md": "---\ntitle: Home\ntags: [alpha]\n---\nSee [[near]].\n",
  "near.md": "---\ntitle: Near\n---\nSee [[far]].\n",
  "far.md": "---\ntitle: Far\n---\nThe end.\n",
  "lonely.md": "---\ntitle: Lonely\n---\nNo links.\n",
}

// The fixture's config, with quartz-graph's options replaced, so every graph setting is the default.
const withOptions = (options) =>
  editConfig(fixtureConfig(), (doc, entry) =>
    entry("@chaoticgoodcomputing/quartz-graph").set("options", doc.createNode(options)),
  )

const panel = (page) => page.getByRole("complementary", { name: "Graph settings" })
const yaml = (page) => page.getByRole("textbox", { name: "Settings as YAML" })
// A group of the panel's controls, opened: all but the first start closed.
const openGroup = async (page, name) => {
  const group = page.locator(".cgc-graph__debug-group", { has: page.getByText(name, { exact: true }) })
  if (!(await group.evaluate((el) => el.open))) await group.getByText(name, { exact: true }).click()
}
// Where each node labelled in `labels` is drawn, in viewport pixels, at once: one coarse sweep of the
// pointer over the canvas, marking where the text alternative says each is under it. Unlike
// `nodePosition`, it doesn't wait for the layout to settle, to read a graph just drawn.
const positionsNow = (container, labels) =>
  container.locator(".cgc-graph__canvas").evaluate((canvas, labels) => {
    const rect = canvas.getBoundingClientRect()
    const sums = Object.fromEntries(labels.map((label) => [label, { x: 0, y: 0, hits: 0 }]))
    for (let py = rect.top + 1; py < rect.bottom; py += 2) {
      for (let px = rect.left + 1; px < rect.right; px += 2) {
        canvas.dispatchEvent(new MouseEvent("mousemove", { clientX: px, clientY: py, bubbles: true }))
        const label = canvas.querySelector(".cgc-graph__node[data-hovered] > .cgc-graph__node-link")
          ?.textContent
        if (label in sums) Object.assign(sums[label], { x: sums[label].x + px, y: sums[label].y + py, hits: sums[label].hits + 1 })
      }
    }
    canvas.dispatchEvent(new MouseEvent("mouseleave"))
    return Object.fromEntries(
      Object.entries(sums).map(([label, { x, y, hits }]) => [label, hits ? { x: x / hits, y: y / hits } : null]),
    )
  }, labels)
const drawnIds = async (page) => Object.keys(await drawnGraph(globalGraph(page))).sort()

async function openGlobalGraph(page, origin = "") {
  await page.goto(`${origin}/`)
  await expect(localGraph(page).locator(".cgc-graph__node").first()).toBeAttached()
  await page.getByRole("button", { name: "View Global Graph" }).click()
  await expect(page.locator(".cgc-graph__dialog")).toBeVisible()
}

test("shows no debug panel unless the site asks for one", async ({ page }) => {
  await page.goto("/plain-note")
  await expect(localGraph(page).locator(".cgc-graph__node").first()).toBeAttached()
  await page.getByRole("button", { name: "View Global Graph" }).click()
  await drawnGraph(globalGraph(page))
  await expect(page.locator(".cgc-graph__debug")).toHaveCount(0)
})

test("fails the build on a debugPanel that isn't true or false", async () => {
  const { code, output } = await buildScratchSite("graph-bad-debug", CONTENT, {
    config: withOptions({ debugPanel: "yes" }),
  })
  expect(code).not.toBe(0)
  expect(output).toContain("cgc-graph: debugPanel must be true or false")
})

test.describe("with debugPanel", () => {
  const ORIGIN = "https://localhost"
  let site

  test.beforeAll(async () => {
    site = await buildScratchSite("graph-debug", CONTENT, {
      config: withOptions({ debugPanel: true }),
      keep: true,
    })
    expect(site.code, site.output).toBe(0)
  })
  test.afterAll(() => site?.remove())
  test.beforeEach(({ page }) => routeSite(page, site.public, ORIGIN))

  test("opens beside the global graph, editing its settings, with nothing changed yet", async ({
    page,
  }) => {
    await openGlobalGraph(page, ORIGIN)
    await expect(panel(page)).toBeVisible()
    await expect(page.getByRole("radio", { name: "Global" })).toBeChecked()
    expect(await drawnIds(page)).toEqual(["/", "far", "lonely", "near", "tags/alpha"])
    await expect(page.getByRole("spinbutton", { name: "depth", exact: true })).toHaveValue("-1")
    await expect(yaml(page)).toHaveValue("# Every setting is the plugin's default.")
  })

  test("switches the dialog to the local graph, with its settings and no filters", async ({ page }) => {
    await openGlobalGraph(page, ORIGIN)
    await page.getByRole("radio", { name: "Local" }).check()
    await expect.poll(() => drawnIds(page)).toEqual(["/", "near", "tags/alpha"])
    await expect(page.getByRole("spinbutton", { name: "depth", exact: true })).toHaveValue("1")
    await expect(page.getByRole("slider", { name: "Time period" })).toHaveCount(0)
    await page.getByRole("radio", { name: "Global" }).check()
    await expect.poll(() => drawnIds(page)).toContain("lonely")
    await expect(page.getByRole("slider", { name: "Time period" })).toBeVisible()
  })

  test("draws each change, and writes it as YAML for the site config", async ({ page }) => {
    await openGlobalGraph(page, ORIGIN)
    await openGroup(page, "Behaviour")
    await page.getByRole("checkbox", { name: "showTags" }).uncheck()
    await expect.poll(() => drawnIds(page)).toEqual(["/", "far", "lonely", "near"])
    await page.getByRole("spinbutton", { name: "repelForce", exact: true }).fill("2")
    await expect(yaml(page)).toHaveValue("globalGraph:\n  repelForce: 2\n  showTags: false")
    await page.getByRole("radio", { name: "Local" }).check()
    // Behaviour stays open across the switch; Edges is opened now.
    await expect(page.getByRole("checkbox", { name: "showTags" })).toBeChecked()
    await openGroup(page, "Edges")
    await page.getByRole("spinbutton", { name: "linkDistance.tagPost" }).fill("45")
    await expect(yaml(page)).toHaveValue(
      "localGraph:\n  linkDistance:\n    tagPost: 45\nglobalGraph:\n  repelForce: 2\n  showTags: false",
    )
  })

  test("keeps the filters the reader set through each redraw", async ({ page }) => {
    await openGlobalGraph(page, ORIGIN)
    const slider = page.getByRole("slider", { name: "Time period" })
    await slider.focus()
    await page.keyboard.press("ArrowRight")
    await expect(slider).toHaveAttribute("aria-valuetext", "Year")
    await page.getByRole("checkbox", { name: "Include private notes" }).uncheck()
    await page.getByRole("spinbutton", { name: "repelForce", exact: true }).fill("2")
    await expect(yaml(page)).toHaveValue(/repelForce: 2/)
    await expect(slider).toHaveAttribute("aria-valuetext", "Year")
    await expect(page.getByRole("checkbox", { name: "Include private notes" })).not.toBeChecked()
    // And through a trip to the local graph, which has none, and back.
    await page.getByRole("radio", { name: "Local" }).check()
    await page.getByRole("radio", { name: "Global" }).check()
    await expect(slider).toHaveAttribute("aria-valuetext", "Year")
  })

  test("keeps its edits when the dialog closes and opens again", async ({ page }) => {
    await openGlobalGraph(page, ORIGIN)
    await openGroup(page, "Behaviour")
    await page.getByRole("checkbox", { name: "showTags" }).uncheck()
    await expect.poll(() => drawnIds(page)).not.toContain("tags/alpha")
    await page.keyboard.press("Escape")
    await expect(panel(page)).toHaveCount(0)
    await page.getByRole("button", { name: "View Global Graph" }).click()
    await expect(page.getByRole("checkbox", { name: "showTags" })).not.toBeChecked()
    await expect.poll(() => drawnIds(page)).not.toContain("tags/alpha")
  })
})

// A change of settings resettles the graph from where its nodes are: just after the change, each node
// is about where it was, where a fresh layout would start them scattered at random. (Where they end
// up is no test: the layout, reheated, carries on towards a balance it had stopped short of, and a
// fresh layout, pulled to the centre, can settle near the same place.) Its own site, with nodes big
// enough for one quick sweep of the pointer to find.
test.describe("with debugPanel and big nodes", () => {
  const ORIGIN = "https://localhost"
  let site

  test.beforeAll(async () => {
    site = await buildScratchSite("graph-debug-big", CONTENT, {
      config: withOptions({ debugPanel: true, globalGraph: { baseSize: { tags: 10, posts: 10 } } }),
      keep: true,
    })
    expect(site.code, site.output).toBe(0)
  })
  test.afterAll(() => site?.remove())
  test.beforeEach(({ page }) => routeSite(page, site.public, ORIGIN))

  test("resettles the graph from where it was, not from a fresh layout", async ({ page }) => {
    await openGlobalGraph(page, ORIGIN)
    // At rest: Home settled. The pages its edges hold, read; not Lonely, which nothing holds, and
    // which can drift for a while, as far as out of the view.
    await nodePosition(globalGraph(page), "Home")
    const labels = ["Home", "Near", "Far"]
    const before = await positionsNow(globalGraph(page), labels)
    await openGroup(page, "Labels")
    await page.getByRole("spinbutton", { name: "fontSize", exact: true }).fill("0.8")
    await expect(yaml(page)).toHaveValue(/fontSize: 0.8/)
    const after = await positionsNow(globalGraph(page), labels)
    for (const label of labels) {
      const [was, now] = [before[label], after[label]]
      expect(was && now, label).toBeTruthy()
      expect(Math.hypot(now.x - was.x, now.y - was.y), label).toBeLessThan(25)
    }
  })
})
