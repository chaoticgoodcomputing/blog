import { graph } from "../../site.config.ts"
import { expect, test } from "../site.ts"

test("over all time, the global graph holds every pinned top-level tag, each drawn as its tag bubble, and no private tag", async ({ page }) => {
  await page.goto("/")
  await page.locator(".local-graph").getByRole("button", { name: "Open the global graph" }).click()
  const dialog = page.getByRole("dialog", { name: "Global graph" })
  await dialog.getByRole("slider", { name: "Time period" }).press("Home")
  const canvas = dialog.locator("canvas")
  await expect(canvas.locator(":scope > ul > li").first()).toBeAttached()
  const hrefs = await canvas.evaluate((element) =>
    [...element.querySelectorAll(":scope > ul > li > a")].map((link) => link.getAttribute("href")),
  )
  for (const tag of graph.global.shell.pinnedTags) {
    expect(hrefs).toContain(`/tags/${tag}`)
    // The bubble the canvas copies, with its icon.
    await expect(dialog.locator(`[data-tag="${tag}"] .tag-bubble svg`)).toBeAttached()
  }
  expect(hrefs.filter((href) => href?.startsWith("/tags/private"))).toEqual([])
})
