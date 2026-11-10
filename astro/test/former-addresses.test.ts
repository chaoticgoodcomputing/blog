import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterAll, beforeAll, expect, test } from "vitest"
import { formerAddress, formerAttachmentAddress } from "../src/lib/former-addresses.ts"
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
const note = (file: string) => notes.find((each) => each.file.path === file)!

beforeAll(async () => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "astro-former-addresses-"))
  for (const [file, contents] of Object.entries(FILES)) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
    fs.writeFileSync(path.join(root, file), contents)
  }
  notes = indexNotes(await openVault(root), []).notes
})

afterAll(() => fs.rmSync(root, { recursive: true, force: true }))

test("a note's former address is its address in lower case, and an MDX note's with .mdx after it", () => {
  expect(formerAddress(note("index.md"))).toBe("/")
  expect(formerAddress(note("notes/plain.md"))).toBe("/notes/plain")
  expect(formerAddress(note("notes/widget.mdx"))).toBe("/notes/widget.mdx")
  expect(formerAddress(note("weekly/2026-W06.md"))).toBe("/weekly/2026-w06")
  expect(formerAddress(note("Move to Boston/Timeline.mdx"))).toBe("/move-to-boston/timeline.mdx")
})


test("an attachment's former address is its path as the Quartz site slugged it: lower case, a space as -, and an HTML file without .html", () => {
  expect(formerAttachmentAddress("/assets/Elkington_Resume.pdf")).toBe("/assets/elkington_resume.pdf")
  expect(formerAttachmentAddress("/assets/Pasted image 20240305234056.png")).toBe(
    "/assets/pasted-image-20240305234056.png",
  )
  expect(formerAttachmentAddress("/assets/3UJZ/README")).toBe("/assets/3ujz/readme")
  expect(formerAttachmentAddress("/assets/lag_figure.html")).toBe("/assets/lag_figure")
  expect(formerAttachmentAddress("/assets/clutter.png")).toBe("/assets/clutter.png")
})




