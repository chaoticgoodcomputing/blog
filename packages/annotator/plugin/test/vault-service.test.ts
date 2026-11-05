// The local service's API against a vault of notes kept in memory: which note a request goes to, by
// its page or its annotation, and the note a page's first annotation makes.

import assert from "node:assert/strict"
import { describe, test } from "node:test"
import { parseNote } from "@chaoticgoodcomputing/annotator-format"
import { createVaultService, newNote, normalizeAddress, noteName, type Page, type VaultNotes } from "../src/vault-service.ts"

const API = "http://127.0.0.1:27183/api/"
const PAGE = "https://en.wikipedia.org/wiki/Pickle"
const PDF = "https://example.org/paper.pdf"

const note = (target: string, body = "") => `---\nannotation-target: ${target}\n---\n${body}`

/** A vault of notes by path, the targets read from their properties as Obsidian's index would. */
function memoryVault(files: Record<string, string>) {
  const created: Page[] = []
  const notes: VaultNotes = {
    list: () =>
      Object.entries(files).flatMap(([path, text]) => {
        const target = /^annotation-target: "?([^"\n]+)"?$/m.exec(text)?.[1]
        return target ? [{ path, target }] : []
      }),
    store: (path) => ({
      read: async () => files[path]!,
      update: async (change) => void (files[path] = change(files[path]!)),
    }),
    create: async (page) => {
      created.push(page)
      const path = `new/${noteName(page)}.md`
      files[path] = newNote(page, "2026-11-05")
      return path
    },
    linkTo: (path, id) => `[[${path}#^${id}]]`,
  }
  return { files, created, notes }
}

function setup(files: Record<string, string>) {
  const vault = memoryVault(files)
  const service = createVaultService({ notes: vault.notes, apiUrl: API, now: () => "2026-11-05T12:00:00.000Z" })
  const call = async (method: string, path: string, body?: unknown) => {
    const response = await service({ method, url: API + path, body: body === undefined ? undefined : JSON.stringify(body) })
    return { status: response.status, json: JSON.parse(response.body) }
  }
  return { ...vault, call }
}

const posted = (uri: string, text: string, extra: Record<string, unknown> = {}) => ({
  uri,
  document: { title: "Pickle - Wikipedia", link: [{ href: uri }] },
  target: [{ source: uri, selector: [{ type: "TextQuoteSelector", exact: "Pickle" }] }],
  text,
  tags: [],
  ...extra,
})

const search = (...uris: string[]) => `search?group=vault&${uris.map((uri) => `uri=${encodeURIComponent(uri)}`).join("&")}`

describe("normalizeAddress", () => {
  test("two addresses of one page compare equal", () => {
    assert.equal(normalizeAddress("HTTPS://En.Wikipedia.org/wiki/Pickle/#History"), normalizeAddress(PAGE))
  })
  test("an address that is not a URL is kept as it is", () => {
    assert.equal(normalizeAddress("urn:x-pdf:abc123"), "urn:x-pdf:abc123")
  })
})

describe("a page's annotations", () => {
  test("come from the note whose target is the page", async () => {
    const { call, files } = setup({ "a.md": note(PDF), "pickle.md": note(PAGE) })
    await call("POST", "annotations", posted(PAGE, "Brined"))
    const { json } = await call("GET", search(PAGE))
    assert.equal(json.total, 1)
    assert.equal(json.rows[0].text, "Brined")
    assert.equal(parseNote(files["a.md"]!).annotations.length, 0)
  })

  test("are found by any of the page's addresses: a canonical link, a fragment", async () => {
    const { call } = setup({ "pickle.md": note(PAGE) })
    await call("POST", "annotations", posted(PAGE, "Brined"))
    const { json } = await call("GET", search("https://en.m.wikipedia.org/wiki/Pickle", `${PAGE}#Food`))
    assert.equal(json.total, 1)
  })

  test("are none for a page with no note, which makes none", async () => {
    const { call, created } = setup({ "pickle.md": note(PAGE) })
    const { json } = await call("GET", search("https://example.com/"))
    assert.deepEqual(json, { total: 0, rows: [] })
    assert.equal(created.length, 0)
  })

  test("of a PDF opened in the browser are its note's, as Obsidian annotates it", async () => {
    const { call } = setup({ "paper.md": note(PDF) })
    await call("POST", "annotations", posted(PDF, "From Obsidian"))
    const { json } = await call("GET", search(PDF, "urn:x-pdf:abc123"))
    assert.equal(json.rows[0].text, "From Obsidian")
  })

  test("count on the toolbar's badge", async () => {
    const { call } = setup({ "pickle.md": note(PAGE) })
    await call("POST", "annotations", posted(PAGE, "One"))
    await call("POST", "annotations", posted(PAGE, "Two"))
    assert.deepEqual((await call("GET", `badge?uri=${encodeURIComponent(PAGE)}`)).json, { total: 2 })
    assert.deepEqual((await call("GET", `badge?uri=${encodeURIComponent("https://example.com/")}`)).json, { total: 0 })
  })
})

