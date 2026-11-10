// The local service's API against a vault of notes kept in memory: which note a request goes to, by
// its page or its annotation, how few notes it reads to find it, and the note a page's first
// annotation makes.

import assert from "node:assert/strict"
import { describe, test } from "node:test"
import { AnnotationPropertyError, readNote } from "@chaoticgoodcomputing/web-annotations"
import { newNote, notePath, pageVariables } from "../src/new-notes.ts"
import { createVaultService, normalizeAddress, type Page, type VaultNotes } from "../src/vault-service.ts"

const API = "http://127.0.0.1:27183/api/"
const PAGE = "https://en.wikipedia.org/wiki/Pickle"
const PDF = "https://example.org/paper.pdf"

const note = (target: string, body = "") => `---\nannotation-target: ${target}\n---\n${body}`

/**
 * A vault of notes by path, the targets and block ids read from them as Obsidian's index would. The
 * index of block ids is behind the notes until `reindex()`, as Obsidian's is a moment behind a write.
 */
function memoryVault(files: Record<string, string>) {
  const created: Page[] = []
  /** The paths read, in order. */
  const reads: string[] = []
  let blockIndex = new Map<string, string[]>()
  const reindex = () => {
    blockIndex = new Map()
    for (const [path, text] of Object.entries(files)) {
      for (const [, id] of text.matchAll(/^\^([A-Za-z0-9-]+)$/gm)) blockIndex.set(id!, [...(blockIndex.get(id!) ?? []), path])
    }
  }
  const notes: VaultNotes = {
    list: () =>
      Object.entries(files).flatMap(([path, text]) => {
        const properties = readNote(text).properties
        return properties && !(properties instanceof AnnotationPropertyError) ? [{ path, target: properties.target }] : []
      }),
    withBlock: (id) => blockIndex.get(id) ?? [],
    store: (path) => ({
      read: async () => {
        reads.push(path)
        if (!(path in files)) throw new Error(`No note ${path}`)
        return files[path]!
      },
      update: async (change) => {
        if (!(path in files)) throw new Error(`No note ${path}`)
        files[path] = change(files[path]!)
      },
    }),
    create: async (page) => {
      created.push(page)
      const path = `${notePath("new/{title}", pageVariables(page, "2026-11-05"))}.md`
      files[path] = newNote(page, "2026-11-05")
      return path
    },
    linkTo: (path, id) => `[[${path}#^${id}]]`,
  }
  /** Moves a note, as renaming it in Obsidian does; the index follows. */
  const rename = (from: string, to: string) => {
    files[to] = files[from]!
    delete files[from]
    reindex()
  }
  return { files, created, notes, reads, reindex, rename }
}

