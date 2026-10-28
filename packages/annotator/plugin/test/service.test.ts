// The fake service against an annotation note kept in memory: what the sidebar is told on starting,
// and what making, editing and removing an annotation does to the note.

import assert from "node:assert/strict"
import { describe, test } from "node:test"
import { parseNote } from "@chaoticgoodcomputing/annotator-format"
import { API_URL, createService, GROUP_ID, type NoteStore } from "../src/service.ts"

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

function setup(note = NOTE) {
  const store = memoryStore(note)
  let clock = 0
  const service = createService({ store, now: () => new Date(Date.UTC(2026, 9, 28, 12, 0, clock++)).toISOString() })
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
  test("a new annotation is written into the note, after the preface", async () => {
    const { store, call } = setup()
    const { status, json } = await call("POST", "annotations", posted("My comment"))
    assert.equal(status, 200)
    assert.match(json.id, /^[a-z0-9]+$/)
    assert.equal(json.created, "2026-10-28T12:00:00.000Z")
    const note = parseNote(store.note)
    assert.equal(store.note.slice(0, note.preface.end).trimEnd(), NOTE.trimEnd())
    assert.deepEqual(note.annotations.map((annotation) => [annotation.id, annotation.text]), [[json.id, "My comment"]])
  })

  test("search finds the note's annotations, shown as the user's", async () => {
    const { call } = setup()
    const { json: created } = await call("POST", "annotations", posted("First"))
    const { json } = await call("GET", `search?limit=200&uri=${encodeURIComponent(TARGET)}&group=${GROUP_ID}`)
    assert.equal(json.total, 1)
    const [row] = json.rows
    assert.equal(row.id, created.id)
    assert.equal(row.user, "acct:obsidian@obsidian.local")
    assert.deepEqual(row.permissions.update, ["acct:obsidian@obsidian.local"])
    assert.equal(row.group, GROUP_ID)
  })

  test("an annotation upstream wrote is shown as the user's, so it can be edited", async () => {
    const { store, call } = setup()
    await call("POST", "annotations", posted("Old"))
    // As upstream left it: no user, group or permissions in the record.
    assert.doesNotMatch(store.note, /acct:obsidian|"group"|"permissions"/)
    const [row] = (await call("GET", "search")).json.rows
    assert.deepEqual(row.permissions.delete, ["acct:obsidian@obsidian.local"])
  })

  test("editing an annotation rewrites its block, and only it", async () => {
    const { store, call } = setup()
    const { json: first } = await call("POST", "annotations", posted("First", "one passage"))
    await call("POST", "annotations", posted("Second", "another passage"))
    const before = store.note
    const sliceOf = (note: string, at: number) => note.slice(parseNote(note).blocks[at]!.span.start, parseNote(note).blocks[at]!.span.end)
    const { json } = await call("PATCH", `annotations/${first.id}`, { ...first, text: "First, edited" })
    assert.equal(json.text, "First, edited")
    assert.equal(json.created, first.created)
    assert.notEqual(json.updated, first.updated)
    const texts = parseNote(store.note).annotations.map((annotation) => annotation.text)
    assert.deepEqual(texts, ["First, edited", "Second"])
    // The other block, and everything before the edited one, are as they were.
    assert.equal(sliceOf(store.note, 1), sliceOf(before, 1))
    assert.equal(store.note.slice(0, parseNote(store.note).blocks[0]!.span.start), before.slice(0, parseNote(before).blocks[0]!.span.start))
  })

  test("removing an annotation leaves the rest of the note as it was", async () => {
    const { store, call } = setup()
    const { json } = await call("POST", "annotations", posted("Gone soon"))
    assert.deepEqual((await call("DELETE", `annotations/${json.id}`)).json, { id: json.id, deleted: true })
    assert.equal(store.note.trimEnd(), NOTE.trimEnd())
    assert.equal((await call("GET", `annotations/${json.id}`)).status, 404)
  })

  test("a new annotation goes before the epilogue", async () => {
    const { store, call } = setup()
    await call("POST", "annotations", posted("First", "one passage"))
    store.note += "\nWhat I thought after.\n"
    await call("POST", "annotations", posted("Second", "another passage"))
    const note = parseNote(store.note)
    assert.equal(note.blocks.length, 2)
    assert.equal(store.note.slice(note.epilogue.start).trim(), "What I thought after.")
  })

  test("a thread's replies are found by what they answer", async () => {
    const { call } = setup()
    const { json: root } = await call("POST", "annotations", posted("Root"))
    const { json: reply } = await call("POST", "annotations", { ...posted("Reply"), target: [{ source: TARGET }], references: [root.id] })
    const { json } = await call("GET", `search?references=${root.id}`)
    assert.deepEqual(json.rows.map((row: any) => row.id), [reply.id])
  })
})