describe("a page's first annotation", () => {
  test("makes its note, named by its title, which the next one goes to", async () => {
    const { call, files, created } = setup({})
    await call("POST", "annotations", posted(PAGE, "First"))
    await call("POST", "annotations", posted(PAGE, "Second"))
    assert.deepEqual(created, [{ uri: PAGE, title: "Pickle - Wikipedia" }])
    const made = files["new/Pickle - Wikipedia.md"]!
    assert.match(made, /^annotation-target: "https:\/\/en.wikipedia.org\/wiki\/Pickle"$/m)
    assert.deepEqual(
      parseNote(made).annotations.map((annotation) => annotation.text),
      ["First", "Second"],
    )
  })

  test("goes to an existing note that names the page by another address", async () => {
    const { call, created } = setup({ "pickle.md": note(PAGE) })
    await call("POST", "annotations", posted(`${PAGE}#Food`, "Here", { document: { link: [{ href: PAGE }] } }))
    assert.equal(created.length, 0)
  })

  test("that names no page is refused", async () => {
    const { call } = setup({})
    assert.equal((await call("POST", "annotations", { text: "Nowhere" })).status, 400)
  })
})

describe("an annotation, by its id", () => {
  test("is edited and removed in the note that holds it", async () => {
    const { call, files } = setup({ "a.md": note(PDF), "pickle.md": note(PAGE) })
    const { json: made } = await call("POST", "annotations", posted(PAGE, "Draft"))
    assert.equal((await call("PATCH", `annotations/${made.id}`, { text: "Final" })).json.text, "Final")
    assert.equal(parseNote(files["pickle.md"]!).annotations[0]!.text, "Final")
    await call("DELETE", `annotations/${made.id}`)
    assert.equal(parseNote(files["pickle.md"]!).annotations.length, 0)
  })

  test("that no note holds is not found", async () => {
    const { call } = setup({ "pickle.md": note(PAGE) })
    assert.equal((await call("GET", "annotations/nope")).status, 404)
  })

  test("links to its note, for the sidebar's Share button", async () => {
    const { call } = setup({ "pickle.md": note(PAGE) })
    const { json } = await call("POST", "annotations", posted(PAGE, "Shared"))
    assert.equal(json.links.html, `[[pickle.md#^${json.id}]]`)
  })
})

describe("what names no note", () => {
  test("is answered as the fake service answers it, at the service's address", async () => {
    const { call } = setup({})
    const index = await call("GET", "")
    assert.equal(index.json.links.search.url, `${API}search`)
    assert.equal((await call("GET", "profile")).json.userid, "acct:obsidian@obsidian.local")
  })
})

describe("a new note", () => {
  test("is named by the page's title, without what a file name can't hold", () => {
    assert.equal(noteName({ uri: PAGE, title: 'Pickles: a "history" / part 1' }), "Pickles a history part 1")
  })
  test("is named by the page's address when it has no title", () => {
    assert.equal(noteName({ uri: "https://example.com/a/b/" }), "example.com a b")
  })
  test("has the annotation template's properties", () => {
    assert.equal(
      newNote({ uri: PAGE, title: "Pickle: a food" }, "2026-11-05"),
      `---\ntitle: "Pickle: a food"\ndate: 2026-11-05\ntags:\n  - writing/annotations\nannotation-target: "${PAGE}"\n---\n`,
    )
  })
})
