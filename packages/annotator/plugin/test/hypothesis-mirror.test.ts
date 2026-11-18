// Publishing a web page's note to Hypothesis: what is sent, what is kept in the note, and what is
// removed, against a Hypothesis kept in memory.

import assert from "node:assert/strict"
import { describe, test } from "node:test"
import { readNote, removeAnnotation, setRecordFields, updateAnnotation } from "@chaoticgoodcomputing/web-annotations"
import { copiesOf, fieldOf, type HypothesisApi, type HypothesisPayload, type Ledger, MIRROR_FIELD, type Mirrored, mirrorNote } from "../src/hypothesis-mirror.ts"
import { annotate, mint, reply } from "./notes.ts"

const PAGE = "https://example.org/post"
const PATH = "public/annotations/Post.md"
const NOTE = `---\nannotation-target: ${PAGE}\nannotation-target-type: web\nannotation-public: true\n---\n\nPreface.\n`

/** Hypothesis in memory, which can be made to fail. */
function fakeHypothesis() {
  const store = new Map<string, HypothesisPayload>()
  let next = 1
  const calls: string[] = []
  const hypothesis = {
    store,
    calls,
    failing: false,
    api: {
      async create(payload) {
        if (hypothesis.failing) throw new Error("down")
        const id = `h${next++}`
        store.set(id, payload)
        calls.push(`create ${id}`)
        return id
      },
      async update(id, payload) {
        if (hypothesis.failing) throw new Error("down")
        calls.push(`update ${id}`)
        if (!store.has(id)) return false
        store.set(id, payload)
        return true
      },
      async remove(id) {
        if (hypothesis.failing) throw new Error("down")
        calls.push(`remove ${id}`)
        store.delete(id)
      },
    } satisfies HypothesisApi,
  }
  return hypothesis
}

function memoryLedger(): Ledger & { entries: Record<string, string[]> } {
  const entries: Record<string, string[]> = {}
  return {
    entries,
    ids: (path) => entries[path] ?? [],
    async add(path, id) {
      entries[path] = [...(entries[path] ?? []), id]
    },
    async remove(path, id) {
      entries[path] = (entries[path] ?? []).filter((each) => each !== id)
    },
  }
}

/** Mirrors the note, and writes the fields back into it, as the plugin does. */
async function sync(
  text: string,
  hypothesis: ReturnType<typeof fakeHypothesis>,
  ledger: Ledger,
  options: { published?: boolean; force?: boolean; pageUrl?: string; recognized?: boolean } = {},
) {
  const result = await mirrorNote(PATH, text, "Post", options.published ?? true, {
    pageUrl: options.pageUrl,
    recognized: options.recognized,
    api: hypothesis.api,
    ledger,
    group: "__world__",
    toPublic: (comment) => comment.replace(/\[\[([^\]]+)\]\]/g, "<$1>"),
    force: options.force,
  })
  for (const [blockId, copies] of result.fields) text = setRecordFields(text, blockId, { [MIRROR_FIELD]: copies && fieldOf(copies) }).text
  return { text, result }
}

const annotationIn = (text: string, blockId: string) => readNote(text).annotations.find((annotation) => annotation.blockId === blockId)!
/** The source copy, as the record keeps it: at the top of its field, as before there were page copies. */
const mirroredIn = (text: string, blockId: string) => annotationIn(text, blockId).record[MIRROR_FIELD] as Mirrored | undefined
const pageCopyIn = (text: string, blockId: string) => copiesOf(annotationIn(text, blockId)).page

