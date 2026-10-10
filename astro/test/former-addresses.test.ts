import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterAll, beforeAll, expect, test } from "vitest"
import { formerAddress, formerAddressRedirects, formerAttachmentAddress } from "../src/lib/former-addresses.ts"
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

test("each former address that is not the note's address forwards to the note, and the tags index's does too", () => {
  expect(formerAddressRedirects(notes)).toEqual({
    "/notes/widget.mdx": "/notes/widget",
    "/move-to-boston/timeline.mdx": "/Move-to-Boston/Timeline",
    // Only the case differs, so the redirect is written as its folder's index: on a file system
    // that ignores case, a file of its own would be the page's file.
    "/weekly/2026-w06/index": "/weekly/2026-W06",
    "/tags/index": "/tags",
  })
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

test("an alias's former address is its address in lower case, and forwards to the alias's note, from its folder's index", () => {
  const aliases = { "/widgets/README": "/plugins/quartz-mdx", "/archive/old-name": "/notes/plain" }
  expect(formerAddressRedirects([], aliases)).toEqual({
    // The alias's own address is already the redirect from `/archive/old-name`.
    "/widgets/readme/index": "/plugins/quartz-mdx",
    "/tags/index": "/tags",
  })
})

test("each attachment's former address that GitHub Pages would not serve the attachment at forwards to the attachment", () => {
  const attachments = [
    "/assets/Elkington_Resume.pdf",
    "/assets/Pasted image 20240305234056.png",
    "/assets/3UJZ/README",
    "/assets/clutter.png",
    // GitHub Pages serves `/assets/lag_figure` from `lag_figure.html`, the attachment itself.
    "/assets/lag_figure.html",
  ]
  expect(formerAddressRedirects([], {}, attachments)).toEqual({
    // Astro writes each as the file of its address with `.html` after it, `elkington_resume.pdf.html`,
    // which no file system takes for the attachment's own.
    "/assets/elkington_resume.pdf": "/assets/Elkington_Resume.pdf",
    "/assets/pasted-image-20240305234056.png": "/assets/Pasted image 20240305234056.png",
    "/assets/3ujz/readme": "/assets/3UJZ/README",
    "/tags/index": "/tags",
  })
})

test("an attachment's former address that only differs in case from an HTML attachment's forwards from its folder's index", () => {
  expect(formerAddressRedirects([], {}, ["/assets/Figure.html"])).toEqual({
    "/assets/figure/index": "/assets/Figure.html",
    "/tags/index": "/tags",
  })
})