function setup(files: Record<string, string>) {
  const vault = memoryVault(files)
  const service = createVaultService({ notes: vault.notes, apiUrl: API, mint: { now: () => "2026-11-05T12:00:00.000Z" } })
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
    assert.equal(readNote(files["a.md"]!).annotations.length, 0)
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
    assert.deepEqual(created, [{ uri: PAGE, title: "Pickle - Wikipedia", pdf: false }])
    const made = files["new/Pickle - Wikipedia.md"]!
    assert.match(made, /^annotation-target: "https:\/\/en.wikipedia.org\/wiki\/Pickle"$/m)
    assert.deepEqual(
      readNote(made).annotations.map((annotation) => annotation.comment),
      ["First", "Second"],
    )
  })

  test("of a PDF in the browser makes a PDF's note, which Obsidian can show", async () => {
    const { call, files, created } = setup({})
    await call("POST", "annotations", posted(PDF, "First", { document: { title: "Paper", link: [{ href: PDF }, { href: "urn:x-pdf:abc123" }] } }))
    assert.equal(created[0]!.pdf, true)
    assert.doesNotMatch(files["new/Paper.md"]!, /annotation-target-type/)
  })

  test("of a web page makes a web page's note", async () => {
    const { call, files } = setup({})
    await call("POST", "annotations", posted(PAGE, "First"))
    assert.match(files["new/Pickle - Wikipedia.md"]!, /^annotation-target-type: web$/m)
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
    const { call, files, reindex } = setup({ "a.md": note(PDF), "pickle.md": note(PAGE) })
    const { json: made } = await call("POST", "annotations", posted(PAGE, "Draft"))
    reindex()
    assert.equal((await call("PATCH", `annotations/${made.id}`, { text: "Final" })).json.text, "Final")
    assert.equal(readNote(files["pickle.md"]!).annotations[0]!.comment, "Final")
    await call("DELETE", `annotations/${made.id}`)
    assert.equal(readNote(files["pickle.md"]!).annotations.length, 0)
  })

  test("that no note holds is not found", async () => {
    const { call } = setup({ "pickle.md": note(PAGE) })
    await call("POST", "annotations", posted(PAGE, "Draft"))
    assert.equal((await call("GET", "annotations/nope")).status, 404)
  })

  test("is found by reading only the note that holds it", async () => {
    const { call, reads, reindex } = setup({ "a.md": note(PDF), "b.md": note("https://example.com/"), "pickle.md": note(PAGE) })
    const { json: made } = await call("POST", "annotations", posted(PAGE, "Draft"))
    reindex()
    reads.length = 0
    await call("PATCH", `annotations/${made.id}`, { text: "Final" })
    assert.deepEqual([...new Set(reads)], ["pickle.md"])
    reads.length = 0
    assert.equal((await call("GET", "annotations/nope")).status, 404)
    assert.deepEqual(reads, [])
  })

  test("is found in a note just written, before the vault's index has it", async () => {
    const { call, files } = setup({ "pickle.md": note(PAGE) })
    const { json: made } = await call("POST", "annotations", posted(PAGE, "Draft"))
    assert.equal((await call("PATCH", `annotations/${made.id}`, { text: "Final" })).status, 200)
    assert.equal(readNote(files["pickle.md"]!).annotations[0]!.comment, "Final")
  })

  test("is found in its note after the note is renamed", async () => {
    const { call, files, rename } = setup({ "pickle.md": note(PAGE) })
    const { json: made } = await call("POST", "annotations", posted(PAGE, "Draft"))
    rename("pickle.md", "food/pickle.md")
    const { status, json } = await call("PATCH", `annotations/${made.id}`, { text: "Final" })
    assert.equal(status, 200)
    assert.equal(json.links.html, `[[food/pickle.md#^${made.id}]]`)
    assert.equal(readNote(files["food/pickle.md"]!).annotations[0]!.comment, "Final")
    assert.deepEqual(Object.keys(files), ["food/pickle.md"])
  })

  test("is answered in its thread, from the note that holds it", async () => {
    const { call, files, reindex } = setup({ "pickle.md": note(PAGE) })
    const { json: root } = await call("POST", "annotations", posted(PAGE, "Root"))
    reindex()
    // The reply names the page by another address; it goes where its parent is.
    const { json: reply } = await call("POST", "annotations", posted("https://example.com/elsewhere", "Reply", { target: [{ source: PAGE }], references: [root.id] }))
    assert.deepEqual(reply.references, [root.id])
    assert.deepEqual(readNote(files["pickle.md"]!).annotations.map((annotation) => annotation.comment), ["Root", "Reply"])
    reindex()
    const { json } = await call("GET", `search?references=${root.id}`)
    assert.deepEqual(json.rows.map((row: any) => row.id), [reply.id])
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

describe("the sidebar's logo", () => {
  test("is the group's organization's, when there is one", async () => {
    const vault = memoryVault({})
    const service = createVaultService({ notes: vault.notes, apiUrl: API, logo: "data:image/svg+xml,logo" })
    const groups = JSON.parse((await service({ method: "GET", url: `${API}groups?expand=organization` })).body)
    assert.equal(groups[0].organization.logo, "data:image/svg+xml,logo")
  })
  test("is the client's own without one", async () => {
    const { call } = setup({})
    assert.equal((await call("GET", "groups")).json[0].organization, null)
  })
})
