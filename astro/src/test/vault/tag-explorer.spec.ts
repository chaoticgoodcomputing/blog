import { expect, test } from "../site.ts"

test("every tag in the tree has its icon and colour, and no private tag is there", async ({ page }) => {
  await page.goto("/")
  const bubbles = page.locator(".tag-explorer .branch > .row .tag-bubble")
  expect(await bubbles.count()).toBeGreaterThan(0)
  const without = await bubbles.evaluateAll((all) =>
    all
      .filter((bubble) => !(bubble as HTMLElement).style.getPropertyValue("--tag-color") || !bubble.querySelector("svg"))
      .map((bubble) => bubble.closest("li")!.dataset.tag),
  )
  expect(without).toEqual([])
  await expect(page.locator('.tag-explorer li[data-tag="private"]')).toHaveCount(0)
})

test("each tag counts in the explorer what its badge on the tags index counts (tickets 12 and 13)", async ({ page }) => {
  await page.goto("/tags")
  const counts = (selector: string) =>
    page
      .locator(selector)
      .evaluateAll((links) =>
        Object.fromEntries(links.map((link) => [link.getAttribute("href"), link.querySelector(".count")?.textContent])),
      )
  const badges = await counts("main .tag-page-tags a.tag-badge")
  const explorer = await counts(".tag-explorer .tree > li > .row > a.tag")
  expect(Object.keys(badges).length).toBeGreaterThan(0)
  for (const [href, count] of Object.entries(badges)) expect(explorer[href], href).toBe(count)
})
