import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterAll, beforeAll, expect, test } from "vitest"
import { findPassage, highlightBoxes, pageText } from "../src/lib/highlights.ts"
import { annotatedPassages, documentFileName } from "../src/lib/annotations.ts"
import { getNote } from "../src/lib/notes.ts"
import { MIRRORS_ROOT, defaultMirrorsRoot, workspaceRoot, isPdf, mirrorFile, mirrorName, mirrorOf, mirrorsToSave } from "../src/lib/mirrors.ts"

test("a mirror is named by its document's file name, a space written as -", () => {
  expect(mirrorName("https://media.steampowered.com/apps/valve/Valve_Handbook_LowRes.pdf")).toBe("Valve_Handbook_LowRes.pdf")
  // The vault's own mirror of Bonhoeffer's essay is saved under this name.
  expect(mirrorName("https://www.onthewing.org/user/Bonhoeffer%20-%20Theory%20of%20Stupidity.pdf")).toBe(
    "Bonhoeffer---Theory-of-Stupidity.pdf",
  )
})

test("a document with no file name in its address, or that is not on the web, has no mirror", () => {
  expect(mirrorName("https://example.com/")).toBeUndefined()
  expect(mirrorName("papers/On Stability.pdf")).toBeUndefined()
  expect(mirrorName("ftp://example.com/paper.pdf")).toBeUndefined()
})

// A mirror directory with one mirror saved in it, flat, as astro:mirrors saves them.
let root: string

beforeAll(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "astro-mirrors-"))
  fs.writeFileSync(path.join(root, "Valve_Handbook_LowRes.pdf"), "%PDF-1.4")
})

afterAll(() => fs.rmSync(root, { recursive: true, force: true }))

test("a document whose mirror is in the mirror directory is served from the site's, the address mirrors have always had", () => {
  expect(mirrorOf("https://media.steampowered.com/apps/valve/Valve_Handbook_LowRes.pdf", root)).toBe(
    "/assets/annotated-documents/Valve_Handbook_LowRes.pdf",
  )
  expect(mirrorFile("Valve_Handbook_LowRes.pdf", root)).toBe(path.join(root, "Valve_Handbook_LowRes.pdf"))
})

test("mirrors are kept in the repository's dist/mirrors, whichever vault the site reads: here, the fixture vault", () => {
  // The tests run from astro/, so the repository is the folder above it.
  expect(MIRRORS_ROOT).toBe(path.resolve("../dist/mirrors"))
  expect(mirrorFile("Greiner.pdf")).toBe(path.join(MIRRORS_ROOT, "Greiner.pdf"))
})

test("the repository is found from any folder in it, so the mirror directory is the same whichever folder runs the code", () => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), "astro-workspace-"))
  try {
    fs.writeFileSync(path.join(repo, "nx.json"), "{}")
    const deep = path.join(repo, "astro", "dist", ".prerender", "chunks")
    fs.mkdirSync(deep, { recursive: true })
    for (const from of [repo, path.join(repo, "astro"), deep]) {
      expect(workspaceRoot(from)).toBe(repo)
      expect(defaultMirrorsRoot(workspaceRoot(from)!)).toBe(path.join(repo, "dist", "mirrors"))
    }
    // The first folder in a repository wins; one outside every repository is passed over.
    expect(workspaceRoot(os.tmpdir(), deep)).toBe(repo)
    expect(workspaceRoot(path.parse(repo).root)).toBeUndefined()
  } finally {
    fs.rmSync(repo, { recursive: true, force: true })
  }
})

test("a document with no mirror saved is not served", () => {
  expect(mirrorOf("https://www.nature.com/articles/s41592-022-01488-1.pdf", root)).toBeUndefined()
})

// Finding a passage in the document's text: the text of each page, as PDF.js reads it.

test("a passage is found on its page, whatever whitespace the document's text has", () => {
  const pages = ["Cover", "The handbook says:\nA fearless  adventure in knowing what to do"]
  expect(findPassage(pages, { exact: "A fearless adventure in knowing" })).toEqual({ page: 1, start: 19, end: 51 })
})

test("a passage written twice in the document is told apart by the text before it", () => {
  const pages = ["Rule one: do what you like. Rule two: do what you like, carefully."]
  expect(findPassage(pages, { exact: "do what you like", prefix: "Rule two: " })).toEqual({ page: 0, start: 38, end: 54 })
})

test("a passage on two pages is found on the page its position falls on", () => {
  const pages = ["Intro. The point.", "Later. The point."]
  // Character 24 is the second page's eighth: the first page has 17.
  expect(findPassage(pages, { exact: "The point.", start: 24 })).toEqual({ page: 1, start: 7, end: 17 })
})

