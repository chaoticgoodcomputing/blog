import { expect, test } from "../site.ts"

test("a wikilink to an attachment goes to its path in the vault, where the site serves it", async ({ page }) => {
  await page.goto("/attachments/attachments")
  const link = page.locator(".prose").getByRole("link", { name: "Field Report.pdf" }).first()
  await expect(link).toHaveAttribute("href", "/attachments/files/Field%20Report.pdf")
  await expect(link).not.toHaveClass(/is-unresolved/)

  const response = await page.request.get("/attachments/files/Field%20Report.pdf")
  expect(response.status()).toBe(200)
  expect(await response.text()).toContain("The fixture report")
})

test("a Markdown link to an attachment goes to its path in the vault, where the site serves it", async ({ page }) => {
  await page.goto("/attachments/attachments")
  const link = page.locator(".prose").getByRole("link", { name: "the structure" })
  await expect(link).toHaveAttribute("href", "/attachments/files/structure.pdb")
  await expect(link).not.toHaveClass(/is-unresolved/)

  const response = await page.request.get("/attachments/files/structure.pdb")
  expect(response.status()).toBe(200)
  expect(await response.text()).toBe("ATOM      1  N   MET A   1\n")
})

test("an image a note links to is served at its path in the vault", async ({ page }) => {
  await page.goto("/attachments/attachments")
  const link = page.locator(".prose").getByRole("link", { name: "the chart" })
  await expect(link).toHaveAttribute("href", "/attachments/files/chart.png")

  const response = await page.request.get("/attachments/files/chart.png")
  expect(response.status()).toBe(200)
  expect(response.headers()["content-type"]).toBe("image/png")
})

test("an embed of an attachment that is no image is a link to it", async ({ page }) => {
  await page.goto("/attachments/attachments")
  const embed = page.locator(".prose a.internal-embed")
  await expect(embed).toHaveText("Field Report.pdf")
  await expect(embed).toHaveAttribute("href", "/attachments/files/Field%20Report.pdf")
  await expect(embed).not.toHaveClass(/is-unresolved/)
})

test("a widget's address for an attachment, in another case than the file's, is the attachment's own", async ({
  page,
}) => {
  await page.goto("/attachments/viewer")
  await expect(page.getByRole("link", { name: "Download" })).toHaveAttribute(
    "href",
    "/attachments/files/Field%20Report.pdf",
  )
})

test("a widget's address for an attachment whose name has a % that starts no escape is the attachment's own", async ({
  page,
}) => {
  await page.goto("/attachments/stray-percent")
  await expect(page.getByRole("link", { name: "Download" })).toHaveAttribute("href", "/attachments/files/tally-50%25.pdf")

  const response = await page.request.get("/attachments/files/tally-50%25.pdf")
  expect(response.status()).toBe(200)
  expect(await response.text()).toContain("The fixture tally")
})

test("a dotfile of the vault is not published", async ({ page }) => {
  const response = await page.request.get("/attachments/files/.hidden.txt")
  expect(response.status()).toBe(404)
})

test("a widget draws a PDF the site serves, from the site alone", async ({ page, externalRequests }) => {
  // test/fixtures/vault/attachments/one-page.mdx shows a real PDF of one page.
  const response = await page.request.get("/attachments/files/one-page.pdf")
  expect(response.status()).toBe(200)
  expect(response.headers()["content-type"]).toBe("application/pdf")

  await page.goto("/attachments/one-page")
  const viewer = page.locator(".prose astro-island")
  await expect(viewer.getByText("1 page", { exact: true })).toBeVisible()
  await expect(viewer.locator("canvas")).toHaveCount(1)
  await expect(viewer.locator("canvas")).toBeVisible()
  await expect(viewer).not.toContainText("couldn't be shown")
  await expect(viewer.getByRole("link", { name: "Download" })).toHaveAttribute("href", "/attachments/files/one-page.pdf")
  expect(externalRequests).toEqual([])
})
