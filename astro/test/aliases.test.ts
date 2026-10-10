import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterAll, beforeAll, expect, test, vi } from "vitest"
import { aliasAddress, aliasRedirects, getAliasRedirects, publishedFiles } from "../src/lib/aliases.ts"
import { getNote, getNotes, indexNotes, urlOf, type Note, type Unpublished } from "../src/lib/notes.ts"
import { getVault, openVault } from "../src/lib/vault.ts"

test("an alias's address is the one a note at that path would have", () => {
  expect(aliasAddress("writing/notes/typst-resume-template")).toBe("/writing/notes/typst-resume-template")
  expect(aliasAddress("Old Name & Co")).toBe("/Old-Name--and--Co")
  expect(aliasAddress("/archive/old-name.md")).toBe("/archive/old-name")
  expect(aliasAddress("archive/index")).toBe("/archive")
})

test("an alias's address is on the site, however the alias is written", () => {
  expect(aliasAddress("../../elsewhere/")).toBe("/elsewhere")
  expect(aliasAddress("./archive//old-name")).toBe("/archive/old-name")
})

// A vault of this file's own, for what is asked of a whole vault.
const FILES: Record<string, string> = {
  "index.md": "---\ntitle: Home\n---\n\nHome.\n",
  "notes/moved.md": "---\naliases:\n  - Old Name\n  - archive/moved\n---\n\nMoved.\n",
  "notes/one-line.md": "---\naliases: first, second/name\ntags: [garden/seasons]\n---\n\nOne line.\n",
  "notes/plain.md": "---\ntitle: Plain\n---\n\nNo alias.\n",
  "notes/taker.md": "---\naliases: [notes/plain, NOTES/Plain, tags/garden, '404', index, Old Name, fresh]\n---\n\nTaker.\n",
  "notes/drawing.md": "---\nkind: drawing\naliases: [sketch]\n---\n\nNot a page.\n",
}

let root: string
let notes: Note[]

beforeAll(async () => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "astro-aliases-"))
  for (const [file, contents] of Object.entries(FILES)) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
    fs.writeFileSync(path.join(root, file), contents)
  }
  const rules: Unpublished[] = [{ reason: "drawing", test: (_file, cache) => cache.frontmatter?.kind === "drawing" }]
  notes = indexNotes(await openVault(root), rules).notes
})

afterAll(() => fs.rmSync(root, { recursive: true, force: true }))

test("each alias of a note is an address that redirects to the note", () => {
  expect(aliasRedirects(notes).redirects).toMatchObject({
    "/Old-Name": "/notes/moved",
    "/archive/moved": "/notes/moved",
    "/first": "/notes/one-line",
    "/second/name": "/notes/one-line",
    "/fresh": "/notes/taker",
  })
})

test("a note with no page has no address to redirect to", () => {
  expect(aliasRedirects(notes).redirects).not.toHaveProperty("/sketch")
})

test("an alias that is the address of a page gets no redirect, and is reported", () => {
  const { redirects, collisions } = aliasRedirects(notes, ["/404"])
  expect(Object.keys(redirects).sort()).toEqual(["/Old-Name", "/archive/moved", "/first", "/fresh", "/second/name"])
  expect(redirects["/Old-Name"]).toBe("/notes/moved")
  expect(collisions).toEqual([
    { file: "notes/taker.md", alias: "notes/plain", address: "/notes/plain", holder: "the page of notes/plain.md" },
    { file: "notes/taker.md", alias: "NOTES/Plain", address: "/NOTES/Plain", holder: "the page of notes/plain.md" },
    { file: "notes/taker.md", alias: "tags/garden", address: "/tags/garden", holder: "the page of the tag garden" },
    { file: "notes/taker.md", alias: "404", address: "/404", holder: "a page of the site" },
    { file: "notes/taker.md", alias: "index", address: "/", holder: "the page of index.md" },
    { file: "notes/taker.md", alias: "Old Name", address: "/Old-Name", holder: "an alias of notes/moved.md" },
  ])
})

test("an alias that is the address of a file the site publishes gets no redirect, and is reported", () => {
  const { redirects, collisions } = aliasRedirects(notes, [], ["/fresh", "/drawings/sketch.svg"])
  expect(redirects).not.toHaveProperty("/fresh")
  expect(collisions).toContainEqual({
    file: "notes/taker.md",
    alias: "fresh",
    address: "/fresh",
    holder: "a file the site publishes",
  })
})

// The site's own notes are the fixture vault's (vitest.config.ts): this feature's are under aliases/.

test("the site's files are the addresses of its drawings' exports, its attachments and its public folder", () => {
  expect(publishedFiles()).toEqual(
    expect.arrayContaining([
      "/drawings/drawings/single.svg",
      "/attachments/files/structure.pdb",
      "/attachments/files/Field Report.pdf",
      "/robots.txt",
      "/favicon.ico",
    ]),
  )
})

test("the site's alias redirects are its notes', and none takes the address of one of its pages", () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
  try {
    const redirects = getAliasRedirects()
    expect(redirects).toMatchObject({
      "/aliases/Old-Name": "/aliases/renamed",
      "/archive/old-name": "/aliases/renamed",
    })
    expect(redirects).not.toHaveProperty("/content/notes/alpha")
    expect(redirects).not.toHaveProperty("/404")
    expect(redirects).not.toHaveProperty("/drawings/drawings/single.svg")
    expect(redirects).not.toHaveProperty("/robots.txt")
    const warnings = warn.mock.calls.map((call) => String(call[0]))
    expect(warnings).toContainEqual(expect.stringContaining('aliases/renamed.md: the alias "content/notes/alpha"'))
    expect(warnings).toContainEqual(expect.stringContaining('aliases/renamed.md: the alias "404"'))
    expect(warnings).toContainEqual(
      expect.stringContaining('aliases/renamed.md: the alias "drawings/drawings/single.svg" has no redirect'),
    )
    expect(warnings).toContainEqual(expect.stringContaining('aliases/renamed.md: the alias "robots.txt" has no redirect'))
  } finally {
    warn.mockRestore()
  }
})

test("an alias redirect is no note, so nothing that lists notes lists one", () => {
  expect(getNote("archive/old-name")).toBeUndefined()
  expect(getNotes().map((note) => note.url)).not.toContain("/archive/old-name")
  expect(getNotes().map((note) => note.url)).not.toContain("/aliases/Old-Name")
})

test("a link written to an alias goes to the note's page", () => {
  const { metadataCache } = getVault()
  const linked = metadataCache.getFirstLinkpathDest("archive/old-name", "aliases/links.md")
  expect(linked && urlOf(linked)).toBe("/aliases/renamed")
  expect([...metadataCache.getBacklinksForFile("aliases/renamed.md").keys()]).toEqual(["aliases/links.md"])
})