describe("mirrorNote", () => {
  test("publishes a comment, with its passage, its tags and its links made public, and keeps its id in the record", async () => {
    const hypothesis = fakeHypothesis()
    const ledger = memoryLedger()
    const note = annotate(NOTE, "aaa", PAGE, "a passage", "See [[Other]].", ["idea"])
    const { text, result } = await sync(note, hypothesis, ledger)
    assert.equal(result.created, 1)
    const sent = hypothesis.store.get("h1")!
    assert.equal(sent.uri, PAGE)
    assert.equal(sent.text, "See <Other>.")
    assert.deepEqual(sent.tags, ["idea"])
    assert.deepEqual(sent.document, { title: ["Post"] })
    assert.deepEqual(sent.permissions, { read: ["group:__world__"] })
    assert.equal((sent.target[0]!.selector as { type: string }[])[1]!.type, "TextQuoteSelector")
    assert.equal(mirroredIn(text, "aaa")?.id, "h1")
    assert.deepEqual(ledger.entries[PATH], ["h1"])
  })

  test("sends nothing again when nothing changed, and an edit as an update", async () => {
    const hypothesis = fakeHypothesis()
    const ledger = memoryLedger()
    let { text } = await sync(annotate(NOTE, "aaa", PAGE, "a passage", "First"), hypothesis, ledger)
    hypothesis.calls.length = 0
    ;({ text } = await sync(text, hypothesis, ledger))
    assert.deepEqual(hypothesis.calls, [])
    text = updateAnnotation(text, "aaa", { comment: "Second" }, mint("aaa")).text
    ;({ text } = await sync(text, hypothesis, ledger))
    assert.deepEqual(hypothesis.calls, ["update h1"])
    assert.equal(hypothesis.store.get("h1")!.text, "Second")
  })

  test("leaves highlights out", async () => {
    const hypothesis = fakeHypothesis()
    const { result } = await sync(annotate(NOTE, "aaa", PAGE, "a passage", ""), hypothesis, memoryLedger())
    assert.equal(result.created, 0)
    assert.equal(hypothesis.store.size, 0)
  })

  test("publishes a reply after its parent, referring to the parent's copy", async () => {
    const hypothesis = fakeHypothesis()
    const note = reply(annotate(NOTE, "aaa", PAGE, "a passage", "Parent"), "bbb", "aaa", "Child")
    const { text } = await sync(note, hypothesis, memoryLedger())
    assert.deepEqual(hypothesis.store.get("h2")!.references, ["h1"])
    assert.deepEqual(hypothesis.store.get("h2")!.target, [{ source: PAGE }])
    assert.equal(mirroredIn(text, "bbb")?.id, "h2")
  })

  test("removes the copy of a block removed from the note, by the ledger", async () => {
    const hypothesis = fakeHypothesis()
    const ledger = memoryLedger()
    let { text } = await sync(annotate(annotate(NOTE, "aaa", PAGE, "one", "One"), "bbb", PAGE, "two", "Two"), hypothesis, ledger)
    text = removeAnnotation(text, "aaa")
    await sync(text, hypothesis, ledger)
    assert.deepEqual([...hypothesis.store.keys()], ["h2"])
    assert.deepEqual(ledger.entries[PATH], ["h2"])
  })

  test("a note made private takes its copies off Hypothesis, and out of its records", async () => {
    const hypothesis = fakeHypothesis()
    const ledger = memoryLedger()
    let { text } = await sync(annotate(NOTE, "aaa", PAGE, "a passage", "One"), hypothesis, ledger)
    ;({ text } = await sync(text, hypothesis, ledger, { published: false }))
    assert.equal(hypothesis.store.size, 0)
    assert.equal(mirroredIn(text, "aaa"), undefined)
    assert.deepEqual(ledger.entries[PATH], [])
  })

  test("a copy Hypothesis no longer has is made again", async () => {
    const hypothesis = fakeHypothesis()
    const ledger = memoryLedger()
    let { text } = await sync(annotate(NOTE, "aaa", PAGE, "a passage", "One"), hypothesis, ledger)
    hypothesis.store.clear()
    ;({ text } = await sync(text, hypothesis, ledger, { force: true }))
    assert.equal(mirroredIn(text, "aaa")?.id, "h2")
    assert.deepEqual(ledger.entries[PATH], ["h2"])
  })

  test("what fails is left as it was, and tried again next time", async () => {
    const hypothesis = fakeHypothesis()
    const ledger = memoryLedger()
    hypothesis.failing = true
    let { text, result } = await sync(annotate(NOTE, "aaa", PAGE, "a passage", "One"), hypothesis, ledger)
    assert.equal(result.errors.length, 1)
    assert.equal(mirroredIn(text, "aaa"), undefined)
    hypothesis.failing = false
    ;({ text } = await sync(text, hypothesis, ledger))
    assert.equal(mirroredIn(text, "aaa")?.id, "h1")
  })

  test("a web page's note makes no page copy, and no link back, whatever its page", async () => {
    const hypothesis = fakeHypothesis()
    await sync(annotate(NOTE, "aaa", PAGE, "a passage", "One"), hypothesis, memoryLedger(), { pageUrl: "https://site.example/post" })
    assert.deepEqual([...hypothesis.store.values()].map((sent) => [sent.uri, sent.text]), [[PAGE, "One"]])
  })
})

