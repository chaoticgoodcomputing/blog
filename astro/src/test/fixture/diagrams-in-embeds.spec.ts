import { expect, test } from "../site.ts"

// Tickets 02 and 04 together: diagrams-in-embeds/host has no mermaid block of its own, and embeds
// mermaid/diagram, which has one. The embedded block is drawn, as on that note's own page: the
// page loads the diagram element because a note it embeds has a diagram.

test("a mermaid block in an embedded note is drawn as a diagram", async ({ page, externalRequests }) => {
  await page.goto("/diagrams-in-embeds/host")

  const diagram = page.locator(".prose .markdown-embed mermaid-diagram")
  await expect(diagram).toHaveCount(1)
  await expect(diagram.locator("svg")).toBeVisible()
  for (const label of ["Start", "Choice", "Yes", "Done"]) {
    await expect(diagram.locator("svg").getByText(label, { exact: true })).toBeVisible()
  }
  expect(externalRequests).toEqual([])
})
