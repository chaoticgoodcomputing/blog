import type { Locator, Page } from "@playwright/test"
import { expect, test } from "../site.ts"

// Every heading is its level's size, wherever it is: one in a note's text, the post listing's, and
// the links panel's (src/styles/global.css). A note with sections, whose text has an h2 and an h3;
// the home page, whose post listing is headed by an h2 and lists each post under an h3; and a note
// with forward links and backlinks, each column headed by an h2.
const sections = "/note-page-furniture/A-note-with-sections"
const linked = "/backlinks/linked"

const style = (heading: Locator) =>
  heading.evaluate((element) => {
    const { fontSize, fontWeight, fontFamily, textAlign } = getComputedStyle(element)
    return { fontSize, fontWeight, fontFamily, textAlign }
  })

async function at(page: Page, url: string, heading: (page: Page) => Locator) {
  await page.goto(url)
  return style(heading(page).first())
}

test("an h2 is the same size, weight, font and alignment in a note, over the post listing and over the links panel", async ({
  page,
}) => {
  const note = await at(page, sections, (page) => page.locator(".prose h2"))
  expect(note.textAlign).toBe("center")
  expect(await at(page, "/", (page) => page.locator(".post-listing > h2"))).toEqual(note)
  expect(await at(page, linked, (page) => page.locator(".forward-links h2"))).toEqual(note)
  expect(await at(page, linked, (page) => page.locator(".backlinks h2"))).toEqual(note)
})

test("a post's title in the listing is an h3, as large and as centred as an h3 in a note", async ({
  page,
}) => {
  const note = await at(page, sections, (page) => page.locator(".prose h3"))
  expect(await at(page, "/", (page) => page.locator(".post-listing .post h3"))).toEqual(note)
})

test("each level of heading is a step smaller: the page's title, then an h2, then an h3", async ({
  page,
}) => {
  await page.goto(sections)
  const size = async (selector: string) =>
    parseFloat((await style(page.locator(selector).first())).fontSize)
  const [title, h2, h3] = [
    await size("main header h1"),
    await size(".prose h2"),
    await size(".prose h3"),
  ]
  expect(title).toBeGreaterThan(h2)
  expect(h2).toBeGreaterThan(h3)
})
