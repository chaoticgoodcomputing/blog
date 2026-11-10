// The fake service against an annotation note kept in memory: what the sidebar is told on starting,
// and what making, editing, replying to and removing an annotation does to the note (SPEC §4–§5 of
// the web-annotations effort).

import assert from "node:assert/strict"
import { describe, test } from "node:test"
import { readNote } from "@chaoticgoodcomputing/web-annotations"
import { API_URL, createService, GROUP_ID, type NoteStore, oneNote } from "../src/service.ts"

function memoryStore(note: string): NoteStore & { note: string } {
  const store = {
    note,
    async read() {
      return store.note
    },
    async update(change: (note: string) => string) {
      store.note = change(store.note)
    },
  }
  return store
}

const TARGET = "https://example.org/paper.pdf"
const NOTE = `---
annotation-target: ${TARGET}
---

What I thought before reading it.
`

/** An annotation as the client posts one: a passage of the PDF, a comment, a tag. */
const posted = (text: string, exact = "the passage") => ({
  uri: TARGET,
  document: { title: "A paper", documentFingerprint: "abc123" },
  target: [
    {
      source: TARGET,
      selector: [
        { type: "TextPositionSelector", start: 10, end: 21 },
        { type: "TextQuoteSelector", exact, prefix: "Before ", suffix: " after" },
      ],
    },
  ],
  text,
  tags: ["idea"],
  group: GROUP_ID,
  permissions: { read: ["group:vault"], update: ["acct:obsidian@obsidian.local"], delete: ["acct:obsidian@obsidian.local"] },
  user: "acct:obsidian@obsidian.local",
})

/** Times a second apart, and block ids and UUIDs counted from 1, so a test can say what is written. */
function counting() {
  let clock = 0
  let ids = 0
  let uuids = 0
  return {
    now: () => new Date(Date.UTC(2026, 9, 28, 12, 0, clock++)).toISOString(),
    blockId: () => `block${String(++ids).padStart(6, "0")}`,
    uuid: () => `00000000-0000-4000-8000-${String(++uuids).padStart(12, "0")}`,
  }
}

function setup(note = NOTE) {
  const store = memoryStore(note)
  const service = createService({ notes: oneNote(store, { title: () => "A paper" }), mint: counting() })
  const call = async (method: string, path: string, body?: unknown) => {
    const response = await service({ method, url: API_URL + path, body: body === undefined ? undefined : JSON.stringify(body) })
    return { status: response.status, json: JSON.parse(response.body) }
  }
  return { store, call }
}

describe("starting the sidebar", () => {
  test("the index names every route the client calls", async () => {
    const { call } = setup()
    const { json } = await call("GET", "")
    for (const route of ["annotation.create", "annotation.update", "annotation.delete", "annotation.read", "search", "profile.read", "profile.groups.read", "group.read", "links"]) {
      const leaf = route.split(".").reduce((node: any, key) => node?.[key], json.links)
      assert.ok(leaf?.url?.startsWith(API_URL), `the index has ${route}`)
    }
  })

  test("links has every name the UI reads, and no websocket", async () => {
    const { json } = await setup().call("GET", "links")
    for (const name of ["user", "groups.new", "search.tag", "signup", "account.settings", "oauth.authorize", "oauth.revoke"]) {
      assert.ok(name in json, `links has ${name}`)
    }
    assert.equal(json.websocket, undefined)
    // The client fills these in, and throws on a template without its parameter.
    assert.match(json.user, /:user/)
    assert.match(json["search.tag"], /:tag/)
  })

  test("the user is logged in, in one private group, with no tutorial", async () => {
    const { call } = setup()
    const profile = (await call("GET", "profile?authority=obsidian.local")).json
    assert.equal(profile.userid, "acct:obsidian@obsidian.local")
    assert.equal(profile.preferences.show_sidebar_tutorial, false)
    const groups = (await call("GET", "profile/groups?expand=organization&expand=scopes")).json
    assert.deepEqual(groups.map((group: any) => [group.id, group.type]), [[GROUP_ID, "private"]])
    assert.equal((await call("GET", `groups/${GROUP_ID}`)).json.id, GROUP_ID)
  })

  test("the grant token is exchanged for any token", async () => {
    const { status, json } = await setup().call("POST", "token")
    assert.equal(status, 200)
    assert.equal(typeof json.access_token, "string")
    assert.ok(json.expires_in > 0)
  })

  test("a route it doesn't have is a 404", async () => {
    assert.equal((await setup().call("GET", "nothing/here")).status, 404)
  })
})

