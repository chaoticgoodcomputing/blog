import { expect, expectAt, test } from "../site.ts"

// test/fixtures/vault/annotations: a note written with the Annotator plugin, three annotations in
// the order they were written, one with tags and one with a callout for a comment; a note that
// links to one of them; and a note whose annotation target is empty.

const PAGE = "/annotations/handbook"

test("an annotation page is its preface, its link to the document, its annotations in the document's order, and its epilogue", async ({
  page,
}) => {
  await page.goto(PAGE)
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("An annotated handbook")
  const body = page.locator("article.prose")
  await expect(body.locator(":scope > *")).toHaveCount(4)
  await expect(body.locator(":scope > :nth-child(1)")).toHaveClass("annotation-preface")
  await expect(body.locator(":scope > :nth-child(1)")).toHaveText("Why I read the handbook.")
  await expect(body.locator(":scope > :nth-child(2)")).toHaveClass("annotated-document")
  await expect(body.locator(":scope > :nth-child(3)")).toHaveClass("annotations")
  await expect(body.locator(":scope > :nth-child(4)")).toHaveClass("annotation-epilogue")
  await expect(body.locator(":scope > :nth-child(4)")).toHaveText("What I took from the handbook.")

  // The cover (character 0), the adventure (162), the small print (2707): the order of the
  // document, not the order they were written in.
  await expect(body.locator(".annotation-highlight")).toHaveText([
    "H A N D B O O K   F O R  N E W   E M P L O Y E E S",
    "A fearless adventure in knowing what to do when no one’s there telling you what to do",
    "This handbook does not constitute an employment contract or binding policy",
  ])
})

test("none of the Annotator plugin's own markup shows", async ({ page }) => {
  await page.goto(PAGE)
  const text = await page.locator("article.prose").innerText()
  for (const written of ["%%", "annotation-json", "show annotation", "TextQuoteSelector", "PREFIX", "==", "^qywghl0r7w"]) {
    expect(text, written).not.toContain(written)
  }
})

test("an annotation shows its passage and its comment, the comment's Markdown and wikilinks rendered", async ({ page }) => {
  await page.goto(PAGE)
  const adventure = page.locator(".annotation").nth(1)
  await expect(adventure.locator(".annotation-comment")).toContainText("The first line a new employee sees")

  const smallPrint = page.locator(".annotation").nth(2)
  await expect(smallPrint.locator(".annotation-comment .callout")).toContainText("An aside")
  await expect(smallPrint.locator(".annotation-comment .callout em")).toHaveText("before")

  await adventure.getByRole("link", { name: "Flatland" }).click()
  await expectAt(page, /\/annotations\/flatland$/)
})

test("an annotation's tags are shown, and one with none shows none", async ({ page }) => {
  await page.goto(PAGE)
  await expect(page.locator(".annotation").nth(2).locator(".annotation-tag")).toHaveText(["#legal", "#small print"])
  await expect(page.locator(".annotation").nth(1).locator(".annotation-tags")).toHaveCount(0)
})

test("an annotation's tags are text to read, in the palette's dark grey, not its faint one", async ({ page }) => {
  // --darkgray's light value, #4e4e4e: 7.9:1 on the page, where --gray's #b8b8b8 is 1.9:1.
  await page.emulateMedia({ colorScheme: "light" })
  await page.goto(PAGE)
  for (const tag of await page.locator(".annotation").nth(2).locator(".annotation-tag").all()) {
    await expect(tag).toHaveCSS("color", "rgb(78, 78, 78)")
  }
})

test("each annotation is a card that ends with the date it was written, as the site writes a date", async ({ page }) => {
  await page.goto(PAGE)
  const cover = page.locator(".annotation").nth(0)
  await expect(cover.locator("time.annotation-date")).toHaveText("Mar 26, 2026")
  await expect(cover.locator("time.annotation-date")).toHaveAttribute("datetime", "2026-03-26T16:30:00.000Z")
  await expect(cover).toHaveCSS("border-top-style", "solid")
  await expect(cover).toHaveCSS("border-radius", "8px")
  // The passage is quoted: the document's words, in italics, ruled off from the comment.
  await expect(cover.locator(".annotation-highlight")).toHaveCSS("font-style", "italic")
})

