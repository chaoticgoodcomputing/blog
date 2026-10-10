import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import type { Vault } from "@chaoticgoodcomputing/obsidian-markdown"
import { afterAll, beforeAll, expect, test } from "vitest"
import {
  drawingExports,
  drawingExportUrl,
  getDrawingExports,
  readDrawingExport,
  unexportedDrawings,
} from "../src/lib/drawings.ts"
import { getNote, getNotes, getUnpublished, indexNotes, isPublished, tagsOf, urlOf } from "../src/lib/notes.ts"
import { getVault, openVault } from "../src/lib/vault.ts"

// The fixture vault's drawings are under drawings/: `loop`, with a light and a dark export, and
// `single`, with one. `post` embeds both.

test("a drawing's note has no page, and is still a note of the vault", () => {
  expect(getNote("drawings/loop")).toBeUndefined()
  expect(getNotes().map((note) => note.id)).not.toContain("drawings/loop")
  expect(isPublished("drawings/loop.md")).toBe(false)
  expect(getUnpublished("drawing").map((note) => note.file.path)).toEqual(
    expect.arrayContaining(["drawings/loop.md", "drawings/single.md"]),
  )
  expect(getNote("drawings/post")!.url).toBe("/drawings/post")
})

test("a link to a drawing goes nowhere, since it has no page to go to", () => {
  expect(urlOf(getVault().getFileByPath("drawings/loop.md")!)).toBeUndefined()
})

test("the tag every drawing carries is not a tag of the site", () => {
  expect([...tagsOf(getNotes()).keys()]).not.toContain("excalidraw")
  expect([...tagsOf(getNotes()).keys()]).toContain("engineering")
})

test("a drawing's export is published under /drawings, at its path in the vault as a slug", () => {
  const file = (filePath: string) => ({ path: filePath, name: "", basename: "", extension: "svg" })
  expect(drawingExportUrl(file("assets/doodles/panic-01-engineering-loop.light.svg"))).toBe(
    "/drawings/assets/doodles/panic-01-engineering-loop.light.svg",
  )
  expect(drawingExportUrl(file("assets/My Doodles/R&D loop.svg"))).toBe("/drawings/assets/My-Doodles/R-and-D-loop.svg")
})

test("the site publishes every export of every drawing", () => {
  expect(getDrawingExports().map((each) => [each.file.path, each.url])).toEqual(
    expect.arrayContaining([
      ["drawings/loop.light.svg", "/drawings/drawings/loop.light.svg"],
      ["drawings/loop.dark.svg", "/drawings/drawings/loop.dark.svg"],
      ["drawings/single.svg", "/drawings/drawings/single.svg"],
    ]),
  )
})

test("an export is published without the canvas it was drawn on", () => {
  const light = getDrawingExports().find((each) => each.file.path === "drawings/loop.light.svg")!
  expect(readDrawingExport(light.file)).toBe(
    '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" width="200" height="100" class="excalidraw-svg">' +
      "<!-- svg-source:excalidraw --><metadata></metadata><defs></defs>" +
      '<g stroke-linecap="round" transform="translate(60 10)"><rect x="0" y="0" width="80" height="80" rx="8" fill="#1971c2"></rect></g></svg>',
  )
})

// A vault of this file's own, for what is asked of a whole vault.
const DRAWING = "---\n\nexcalidraw-plugin: parsed\ntags: [excalidraw]\n\n---\n\n# Excalidraw Data\n"
const FILES: Record<string, string> = {
  "index.md": "---\ntitle: Home\ntags: [garden]\n---\n\n![[sketch]] and [[sketch]].\n",
  "art/sketch.md": DRAWING,
  "art/sketch.svg": "<svg xmlns='http://www.w3.org/2000/svg'/>",
  "art/about-excalidraw.md": "---\ntitle: About Excalidraw\ntags: [excalidraw]\n---\n\nA note about drawing, which is no drawing.\n",
  "art/draft.md": DRAWING,
  "art/unfinished.md": DRAWING,
  "notes/plans.md": "---\ntitle: Plans\n---\n\n![[unfinished|The plan]], and a link to [[draft]].\n",
}

let root: string
let vault: Vault

beforeAll(async () => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "astro-drawings-"))
  for (const [file, contents] of Object.entries(FILES)) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
    fs.writeFileSync(path.join(root, file), contents)
  }
  vault = await openVault(root)
})

afterAll(() => fs.rmSync(root, { recursive: true, force: true }))

test("the site's own rules take a drawing out of publication, and no other note", () => {
  const index = indexNotes(vault)
  expect(index.notes.map((note) => note.id)).toEqual(["art/about-excalidraw", "index", "notes/plans"])
  expect(index.unpublished.get("drawing")!.map((note) => [note.file.path, note.url])).toEqual([
    ["art/draft.md", undefined],
    ["art/sketch.md", undefined],
    ["art/unfinished.md", undefined],
  ])
  expect(index.urlOf(vault.getFileByPath("art/sketch.md")!)).toBeUndefined()
})

test("a drawing a note embeds with no export beside it is named, with the note that embeds it", () => {
  // `draft` has no export either, but no note embeds it, so nothing is missing from any page.
  expect(unexportedDrawings(vault)).toEqual([{ drawing: "art/unfinished.md", embeddedBy: ["notes/plans.md"] }])
})

test("the exports are not listed while a note embeds a drawing that has none, which fails the build", () => {
  const drawings = indexNotes(vault).unpublished.get("drawing")!
  expect(() => drawingExports(vault, drawings)).toThrow(
    "These Excalidraw drawings are embedded, and have no exported SVG beside them:\n" +
      "  art/unfinished.md, embedded by notes/plans.md\n",
  )
})

test("where nothing is to fail, as on the dev server, the exports there are listed all the same", () => {
  const drawings = indexNotes(vault).unpublished.get("drawing")!
  expect(drawingExports(vault, drawings, { strict: false }).map((each) => [each.file.path, each.url])).toEqual([
    ["art/sketch.svg", "/drawings/art/sketch.svg"],
  ])
})
