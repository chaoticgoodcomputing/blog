// Annotating a PDF with Hypothesis's own client, in the plugin's pages, against the fake service:
// what the user does in the sidebar, and what it does to the annotation note.

import { expect, type Frame, type Page, test } from "@playwright/test"
import { parseNote, upsertAnnotation } from "@chaoticgoodcomputing/annotator-format"

const TARGET = "https://example.org/fixture.pdf"
const PREFACE = `---\nannotation-target: ${TARGET}\n---\n\nA preface.\n`
const EPILOGUE = "\nAn epilogue.\n"

/** An annotation as the plugin would have written it into a note. */
const seed = (id: string, exact: string, prefix: string, text: string) => ({
  id,
  uri: TARGET,
  document: { title: "fixture.pdf" },
  target: [{ source: TARGET, selector: [{ type: "TextQuoteSelector", exact, prefix, suffix: "" }] }],
  text,
  tags: ["seeded"],
  created: "2026-10-01T12:00:00.000Z",
  updated: "2026-10-01T12:00:00.000Z",
})

/** A note holding one annotation, on the second page's passage, or more, then an epilogue. */
function seededNote(...more: ReturnType<typeof seed>[]) {
  let note = PREFACE
  for (const annotation of [seed("seed1", "Another passage worth a comment.", "The second page of the fixture.", "A comment already in the note."), ...more]) {
    note = upsertAnnotation(note, annotation).note
  }
  return note + EPILOGUE
}

async function open(page: Page, query: Record<string, string> = {}) {
  await page.goto(`/?${new URLSearchParams(query)}`)
  const viewer = page.frameLocator('iframe[src*="viewer.html"]')
  await viewer.locator(".textLayer span", { hasText: "Annotate this sentence" }).waitFor()
  await expect.poll(() => sidebarOf(page)).toBeTruthy()
  const sidebar = sidebarOf(page)!
  await sidebar.getByText("This note").first().waitFor()
  return { viewer, viewerFrame: page.frames().find((frame) => frame.url().includes("viewer.html"))!, sidebar }
}

const sidebarOf = (page: Page): Frame | undefined => page.frames().find((frame) => frame.url().includes("sidebar.html"))
const noteOf = (page: Page) => page.evaluate(() => (window as any).harness.note as string)

/** Selects a line of the PDF's text, as a user dragging over it would. */
async function select(viewerFrame: Frame, text: string) {
  await viewerFrame.evaluate((text) => {
    const span = [...document.querySelectorAll(".textLayer span")].find((span) => span.textContent?.includes(text))!
    const range = document.createRange()
    range.selectNodeContents(span)
    getSelection()!.removeAllRanges()
    getSelection()!.addRange(range)
    document.body.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }))
  }, text)
}

test("the document opens, with the user logged in to the note's one group", async ({ page }) => {
  const { viewerFrame, sidebar } = await open(page)
  expect(await viewerFrame.evaluate(() => document.querySelectorAll(".page").length)).toBe(2)
  await expect(sidebar.getByText("There are no annotations in this group.")).toBeVisible()
  // The client names the document as annotations name it: by its target.
  expect(await viewerFrame.evaluate(() => (window as any).PDFViewerApplication.url)).toBe(TARGET)
  // And finds the text to annotate: it warns of none when it counts no pages.
  await viewerFrame.waitForTimeout(500)
  expect(await viewerFrame.evaluate(() => document.querySelector("hypothesis-banner")?.shadowRoot?.textContent ?? "")).not.toContain("does not contain selectable text")
})

test("annotating a passage writes it into the note, after the preface", async ({ page }) => {
  const { viewer, viewerFrame, sidebar } = await open(page)
  await select(viewerFrame, "Annotate this sentence")
  await viewer.getByRole("button", { name: /^Annotate/ }).click()
  await sidebar.getByRole("textbox", { name: "Enter comment" }).fill("My first comment.")
  const tags = sidebar.getByRole("combobox", { name: "Add tags" }).or(sidebar.getByPlaceholder("Add new tags"))
  await tags.fill("reading")
  await tags.press("Enter")
  await sidebar.getByRole("button", { name: "Post to This note" }).click()

  await expect.poll(async () => parseNote(await noteOf(page)).annotations.length).toBe(1)
  const note = await noteOf(page)
  const [annotation] = parseNote(note).annotations
  expect(annotation!.text).toBe("My first comment.")
  expect(annotation!.tags).toEqual(["reading"])
  expect(annotation!.uri).toBe(TARGET)
  const quote = annotation!.target![0]!.selector!.find((selector) => selector.type === "TextQuoteSelector") as { exact: string }
  expect(quote.exact).toContain("Annotate this sentence, please.")
  expect(note.startsWith(PREFACE)).toBe(true)
  // The card is the user's own, so it can be edited.
  await expect(sidebar.getByRole("button", { name: "Edit" })).toBeVisible()
})

test("an annotation already in the note is highlighted in the document and shown in the sidebar", async ({ page }) => {
  const { viewerFrame, sidebar } = await open(page, { note: seededNote() })
  await expect(sidebar.getByText("A comment already in the note.")).toBeVisible()
  await expect.poll(() => viewerFrame.evaluate(() => [...document.querySelectorAll("hypothesis-highlight")].map((highlight) => highlight.textContent).join(""))).toContain("Another passage worth a comment.")
})

test("editing an annotation rewrites its block; the epilogue stays last", async ({ page }) => {
  const { sidebar } = await open(page, { note: seededNote() })
  await sidebar.getByRole("button", { name: "Edit" }).click()
  await sidebar.getByRole("textbox", { name: "Enter comment" }).fill("An edited comment.")
  // Saving an edit is posting it again.
  await sidebar.getByRole("button", { name: "Post to This note" }).click()
  await expect.poll(async () => parseNote(await noteOf(page)).annotations[0]?.text).toBe("An edited comment.")
  const note = await noteOf(page)
  expect(parseNote(note).annotations.map((annotation) => annotation.id)).toEqual(["seed1"])
  expect(note.endsWith(EPILOGUE)).toBe(true)
})

test("deleting an annotation removes its block, and nothing else", async ({ page }) => {
  const { sidebar } = await open(page, { note: seededNote() })
  await sidebar.getByRole("button", { name: "Delete" }).click()
  // The client asks first, in a dialog of its own.
  await sidebar.getByRole("dialog").getByRole("button", { name: "Delete" }).click()
  await expect.poll(async () => parseNote(await noteOf(page)).blocks.length).toBe(0)
  expect(await noteOf(page)).toBe(PREFACE + EPILOGUE)
})

test("opening at an annotation narrows the sidebar to it", async ({ page }) => {
  const other = seed("seed2", "A line nobody annotates.", "Annotate this sentence, please.", "Another comment.")
  const { sidebar } = await open(page, { note: seededNote(other), annotation: "seed1" })
  await expect(sidebar.getByText("A comment already in the note.")).toBeVisible()
  await expect(sidebar.getByText("Another comment.")).toBeHidden()
  // With a way back to all of them.
  await sidebar.getByRole("button", { name: /show all annotations/ }).click()
  await expect(sidebar.getByText("Another comment.")).toBeVisible()
})