describe("annotating", () => {
  test("a new annotation is written into the note as its block, after the preface", async () => {
    const { store, call } = setup()
    const { status, json } = await call("POST", "annotations", posted("My comment"))
    assert.equal(status, 200)
    assert.equal(json.id, "block000001")
    assert.equal(json.created, "2026-10-28T12:00:00.000Z")
    const record = {
      "@context": "http://www.w3.org/ns/anno.jsonld",
      id: "urn:uuid:00000000-0000-4000-8000-000000000001",
      type: "Annotation",
      motivation: "commenting",
      body: [
        { id: "#^block000001", type: "Text", format: "text/markdown", purpose: "commenting" },
        { type: "TextualBody", value: "idea", purpose: "tagging" },
      ],
      target: posted("").target[0],
      created: "2026-10-28T12:00:00.000Z",
      modified: "2026-10-28T12:00:00.000Z",
    }
    const block = ["> [!annotation]", "> %%", "> ```annotation", `> ${JSON.stringify(record)}`, "> ```", "> %%", "> My comment", "^block000001", ""]
    assert.equal(store.note, `${NOTE}\n${block.join("\n")}`)
  })

  test("what the client is given back is the annotation as Hypothesis has it", async () => {
    const { call } = setup()
    const { json } = await call("POST", "annotations", posted("My comment"))
    assert.equal(json.text, "My comment")
    assert.deepEqual(json.tags, ["idea"])
    assert.deepEqual(json.target, posted("").target)
    assert.equal(json.uri, TARGET)
    assert.deepEqual(json.document, { title: "A paper" })
    assert.equal(json.user, "acct:obsidian@obsidian.local")
  })

  test("a passage marked with nothing said is a highlight, with no body", async () => {
    const { store, call } = setup()
    await call("POST", "annotations", { ...posted(""), tags: [] })
    const [annotation] = readNote(store.note).annotations
    assert.equal(annotation!.record.motivation, "highlighting")
    assert.equal(annotation!.record.body, undefined)
    assert.equal(annotation!.comment, "")
  })

  test("search finds the note's annotations, shown as the user's", async () => {
    const { call } = setup()
    const { json: created } = await call("POST", "annotations", posted("First"))
    const { json } = await call("GET", `search?limit=200&uri=${encodeURIComponent(TARGET)}&group=${GROUP_ID}`)
    assert.equal(json.total, 1)
    const [row] = json.rows
    assert.equal(row.id, created.id)
    assert.equal(row.text, "First")
    assert.equal(row.user, "acct:obsidian@obsidian.local")
    assert.deepEqual(row.permissions.update, ["acct:obsidian@obsidian.local"])
    assert.equal(row.group, GROUP_ID)
  })

  test("an annotation's share link is the link to it, when the vault gives one", async () => {
    const store = memoryStore(NOTE)
    const linked = createService({ notes: oneNote(store, { linkTo: (id) => `[[Papers/A paper#^${id}]]` }) })
    const call = async (path: string, body?: unknown) =>
      JSON.parse((await linked({ method: body ? "POST" : "GET", url: API_URL + path, body: body === undefined ? undefined : JSON.stringify(body) })).body)
    const created = await call("annotations", posted("First"))
    assert.deepEqual(created.links, { html: `[[Papers/A paper#^${created.id}]]` })
    assert.deepEqual((await call("search")).rows[0].links, { html: `[[Papers/A paper#^${created.id}]]` })
    // None without one: the sidebar shows no Share button.
    const { json } = await setup().call("POST", "annotations", posted("First"))
    assert.deepEqual(json.links, {})
  })

  test("the record keeps nothing of Hypothesis's own, but is shown as the user's", async () => {
    const { store, call } = setup()
    await call("POST", "annotations", posted("Old"))
    assert.doesNotMatch(store.note, /acct:obsidian|"group"|"permissions"|"document"|"uri"|"user"/)
    const [row] = (await call("GET", "search")).json.rows
    assert.deepEqual(row.permissions.delete, ["acct:obsidian@obsidian.local"])
  })

  test("editing an annotation rewrites its block, and only it", async () => {
    const { store, call } = setup()
    const { json: first } = await call("POST", "annotations", posted("First", "one passage"))
    await call("POST", "annotations", posted("Second", "another passage"))
    const before = store.note
    const spans = (note: string) => readNote(note).annotations.map((annotation) => annotation.span)
    const { json } = await call("PATCH", `annotations/${first.id}`, { ...first, text: "First, edited" })
    assert.equal(json.text, "First, edited")
    assert.equal(json.created, first.created)
    assert.notEqual(json.updated, first.updated)
    const annotations = readNote(store.note).annotations
    assert.deepEqual(annotations.map((annotation) => annotation.comment), ["First, edited", "Second"])
    assert.equal(annotations[0]!.record.id, readNote(before).annotations[0]!.record.id)
    assert.equal(annotations[0]!.record.modified, json.updated)
    // The other block, and everything before the edited one, are as they were.
    const [, second] = spans(store.note)
    const [, secondBefore] = spans(before)
    assert.equal(store.note.slice(second!.start), before.slice(secondBefore!.start))
    assert.equal(store.note.slice(0, spans(store.note)[0]!.start), before.slice(0, spans(before)[0]!.start))
  })

  test("an edit keeps what the client leaves out of it", async () => {
    const { store, call } = setup()
    const { json: first } = await call("POST", "annotations", posted("First"))
    await call("PATCH", `annotations/${first.id}`, { text: "Edited" })
    const [annotation] = (await call("GET", "search")).json.rows
    assert.deepEqual(annotation.tags, ["idea"])
    assert.deepEqual(annotation.target, posted("").target)
    assert.equal(readNote(store.note).annotations[0]!.comment, "Edited")
  })

  test("removing an annotation leaves the rest of the note as it was", async () => {
    const { store, call } = setup()
    const { json } = await call("POST", "annotations", posted("Gone soon"))
    assert.deepEqual((await call("DELETE", `annotations/${json.id}`)).json, { id: json.id, deleted: true })
    // The blank line written before the note's only block stays, in its preface.
    assert.equal(store.note, `${NOTE}\n`)
    assert.equal((await call("GET", `annotations/${json.id}`)).status, 404)
  })

  test("an annotation the note doesn't hold is not found", async () => {
    const { store, call } = setup()
    for (const method of ["GET", "PATCH", "DELETE"]) {
      assert.equal((await call(method, "annotations/nope", method === "PATCH" ? { text: "x" } : undefined)).status, 404)
    }
    assert.equal(store.note, NOTE)
  })

  test("a new annotation goes before the epilogue", async () => {
    const { store, call } = setup()
    await call("POST", "annotations", posted("First", "one passage"))
    store.note += "\nWhat I thought after.\n"
    await call("POST", "annotations", posted("Second", "another passage"))
    const note = readNote(store.note)
    assert.equal(note.annotations.length, 2)
    assert.equal(note.epilogue.trim(), "What I thought after.")
  })

  test("annotations in the old layout are not read", async () => {
    const old = `${NOTE}\n>%%\n>\`\`\`annotation-json\n>{"id":"old1","text":"Old","target":[{"source":"${TARGET}"}]}\n>\`\`\`\n>%%\n>*%%PREFIX%%Before%%HIGHLIGHT%% ==the passage== %%POSTFIX%%after*\n>%%LINK%%[[#^old1|show annotation]]\n>%%COMMENT%%\n>Old\n>%%TAGS%%\n>\n^old1\n`
    const { call } = setup(old)
    assert.equal((await call("GET", "search")).json.total, 0)
    assert.equal((await call("GET", "annotations/old1")).status, 404)
  })
})

