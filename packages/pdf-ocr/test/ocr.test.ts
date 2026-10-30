// Recognizing a scanned PDF (test/fixture-pdf.ts): which pages, their text, and that the text is
// the same however it is run, and the same as the text it was pinned with.

import assert from "node:assert/strict"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { test } from "node:test"
import { recognizePages, scanOf, textContentOf, textlessPages, type TextFile } from "../src/index.ts"
import { loadEngine, openPdf, pdfjs, recognizePdf } from "../src/node.ts"
import { OPS } from "../src/scans.ts"
import { SCAN_TEXT, scannedPdf } from "./fixture-pdf.ts"

const pdfBytes = scannedPdf()
const words = (text: { lines: { text: string }[][] }) => text.lines.map((line) => line.map((word) => word.text).join(" "))

test("the operators read are PDF.js's", async () => {
  const { OPS: PDFJS_OPS } = await pdfjs()
  for (const [name, value] of Object.entries(OPS)) assert.equal(PDFJS_OPS[name as keyof typeof PDFJS_OPS], value, name)
})

test("the pages to recognize are those with no text of their own, and a scan is a page's one large image", async () => {
  const pdf = await openPdf(pdfBytes)
  assert.deepEqual(await textlessPages(pdf), [1, 3, 4])
  assert.equal(await scanOf(await pdf.getPage(3)), undefined)
  const mask = (await scanOf(await pdf.getPage(1)))!
  const grey = (await scanOf(await pdf.getPage(4)))!
  assert.equal(mask.dpi, 300)
  // The same pixels, however the PDF stores them.
  assert.deepEqual(grey.pnm, mask.pnm)
  await pdf.destroy()
})

test("a scan's text is read in its lines, and placed where it is on the page", async () => {
  const [engine, pdf] = await Promise.all([loadEngine(), openPdf(pdfBytes)])
  const [[, page1], [, page4]] = await recognizePages(pdf, [1, 4], engine)
  assert.deepEqual(words(page1!), SCAN_TEXT)
  assert.deepEqual(page4, page1)
  // "A" begins the first line: its ink 163 pixels into the scan, at 300 dpi, an inch from the page's
  // edge, less a little for the scan's turn.
  const first = page1!.lines[0]![0]!
  assert.ok(Math.abs(first.x - (72 + (163 / 300) * 72 - 1.6)) < 1, `x ${first.x}`)
  assert.ok(first.size > 8 && first.size < 14, `size ${first.size}`)
  // Lines go down the page.
  assert.ok(page1!.lines[1]![0]!.y < first.y)
  await pdf.destroy()
})

test("a page's text is the same whatever was recognized before it", async () => {
  const [engine, pdf] = await Promise.all([loadEngine(), openPdf(pdfBytes)])
  const together = await recognizePages(pdf, [4, 1], engine)
  const alone = await recognizePages(pdf, [1], engine)
  assert.deepEqual(together.find(([n]) => n === 1), alone[0])
  await pdf.destroy()
})

test("the text file is the same in one worker or several", async () => {
  const one = await recognizePdf(pdfBytes, { workers: 1 })
  const two = await recognizePdf(pdfBytes, { workers: 2 })
  assert.deepEqual(two, one)
  assert.deepEqual(Object.keys(one.pages), ["1", "4"])
})

// The text the fixture was pinned with: what any machine must recognize, character for character
// and point for point. UPDATE_EXPECTED=1 writes it afresh, for a change of engine.
test("the text file is the one pinned", async () => {
  const expectedFile = new URL("./fixtures/expected.text.json", import.meta.url)
  const text = await recognizePdf(pdfBytes)
  if (process.env.UPDATE_EXPECTED || !existsSync(expectedFile)) writeFileSync(expectedFile, `${JSON.stringify(text, null, 1)}\n`)
  assert.deepEqual(text, JSON.parse(readFileSync(expectedFile, "utf8")) as TextFile)
})

test("a page's text is given to PDF.js as its words, the spaces between them and the ends of lines", () => {
  const content = textContentOf({
    lines: [
      [{ text: "A", x: 10, y: 100, width: 5, size: 10 }, { text: "path", x: 18, y: 100, width: 20, size: 10 }],
      [{ text: "bends.", x: 10, y: 88, width: 30, size: 10 }],
    ],
  })
  assert.deepEqual(content.items.map((item) => [item.str, item.hasEOL]), [["A", false], [" ", false], ["path", true], ["bends.", true]])
  assert.deepEqual(content.items[1]!.transform, [10, 0, 0, 10, 15, 100])
  assert.equal(content.items[1]!.width, 3)
  assert.equal(content.items.map((item) => item.str).join(""), "A pathbends.")
  assert.ok(content.styles[content.items[0]!.fontName])
})

test("a PDF with no scanned pages has a text file with no pages, which says it was looked at", async () => {
  const { textOnlyPdf } = await import("./fixture-pdf.ts")
  const text = await recognizePdf(textOnlyPdf())
  assert.deepEqual(text.pages, {})
  assert.equal(text.source.pages, 1)
})
