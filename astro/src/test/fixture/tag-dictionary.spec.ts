import { tagColor } from "../../lib/tag-dictionary.ts"
import { expect, test } from "../site.ts"

// A note with three tags: `engineering/languages/typescript`, which has an icon of its own and
// takes engineering's colour; `projects/games/chess`, which takes the site's own d20 icon from
// `projects/games` and the red of `projects`; and `gardening/roses`, which the dictionary has
// nothing for.
const note = "/tag-dictionary/badges"

/** A tag's colours in the site's dictionary, as a browser computes them: light, then dark. */
function colours(tag: string): string[] {
  const [, light, dark] = /light-dark\(\s*([^,]+?)\s*,\s*([^)]+?)\s*\)/.exec(tagColor(tag) ?? "")!
  return [light!, dark!].map((hex) => {
    const [r, g, b] = [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16))
    return `rgb(${r}, ${g}, ${b})`
  })
}
const engineering = colours("engineering")
const projects = colours("projects")

test("a note's tags are tag badges under its title, each linking to its tag's page", async ({ page }) => {
  await page.goto(note)
  const list = page.locator("main header .tag-list")
  const badges = list.locator(".tag-badge")
  await expect(badges).toHaveText(["#typescript", "#chess", "#roses"])
  await expect(list.getByRole("link", { name: "#typescript" })).toHaveAttribute("href", "/tags/engineering/languages/typescript")
  await expect(list.getByRole("link", { name: "#chess" })).toHaveAttribute("href", "/tags/projects/games/chess")
  await expect(list.getByRole("link", { name: "#roses" })).toHaveAttribute("href", "/tags/gardening/roses")
})

test.describe("with no script", () => {
  test.use({ javaScriptEnabled: false })

  test("each badge's icon is drawn as inline SVG when the site builds", async ({ page }) => {
    await page.goto(note)
    const bubble = (name: string) => page.locator(".tag-badge", { hasText: name }).locator(".tag-bubble")
    for (const [name, icon] of [
      ["#typescript", "mdi:language-typescript"],
      ["#chess", "d20"],
    ]) {
      const svg = bubble(name!).locator("svg")
      await expect(svg, name).toHaveAttribute("data-icon", icon!)
      const box = await svg.boundingBox()
      expect(box?.width, name).toBeGreaterThan(0)
    }
  })

  test("a tag with no colour or icon in its lineage is a badge without them", async ({ page }) => {
    await page.goto(note)
    const badge = page.locator(".tag-badge", { hasText: "#roses" })
    await expect(badge).toBeVisible()
    await expect(badge.locator(".tag-bubble")).toBeVisible()
    await expect(badge.locator(".tag-bubble svg")).toHaveCount(0)
    // Its rim is the palette's `--gray`, which no tag's colour is.
    await expect(badge.locator(".tag-bubble")).toHaveCSS("border-top-color", "rgb(184, 184, 184)")
  })
})

for (const [index, scheme] of (["light", "dark"] as const).entries()) {
  test(`each bubble's rim is the tag's colour, in the ${scheme} scheme`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme })
    await page.goto(note)
    const rim = (name: string) => page.locator(".tag-badge", { hasText: name }).locator(".tag-bubble")
    await expect(rim("#typescript")).toHaveCSS("border-top-color", engineering[index]!)
    await expect(rim("#chess")).toHaveCSS("border-top-color", projects[index]!)
  })
}
