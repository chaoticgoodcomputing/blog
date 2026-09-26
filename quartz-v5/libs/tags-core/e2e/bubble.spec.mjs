// The tag bubble (#82): the circle that holds a tag's icon, drawn once, by tags-core's `./bubble`,
// for every badge in the family. As the owner's review notes of 2026-09-26 set it, and ADR-0003's
// bubble amendment records, the tag colour paints only its rim, the circle is the theme's
// `--lightgray` and the icon its `--dark`. In a badge, whose own background is `--lightgray`, the
// circle is `--light` instead, so it stands out from the badge (the owner's decision of the same
// day, recorded in the same amendment). A badge is the bubble and `#name`, with a count where the
// plugin shows one, all centred on one line. Proven through the two plugins that draw badges,
// cgc-tag-list and cgc-post-listing, on a tag page that shows both: `/tags/writing` lists the tag's
// subtags, `writing/articles` among them, and its posts, og/tag-nested among them, tagged
// `writing/articles`. The fixture gives `writing` the colour `var(--secondary)` and the icon
// `mdi:pencil`, which `writing/articles` inherits (tests/quartz.config.yaml).
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { spawnSync } from "node:child_process"
import {
  test,
  expect,
  layersOf,
  resolvedColour,
  toggleScheme,
} from "../../../tests/harness/test.mjs"
import { BADGES, BUBBLE, BUBBLE_ICON, bubbleOf, centresOf } from "./bubble.mjs"

const TAG = "writing/articles"
const PAGE = "/tags/writing"
const LIBRARY = path.resolve(import.meta.dirname, "..")

// The colours the bubble should show now, in the scheme the page is showing.
const expected = async (page) => ({
  rim: await resolvedColour(page, "var(--secondary)"),
  circle: await resolvedColour(page, "var(--light)"),
  icon: await resolvedColour(page, "var(--dark)"),
})

// What the bubble shows: its rim on all four sides, its circle, and the fill of every mark of its icon.
const paintOf = (bubble) =>
  bubble.evaluate((bubble, icon) => {
    const style = getComputedStyle(bubble)
    return {
      rim: [
        ...new Set(["top", "right", "bottom", "left"].map((side) => style[`border-${side}-color`])),
      ],
      circle: style.backgroundColor,
      icon: [
        ...new Set(
          [...bubble.querySelectorAll(`${icon} *`)].map((mark) => getComputedStyle(mark).fill),
        ),
      ],
    }
  }, BUBBLE_ICON)

for (const [plugin, { badge, name }] of Object.entries(BADGES)) {
  test.describe(plugin, () => {
    test("paints the bubble's rim in the tag colour, its circle the page's light and its icon dark, in either scheme", async ({
      page,
    }) => {
      await page.goto(PAGE)
      const bubble = bubbleOf(badge(page, TAG))
      await expect(bubble.locator(`svg${BUBBLE_ICON}`)).toHaveCount(1)
      const check = async () => {
        const want = await expected(page)
        // Three different colours, so a bubble that swapped two of them fails.
        expect(new Set(Object.values(want)).size).toBe(3)
        await expect
          .poll(() => paintOf(bubble))
          .toEqual({ rim: [want.rim], circle: want.circle, icon: [want.icon] })
      }
      await check()
      // The scheme changes under the page: CSS alone repaints the bubble.
      await toggleScheme(page)
      await check()
    })

    test("sets the bubble's circle apart from the badge behind it, at rest and on hover, in either scheme", async ({
      page,
    }) => {
      await page.goto(PAGE)
      const bubble = bubbleOf(badge(page, TAG))
      // The circle, and the nearest background behind it that isn't transparent: the badge's.
      const circleAndBadge = () =>
        bubble.evaluate((bubble) => {
          let under = bubble.parentElement
          while (under && getComputedStyle(under).backgroundColor === "rgba(0, 0, 0, 0)") under = under.parentElement
          return { circle: getComputedStyle(bubble).backgroundColor, badge: getComputedStyle(under).backgroundColor }
        })
      const apart = async () => {
        // The badge's background eases on hover, so wait for it to settle.
        await expect.poll(async () => { const { circle, badge } = await circleAndBadge(); return circle !== badge }).toBe(true)
      }
      for (const scheme of ["first", "second"]) {
        await page.mouse.move(0, 0)
        await apart()
        await bubble.hover()
        await apart()
        if (scheme === "first") await toggleScheme(page)
      }
    })

    test("writes the badge's name as one string, # and the tag's name", async ({ page }) => {
      await page.goto(PAGE)
      const text = badge(page, TAG).locator(name)
      await expect(text).toHaveText("#articles")
      const written = await text.evaluate((text) => ({
        nodes: [...text.childNodes].map((node) => [node.nodeType, node.textContent]),
        before: getComputedStyle(text, "::before").content,
      }))
      expect(written).toEqual({ nodes: [[3, "#articles"]], before: "none" })
    })

    // The theme decides the font, so the badge must keep its parts centred in any: the theme's own,
    // and each generic family the browser has, whose metrics put text higher or lower in its line.
    for (const font of [null, "serif", "sans-serif", "monospace"]) {
      test(`centres the bubble, the name and the count on one line, in ${font ?? "the theme's font"}`, async ({
        page,
      }) => {
        await page.goto(PAGE)
        if (font) {
          await page.addStyleTag({
            content: `.cgc-tag-list, .cgc-post-listing { font-family: ${font} }`,
          })
        }
        const centres = await centresOf(badge(page, TAG), BADGES[plugin])
        expect(Object.keys(centres)).toEqual(["bubble", "name", "count"])
        for (const part of ["name", "count"]) {
          expect
            .soft(Math.abs(centres[part] - centres.bubble), `${part}: ${JSON.stringify(centres)}`)
            .toBeLessThanOrEqual(1)
        }
      })
    }
  })
}

