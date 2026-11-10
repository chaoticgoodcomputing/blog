import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterAll, beforeAll, expect, test } from "vitest"
import { addressMap, toAstroRedirects } from "../src/lib/addresses.ts"
import { indexNotes, type Note } from "../src/lib/notes.ts"
import { openVault } from "../src/lib/vault.ts"

// A vault of this file's own, with a note of each kind whose address the Quartz site wrote another
// way: an MDX note, a name with capitals, and both.
const FILES: Record<string, string> = {
  "index.md": "---\ntitle: Home\n---\n\nHome.\n",
  "notes/plain.md": "---\ntitle: Plain\n---\n\nAn address that has not moved.\n",
  "notes/widget.mdx": "---\ntitle: Widget\n---\n\nAn MDX note.\n",
  "weekly/2026-W06.md": "---\ntitle: Week six\n---\n\nA name with a capital.\n",
  "Move to Boston/Timeline.mdx": "---\ntitle: Timeline\n---\n\nCapitals, a space, and MDX.\n",
}

let root: string
let notes: Note[]

beforeAll(async () => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "astro-addresses-"))
  for (const [file, contents] of Object.entries(FILES)) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
    fs.writeFileSync(path.join(root, file), contents)
  }
  notes = indexNotes(await openVault(root), []).notes
})

afterAll(() => fs.rmSync(root, { recursive: true, force: true }))

test("a former address that differs from its note's only in case leads to the note", () => {
  expect(addressMap({ notes }).resolve("/weekly/2026-w06")).toBe("/weekly/2026-W06")
})

test("an alias leads to its note, and so does the alias in lower case, as the Quartz site wrote it", () => {
  const map = addressMap({ notes, aliases: { "/Archive/Old-Name": "/notes/plain" } })
  expect(map.resolve("/Archive/Old-Name")).toBe("/notes/plain")
  expect(map.resolve("/archive/old-name")).toBe("/notes/plain")
})

test("an attachment's former address, slugged and in lower case, leads to the attachment", () => {
  const map = addressMap({ notes, attachments: ["/assets/Pasted image 20240305234056.png"] })
  expect(map.resolve("/assets/pasted-image-20240305234056.png")).toBe("/assets/Pasted image 20240305234056.png")
})

test("Astro's redirects write a former address that differs from its page's only in case at its folder's index, and give each page a trailing-slash redirect", () => {
  const pages = notes.map((note) => note.url)
  expect(toAstroRedirects(addressMap({ notes }), { pages })).toEqual({
    "/notes/widget.mdx": "/notes/widget",
    "/move-to-boston/timeline.mdx": "/Move-to-Boston/Timeline",
    // On a file system that ignores case, `weekly/2026-w06.html` would be the page's own file.
    "/weekly/2026-w06/index": "/weekly/2026-W06",
    "/tags/index": "/tags",
    "/notes/plain/index": "/notes/plain",
    "/notes/widget/index": "/notes/widget",
    "/weekly/2026-W06/index": "/weekly/2026-W06",
    "/Move-to-Boston/Timeline/index": "/Move-to-Boston/Timeline",
  })
})

test("an alias's lower-case former address is written at its folder's index, since the alias's own redirect page has its file's name but for case", () => {
  const aliases = { "/widgets/README": "/plugins/quartz-mdx", "/archive/old-name": "/notes/plain" }
  expect(toAstroRedirects(addressMap({ notes: [], aliases }), { pages: [] })).toEqual({
    "/widgets/README": "/plugins/quartz-mdx",
    "/archive/old-name": "/notes/plain",
    "/widgets/readme/index": "/plugins/quartz-mdx",
    "/tags/index": "/tags",
    "/widgets/README/index": "/plugins/quartz-mdx",
    "/archive/old-name/index": "/notes/plain",
  })
})

test("an attachment's former address is written as it is, where its redirect page's file can't be taken for the attachment's", () => {
  const attachments = [
    "/assets/Elkington_Resume.pdf",
    "/assets/Pasted image 20240305234056.png",
    "/assets/3UJZ/README",
    "/assets/clutter.png",
    // GitHub Pages serves `/assets/lag_figure` from `lag_figure.html`, the attachment itself.
    "/assets/lag_figure.html",
  ]
  expect(toAstroRedirects(addressMap({ notes: [], attachments }), { pages: [], files: attachments })).toEqual({
    // Astro writes each as `elkington_resume.pdf.html`, which no file system takes for the attachment.
    "/assets/elkington_resume.pdf": "/assets/Elkington_Resume.pdf",
    "/assets/pasted-image-20240305234056.png": "/assets/Pasted image 20240305234056.png",
    "/assets/3ujz/readme": "/assets/3UJZ/README",
    "/tags/index": "/tags",
    "/assets/3ujz/readme/index": "/assets/3UJZ/README",
  })
})

test("an attachment's former address that differs only in case from an HTML attachment's is written at its folder's index", () => {
  const attachments = ["/assets/Figure.html"]
  expect(toAstroRedirects(addressMap({ notes: [], attachments }), { pages: [], files: attachments })).toEqual({
    "/assets/figure/index": "/assets/Figure.html",
    "/tags/index": "/tags",
  })
})

test("an alias of an MDX note has a former address with .mdx after it too, as the note had where it was", () => {
  const aliases = { "/archive/old-widget": "/notes/widget", "/archive/old-plain": "/notes/plain" }
  const map = addressMap({ notes, aliases })
  expect(map.resolve("/archive/old-widget.mdx")).toBe("/notes/widget")
  expect(map.forwards).not.toHaveProperty("/archive/old-plain.mdx")
})