test("a passage the document's text spells a little differently is still found", () => {
  // PDF.js reads the ligature ﬃ as one character, where the passage was written with three.
  const pages = ["The eﬃciency of teams matters."]
  expect(findPassage(pages, { exact: "The efficiency of teams" })).toEqual({ page: 0, start: 0, end: 21 })
})

// A page 600 by 800 points, as PDF.js gives its viewport at scale 1: the PDF's y runs up from the
// bottom, the page's down from the top.
const PAGE = { width: 600, height: 800, convertToViewportPoint: (x: number, y: number) => [x, 800 - y] }

// Three runs of 10-point text: "Hello " and "world" on one line, with their baseline at y 700, and
// "Next line" on the line under it, at y 680. The page's text is "Hello worldNext line".
const TEXT = [
  { str: "Hello ", transform: [10, 0, 0, 10, 100, 700], width: 60, height: 10 },
  { str: "world", transform: [10, 0, 0, 10, 160, 700], width: 50, height: 10 },
  // A marker of PDF.js's for tagged content, which holds no text.
  { type: "beginMarkedContent" },
  { str: "Next line", transform: [10, 0, 0, 10, 100, 680], width: 90, height: 10 },
]

test("a page's text is its runs of text end to end, which a passage's offsets count in", () => {
  expect(pageText(TEXT)).toBe("Hello worldNext line")
})

test("a highlight is a box over each line of its passage, as shares of its page", () => {
  // "lo world" and "Next": characters 3 to 15.
  const boxes = highlightBoxes(TEXT, { page: 0, start: 3, end: 15 }, PAGE)
  // Each line from a fifth of its height under the baseline to its height over it: from 2 points
  // under to 10 over. The first line runs from "lo" at x 130, half of "Hello " in, to the end of
  // "world" at 210; the second over "Next", four of nine characters, from 100 to 140.
  const expected = [
    { left: 130 / 600, top: 90 / 800, width: 80 / 600, height: 12 / 800 },
    { left: 100 / 600, top: 110 / 800, width: 40 / 600, height: 12 / 800 },
  ]
  expect(boxes).toHaveLength(2)
  boxes.forEach((box, i) => {
    for (const side of ["left", "top", "width", "height"] as const) expect(box[side]).toBeCloseTo(expected[i]![side], 6)
  })
})

test("a passage that is not in the document, or is empty, is not found", () => {
  expect(findPassage(["Nothing to see here."], { exact: "Something else entirely, at length" })).toBeUndefined()
  expect(findPassage(["Nothing to see here."], { exact: "" })).toBeUndefined()
})

// What the viewer is given of an annotation page: test/fixtures/vault/annotation-viewer/on-meetings.md.

test("an annotation page's passages are its annotations' quotes, each with its id, the text either side and where it starts", () => {
  expect(annotatedPassages(getNote("annotation-viewer/on-meetings")!)).toEqual([
    {
      id: "promise",
      exact: "A meeting is a promise that the people in it will leave knowing more than they came with.",
      prefix: "with a goodreason.",
      suffix: "When that promise",
      start: 110,
    },
    {
      id: "cancel",
      exact: "Cancel any meeting that has no question to answer.",
      prefix: "what they were for.",
      suffix: "The second rule",
      start: 723,
    },
    { id: "minutes", exact: "Write down what was decided, and send it within the hour.", prefix: "who made it.", suffix: "", start: 942 },
    // Quoted from a draft the document isn't. The reply to "cancel" quotes nothing, and has none.
    { id: "draft", exact: "Every agenda is a list of hopes, in no particular order.", prefix: "", suffix: "", start: 2000 },
  ])
})

test("a document on the web is named by the file its address ends in", () => {
  expect(documentFileName("https://example.com/papers/On%20Meetings.pdf")).toBe("On Meetings.pdf")
  expect(documentFileName("https://example.com/")).toBeUndefined()
  expect(documentFileName("papers/On Meetings.pdf")).toBeUndefined()
})

test("only a PDF is saved as a mirror: a login or a bot check in its place is not", () => {
  expect(isPdf(Buffer.from("%PDF-1.4\n…"))).toBe(true)
  // Some files have a few bytes before the header, which readers allow within the first kilobyte.
  expect(isPdf(Buffer.from("\n\n%PDF-1.7"))).toBe(true)
  expect(isPdf(Buffer.from("<!doctype html><title>Just a moment…</title>"))).toBe(false)
})

test("two documents of one file name share no mirror: neither is saved", () => {
  expect(
    mirrorsToSave(["https://example.com/a/Paper.pdf", "https://example.org/b/Paper.pdf", "https://example.com/Other%20Paper.pdf"]),
  ).toEqual({
    save: ["https://example.com/Other%20Paper.pdf"],
    clashing: [["Paper.pdf", ["https://example.com/a/Paper.pdf", "https://example.org/b/Paper.pdf"]]],
  })
})
