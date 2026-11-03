import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { PDFDocument } from "pdf-lib"
import { afterEach, beforeEach, expect, test, vi } from "vitest"
import {
  mirrorFor,
  mirrorsToRecognize,
  mirrorTextFor,
  missingMirrors,
  publishedMirrors,
  shownMirrorName,
  sliceName,
  slicesToMake,
  unmirroredDocuments,
} from "../src/lib/mirrors.ts"
import { slicePdf } from "../src/lib/slices.ts"

const BOOK = "https://example.com/books/A%20Textbook.pdf"
const note = (frontmatter: Record<string, unknown>) => ({ frontmatter: { "annotation-target": BOOK, ...frontmatter } })
const whole = note({})
const chapter1 = note({ "annotation-pages": "1-2" })
const chapter2 = note({ "annotation-pages": "3-4, 6" })

// A PDF of `count` pages, each told from the others by its width: page n is 100 + n points wide.
async function book(count: number): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  for (let n = 1; n <= count; n++) pdf.addPage([100 + n, 200])
  return pdf.save()
}
const widths = async (bytes: Uint8Array) => (await PDFDocument.load(bytes)).getPages().map((page) => page.getWidth())

let root: string
beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "astro-slices-"))
})
afterEach(() => fs.rmSync(root, { recursive: true, force: true }))

test("a slice is named by its mirror's name and its pages, so notes on the same pages share one", () => {
  expect(sliceName("A-Textbook.pdf", [[12, 40]])).toBe("A-Textbook.p12-40.pdf")
  expect(sliceName("A-Textbook.pdf", [[3, 4], [6, 6]])).toBe("A-Textbook.p3-4_6.pdf")
  expect(shownMirrorName(whole.frontmatter)).toBe("A-Textbook.pdf")
  expect(shownMirrorName(chapter2.frontmatter)).toBe("A-Textbook.p3-4_6.pdf")
  expect(shownMirrorName(note({ "annotation-pages": "4, 3, 6" }).frontmatter)).toBe("A-Textbook.p3-4_6.pdf")
})

test("a note with a page range is shown its slice, and its slice's text file, never the whole document", () => {
  fs.writeFileSync(path.join(root, "A-Textbook.pdf"), "%PDF-1.4")
  expect(mirrorFor(whole, root)).toBe("/assets/annotated-documents/A-Textbook.pdf")
  // The slice isn't made yet: the page has no mirror, as one whose document isn't saved has none.
  expect(mirrorFor(chapter1, root)).toBeUndefined()
  fs.writeFileSync(path.join(root, "A-Textbook.p1-2.pdf"), "%PDF-1.4 slice")
  expect(mirrorFor(chapter1, root)).toBe("/assets/annotated-documents/A-Textbook.p1-2.pdf")
  expect(mirrorTextFor(chapter1, root)).toBeUndefined()
})

test("a document is downloaded once, whichever notes show it whole or in slices, and never again while it or its slices are saved", () => {
  expect(unmirroredDocuments(root, [whole, chapter1, chapter2])).toEqual([BOOK])
  expect(missingMirrors(root, [whole, chapter1, chapter2])).toEqual(["A-Textbook.pdf", "A-Textbook.p1-2.pdf", "A-Textbook.p3-4_6.pdf"])

  // Only the slices saved, and the whole document gone: none of its notes needs it.
  fs.writeFileSync(path.join(root, "A-Textbook.p1-2.pdf"), "%PDF")
  fs.writeFileSync(path.join(root, "A-Textbook.p3-4_6.pdf"), "%PDF")
  expect(unmirroredDocuments(root, [chapter1, chapter2])).toEqual([])
  // A note that shows it whole does.
  expect(unmirroredDocuments(root, [whole, chapter1])).toEqual([BOOK])
})

test("each slice still to make is made from the saved document, once however many notes show it", () => {
  expect(slicesToMake(root, [chapter1, chapter2])).toEqual([])
  fs.writeFileSync(path.join(root, "A-Textbook.pdf"), "%PDF")
  expect(slicesToMake(root, [whole, chapter1, chapter1, chapter2])).toEqual([
    { slice: "A-Textbook.p1-2.pdf", mirror: "A-Textbook.pdf", range: [[1, 2]] },
    { slice: "A-Textbook.p3-4_6.pdf", mirror: "A-Textbook.pdf", range: [[3, 4], [6, 6]] },
  ])
  fs.writeFileSync(path.join(root, "A-Textbook.p1-2.pdf"), "%PDF")
  expect(slicesToMake(root, [chapter1, chapter2]).map(({ slice }) => slice)).toEqual(["A-Textbook.p3-4_6.pdf"])
})

test("only what the notes show is recognized and published: a book read in chapters never whole", () => {
  for (const file of ["A-Textbook.pdf", "A-Textbook.p1-2.pdf", "A-Textbook.p3-4_6.pdf"]) fs.writeFileSync(path.join(root, file), "%PDF")
  expect(mirrorsToRecognize(root, [chapter1, chapter2])).toEqual(["A-Textbook.p1-2.pdf", "A-Textbook.p3-4_6.pdf"])
  expect([...publishedMirrors(root, [chapter1, chapter2]).keys()]).toEqual([
    "/assets/annotated-documents/A-Textbook.p1-2.pdf",
    "/assets/annotated-documents/A-Textbook.p3-4_6.pdf",
  ])
  expect([...publishedMirrors(root, [whole]).keys()]).toEqual(["/assets/annotated-documents/A-Textbook.pdf"])
})

test("a slice is the range's pages of the document, in order", async () => {
  const slice = await slicePdf(await book(6), [[3, 4], [6, 6]])
  expect(slice?.pages).toBe(3)
  expect(await widths(slice!.bytes)).toEqual([103, 104, 106])
})

test("a range running past the document's end is cut short there, and one wholly past it is no slice", async () => {
  const slice = await slicePdf(await book(4), [[3, 9]])
  expect(await widths(slice!.bytes)).toEqual([103, 104])
  expect(slice?.missing).toBe(5)
  expect(await slicePdf(await book(4), [[5, 9]])).toBeUndefined()
})

test("a slice is the same bytes every time it is made, so its text file stays its own", async () => {
  const pdf = await book(5)
  // Made a day apart: no date of making is written into it.
  vi.useFakeTimers({ toFake: ["Date"] })
  try {
    vi.setSystemTime(new Date("2026-01-01"))
    const a = await slicePdf(pdf, [[2, 3]])
    vi.setSystemTime(new Date("2026-01-02"))
    const b = await slicePdf(pdf, [[2, 3]])
    expect(Buffer.from(a!.bytes).equals(Buffer.from(b!.bytes))).toBe(true)
  } finally {
    vi.useRealTimers()
  }
})