test("the annotations are headed, under where the document comes from", async ({ page }) => {
  await page.goto(PAGE)
  await expect(page.locator("section.annotations > h2")).toHaveText("Annotations")
})

test("each annotation is addressed by its block id, and a link from another note lands on it", async ({ page }) => {
  await page.goto(PAGE)
  await expect(page.locator(".annotation").nth(0)).toHaveAttribute("id", "^yx67hjphtyd")
  await expect(page.locator(".annotation").nth(1)).toHaveAttribute("id", "^qywghl0r7w")

  await page.setViewportSize({ width: 1440, height: 600 })
  await page.goto("/annotations/flatland")
  await page.getByRole("link", { name: "the small print" }).click()
  await expectAt(page, /\/annotations\/handbook#\^cftvox6c89v$/)
  const landed = page.locator(".annotation:target")
  await expect(landed.locator(".annotation-highlight")).toHaveText(
    "This handbook does not constitute an employment contract or binding policy",
  )
  await expect(landed).toBeInViewport()
})

test("the page says where the annotated document comes from, a link to it at its address", async ({ page }) => {
  await page.goto(PAGE)
  await expect(page.locator(".annotated-document")).toHaveText("Source document: example.com")
  await expect(page.locator(".annotated-document a")).toHaveAttribute("href", "https://example.com/handbooks/Valve_Handbook_LowRes.pdf")
})

test("a note whose annotation target is empty is a note", async ({ page }) => {
  await page.goto("/annotations/no-target")
  await expect(page.locator(".annotations, .annotated-document")).toHaveCount(0)
  await expect(page.locator("article.prose")).toHaveText("Notes on a book, written by hand rather than with the Annotator plugin.")
})

test("on a phone an annotation page reads in one column and does not scroll sideways", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(PAGE)
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0)
  const column = await page.locator("article.prose").boundingBox()
  for (const annotation of await page.locator(".annotation").all()) {
    const box = (await annotation.boundingBox())!
    // Each annotation as wide as the column, its passage over its comment.
    expect(box.x).toBeCloseTo(column!.x, 0)
    expect(box.width).toBeCloseTo(column!.width, 0)
    const passage = (await annotation.locator(".annotation-highlight").boundingBox())!
    const comment = (await annotation.locator(".annotation-comment").boundingBox())!
    expect(passage.y + passage.height).toBeLessThanOrEqual(comment.y)
  }
})

// test/fixtures/vault/content/annotations/field-manual: an annotation note among the articles, as
// the vault's are, with one annotation whose comment has a word no other page has.
const ARTICLE = "/content/annotations/field-manual"

test("an annotation page is an article in the site shell: its type, its date, its tag, and search", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1300, height: 800 })
  await page.goto(ARTICLE)

  // The note is an article under `writing/annotations`, so a ScholarlyArticle.
  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!) as Record<string, unknown>
  expect(ld["@type"]).toBe("ScholarlyArticle")
  expect(ld.articleSection).toBe("Annotations")

  await expect(page.locator("main header .date-and-reading-time")).toHaveText(/^Mar 27, 2026, \d+ min read$/)
  await expect(page.locator("main header .tag-list").getByRole("link", { name: "#annotations" })).toBeVisible()

  // A comment is the page's text, and is searched: "quodlibet" is in one comment, and nowhere else.
  await page.keyboard.press("Control+k")
  const search = page.getByRole("dialog", { name: "Search" })
  await search.getByRole("searchbox").fill("quodlibet")
  const result = search.getByRole("link", { name: /An annotated field manual/ })
  await expect(result).toBeVisible()
  await expect(result).toHaveAttribute("href", ARTICLE)
  await expect(result.locator("mark")).toHaveText("quodlibet")
})