test("draws the same bubble in every badge", async ({ page }) => {
  await page.goto(PAGE)
  const html = await Promise.all(
    Object.values(BADGES).map(({ badge }) =>
      bubbleOf(badge(page, TAG)).evaluate((bubble) => bubble.outerHTML),
    ),
  )
  expect(html[0]).toContain(`title="${TAG}"`)
  expect(html[1]).toBe(html[0])
})

// A library has no layer of its own (ADR-0003's libraries amendment): each plugin that draws bubbles
// ships the bubble's stylesheet in its own sublayer of the family layer.
test("ships the bubble's CSS in each consumer's family layer", async ({ page }) => {
  await page.goto(PAGE)
  const layers = await layersOf(page, BUBBLE.slice(1))
  expect(new Set(layers)).toEqual(new Set(["cgc.tag-list", "cgc.post-listing"]))
})

// The stylesheet is library CSS, which the library's lint checks as the consumers' builds do
// (ADR-0003's libraries amendment), and which must paint with the palette `./bubble` publishes for a
// canvas to resolve.
const lint = (dir) =>
  spawnSync(
    process.execPath,
    ["--experimental-strip-types", "--disable-warning=ExperimentalWarning", "lint-css.mjs", dir],
    { cwd: LIBRARY, encoding: "utf8" },
  )

test("passes its own lint", () => {
  const { status, stdout, stderr } = lint("src")
  expect(stderr).toBe("")
  expect(status).toBe(0)
  expect(stdout).toContain("bubble.css")
})

const PLANTED = [
  {
    name: "a selector outside its block",
    css: ".sidebar .cgc-tag-bubble { width: 0 }",
    says: ".sidebar",
  },
  { name: "a colour literal", css: ".cgc-tag-bubble { outline-color: #ff0000 }", says: "#ff0000" },
  {
    name: "a circle that isn't the palette's",
    replace: ["var(--lightgray)", "var(--gray)"],
    says: "background-color: var(--lightgray)",
  },
  {
    // The badge's circle back on the badge's own background, where only the rim would show.
    name: "a badge's circle that isn't the badge palette's",
    replace: ["background-color: var(--light);", "background-color: var(--lightgray);"],
    says: ".cgc-tag-bubble--badge must paint with the palette ./bubble publishes: background-color: var(--light)",
  },
]
for (const { name, css, replace, says } of PLANTED) {
  test(`refuses a stylesheet with ${name}`, ({}, testInfo) => {
    const copy = fs.mkdtempSync(path.join(os.tmpdir(), "cgc-tags-core-lint-"))
    try {
      fs.cpSync(path.join(LIBRARY, "src"), copy, { recursive: true })
      const file = path.join(copy, "bubble.css")
      let source = fs.readFileSync(file, "utf8")
      if (replace) source = source.replaceAll(...replace)
      if (css) source += `\n${css}\n`
      fs.writeFileSync(file, source)
      const { status, stderr } = lint(copy)
      testInfo.annotations.push({ type: "lint", description: stderr })
      expect(status).toBe(1)
      expect(stderr).toContain(says)
    } finally {
      fs.rmSync(copy, { recursive: true, force: true })
    }
  })
}
