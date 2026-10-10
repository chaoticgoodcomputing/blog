import { expect, test } from "../site.ts"

// Tickets 02 and 03 together: drawings-in-embeds/host embeds drawings-in-embeds/shelf, which embeds
// the drawing drawings/single. The embedded note is compiled on its own, and shows the drawing as
// its own page does: as the drawing's export, not as the drawing's note.

test("a drawing in an embedded note is shown as its export, as on that note's own page", async ({
  page,
  externalRequests,
}) => {
  for (const address of ["/drawings-in-embeds/shelf", "/drawings-in-embeds/host"]) {
    await page.goto(address)
    const drawing = page.locator(".prose .excalidraw-embed").getByRole("img", { name: "A single circle" })
    await expect(drawing).toHaveCount(1)
    await expect(drawing).toHaveAttribute("src", "/drawings/drawings/single.svg")
    await expect(drawing).toBeVisible()
    await expect(page.locator(".prose")).not.toContainText("Excalidraw Data")
  }
  // The host's drawing is the one inside the embed.
  await expect(page.locator(".prose .markdown-embed .excalidraw-embed img")).toHaveCount(1)
  expect(externalRequests).toEqual([])
})