describe("replying", () => {
  /** The reply the client posts: on the page, with no passage of its own, under its thread. */
  const reply = (text: string, references: string[]) => ({ ...posted(text), tags: [], target: [{ source: TARGET }], references })

  test("a reply is a block of its own after its thread, targeting its parent's record", async () => {
    const { store, call } = setup()
    const { json: root } = await call("POST", "annotations", posted("Root", "one passage"))
    await call("POST", "annotations", posted("Other", "another passage"))
    const { json: first } = await call("POST", "annotations", reply("First reply", [root.id]))
    const { json: second } = await call("POST", "annotations", reply("Second reply", [root.id]))
    const annotations = readNote(store.note).annotations
    assert.deepEqual(annotations.map((annotation) => annotation.comment), ["Root", "First reply", "Second reply", "Other"])
    const [rootRecord, firstRecord] = annotations.map((annotation) => annotation.record)
    assert.equal(firstRecord!.motivation, "replying")
    assert.equal(firstRecord!.target, rootRecord!.id)
    assert.deepEqual(firstRecord!.body, { id: `#^${first.id}`, type: "Text", format: "text/markdown" })
    assert.deepEqual(second.references, [root.id])
  })

  test("a reply is shown in its thread, on its root's page", async () => {
    const { call } = setup()
    const { json: root } = await call("POST", "annotations", posted("Root"))
    const { json: first } = await call("POST", "annotations", reply("Reply", [root.id]))
    const { json: nested } = await call("POST", "annotations", reply("Reply to the reply", [root.id, first.id]))
    assert.deepEqual(nested.references, [root.id, first.id])
    assert.deepEqual(nested.target, [{ source: TARGET }])
    assert.equal(nested.uri, TARGET)
  })

  test("a thread's replies are found by what they answer", async () => {
    const { call } = setup()
    const { json: root } = await call("POST", "annotations", posted("Root"))
    const { json: reply1 } = await call("POST", "annotations", reply("Reply", [root.id]))
    const { json } = await call("GET", `search?references=${root.id}`)
    assert.deepEqual(json.rows.map((row: any) => row.id), [reply1.id])
  })

  test("a reply to an annotation the note doesn't hold is not found", async () => {
    const { store, call } = setup()
    assert.equal((await call("POST", "annotations", reply("Orphan", ["nope"]))).status, 404)
    assert.equal(store.note, NOTE)
  })
})