describe("mirrorNote, for a PDF", () => {
  const PDF = "https://example.org/paper.pdf"
  const SITE_PAGE = "https://site.example/annotations/paper"
  const PDF_NOTE = `---\nannotation-target: ${PDF}\nannotation-public: true\n---\n`

  test("publishes a copy on the PDF, linking back to the card, and one on the note's page, on the card's quote", async () => {
    const hypothesis = fakeHypothesis()
    const ledger = memoryLedger()
    const note = annotate(PDF_NOTE, "aaa", PDF, "  the passage ", "A thought")
    const { text } = await sync(note, hypothesis, ledger, { pageUrl: SITE_PAGE })
    const source = hypothesis.store.get(mirroredIn(text, "aaa")!.id)!
    assert.equal(source.uri, PDF)
    assert.equal(source.text, `A thought\n\n[Read on site.example](${SITE_PAGE}#^aaa)`)
    assert.ok(!JSON.stringify(source).includes("urn:x-pdf"))
    const page = hypothesis.store.get(pageCopyIn(text, "aaa")!.id)!
    assert.equal(page.uri, SITE_PAGE)
    assert.equal(page.text, "A thought")
    assert.deepEqual(page.target, [{ source: SITE_PAGE, selector: [{ type: "TextQuoteSelector", exact: "the passage" }] }])
    assert.equal(ledger.entries[PATH]!.length, 2)
  })

  test("a reply's copies refer to their parent's copies of the same kind", async () => {
    const hypothesis = fakeHypothesis()
    const note = reply(annotate(PDF_NOTE, "aaa", PDF, "the passage", "Parent"), "bbb", "aaa", "Child")
    const { text } = await sync(note, hypothesis, memoryLedger(), { pageUrl: SITE_PAGE })
    assert.deepEqual(hypothesis.store.get(mirroredIn(text, "bbb")!.id)!.references, [mirroredIn(text, "aaa")!.id])
    assert.deepEqual(hypothesis.store.get(pageCopyIn(text, "bbb")!.id)!.references, [pageCopyIn(text, "aaa")!.id])
    assert.deepEqual(hypothesis.store.get(pageCopyIn(text, "bbb")!.id)!.target, [{ source: SITE_PAGE }])
  })

  test("a recognized PDF has its page copy alone", async () => {
    const hypothesis = fakeHypothesis()
    const { text } = await sync(annotate(PDF_NOTE, "aaa", PDF, "the passage", "One"), hypothesis, memoryLedger(), { pageUrl: SITE_PAGE, recognized: true })
    assert.equal(mirroredIn(text, "aaa")?.id, undefined)
    assert.equal(hypothesis.store.get(pageCopyIn(text, "aaa")!.id)!.uri, SITE_PAGE)
    assert.equal(hypothesis.store.size, 1)
  })

  test("a note with no page on the site has its source copy alone, with no link back", async () => {
    const hypothesis = fakeHypothesis()
    await sync(annotate(PDF_NOTE, "aaa", PDF, "the passage", "One"), hypothesis, memoryLedger())
    assert.deepEqual([...hypothesis.store.values()].map((sent) => [sent.uri, sent.text]), [[PDF, "One"]])
  })

  test("a PDF of the vault has its page copy alone", async () => {
    const hypothesis = fakeHypothesis()
    const vaultPdf = `---\nannotation-target: "[[paper.pdf]]"\nannotation-public: true\n---\n`
    await sync(annotate(vaultPdf, "aaa", "app://vault/paper.pdf", "the passage", "One"), hypothesis, memoryLedger(), { pageUrl: SITE_PAGE })
    assert.deepEqual([...hypothesis.store.values()].map((sent) => sent.uri), [SITE_PAGE])
  })

  test("made private, both copies go, and the field with them", async () => {
    const hypothesis = fakeHypothesis()
    const ledger = memoryLedger()
    let { text } = await sync(annotate(PDF_NOTE, "aaa", PDF, "the passage", "One"), hypothesis, ledger, { pageUrl: SITE_PAGE })
    ;({ text } = await sync(text, hypothesis, ledger, { published: false, pageUrl: SITE_PAGE }))
    assert.equal(hypothesis.store.size, 0)
    assert.equal(annotationIn(text, "aaa").record[MIRROR_FIELD], undefined)
  })
})
