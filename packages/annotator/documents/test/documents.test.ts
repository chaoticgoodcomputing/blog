import assert from "node:assert/strict"
import { test } from "node:test"
import { DocumentUnavailable, documentFor, type DocumentStore, type Fetch, isPdf, NotAPdf, savedName, supplyDocument } from "../src/index.ts"

const PDF = new TextEncoder().encode("%PDF-1.4\n% a tiny stand-in\n%%EOF\n")
const PAGE = new TextEncoder().encode("<!doctype html><title>Just a moment...</title>")
const URL_ = "https://example.org/papers/On%20Meetings.pdf"

function memoryStore(): DocumentStore & { files: Map<string, Uint8Array> } {
  const files = new Map<string, Uint8Array>()
  return { files, read: async (name) => files.get(name), write: async (name, bytes) => void files.set(name, bytes) }
}

/** A fetch that answers as given, and counts its calls. */
function fetchAnswering(answer: Awaited<ReturnType<Fetch>> | Error): Fetch & { calls: number } {
  const fetch = Object.assign(
    async () => {
      fetch.calls++
      if (answer instanceof Error) throw answer
      return answer
    },
    { calls: 0 },
  )
  return fetch
}

test("a PDF is known by its header, anywhere in its first kilobyte", () => {
  assert.equal(isPdf(PDF), true)
  assert.equal(isPdf(new Uint8Array([...new Uint8Array(500), ...PDF])), true)
  assert.equal(isPdf(new Uint8Array([...new Uint8Array(1100), ...PDF])), false)
  assert.equal(isPdf(PAGE), false)
  assert.equal(isPdf(new Uint8Array()), false)
})

test("a saved copy is named by the document's host and file name", () => {
  assert.equal(savedName(URL_), "example.org/On Meetings.pdf")
  assert.equal(savedName("https://www.nature.com/articles/s41587-023-01840-6.pdf"), "www.nature.com/s41587-023-01840-6.pdf")
  // Two sites' file of one name are two copies.
  assert.notEqual(savedName("https://a.example/paper.pdf"), savedName("https://b.example/paper.pdf"))
  // A file name without .pdf gets it; an address with a query, or no file name, gets a hash too.
  assert.equal(savedName("https://arxiv.org/pdf/1702.08734"), "arxiv.org/1702.08734.pdf")
  assert.match(savedName("https://example.org/download?id=7"), /^example\.org\/download-[0-9a-f]{8}\.pdf$/)
  assert.notEqual(savedName("https://example.org/get.pdf?id=1"), savedName("https://example.org/get.pdf?id=2"))
  assert.match(savedName("https://example.org/"), /^example\.org\/[0-9a-f]{8}\.pdf$/)
  // Nothing a file system refuses.
  assert.doesNotMatch(savedName("https://example.org/a%3Ab%7Cc.pdf").split("/")[1]!, /[:|]/)
})

test("a document with a saved copy is opened from it, without fetching", async () => {
  const store = memoryStore()
  store.files.set(savedName(URL_), PDF)
  const fetch = fetchAnswering(new Error("offline"))
  assert.deepEqual(await documentFor(URL_, { store, fetch }), { bytes: PDF, from: "saved" })
  assert.equal(fetch.calls, 0)
})

test("a document with no saved copy is fetched, and saved", async () => {
  const store = memoryStore()
  const fetch = fetchAnswering({ status: 200, bytes: PDF })
  assert.deepEqual(await documentFor(URL_, { store, fetch }), { bytes: PDF, from: "web" })
  assert.deepEqual(store.files.get(savedName(URL_)), PDF)
  // And next time comes from the copy.
  assert.equal((await documentFor(URL_, { store, fetch })).from, "saved")
  assert.equal(fetch.calls, 1)
})

test("a page in a PDF's place is not saved, and the document is unavailable", async () => {
  const store = memoryStore()
  await assert.rejects(documentFor(URL_, { store, fetch: fetchAnswering({ status: 200, bytes: PAGE }) }), (error) => {
    assert.ok(error instanceof DocumentUnavailable)
    assert.deepEqual(error.why, { reason: "not-a-pdf" })
    return true
  })
  assert.equal(store.files.size, 0)
})

test("a refusal or a network failure leaves the document unavailable, saying why", async () => {
  const store = memoryStore()
  await assert.rejects(documentFor(URL_, { store, fetch: fetchAnswering({ status: 403, bytes: PAGE }) }), { why: { reason: "status", status: 403 } })
  await assert.rejects(documentFor(URL_, { store, fetch: fetchAnswering(new Error("ENOTFOUND")) }), { why: { reason: "network", detail: "ENOTFOUND" } })
})

test("a saved copy that is not a PDF is passed over, and fetched again", async () => {
  const store = memoryStore()
  store.files.set(savedName(URL_), PAGE)
  assert.equal((await documentFor(URL_, { store, fetch: fetchAnswering({ status: 200, bytes: PDF }) })).from, "web")
  assert.deepEqual(store.files.get(savedName(URL_)), PDF)
})

test("a supplied PDF becomes the document's saved copy; anything else is refused", async () => {
  const store = memoryStore()
  await assert.rejects(supplyDocument(URL_, PAGE, store), NotAPdf)
  assert.equal(store.files.size, 0)
  await supplyDocument(URL_, PDF, store)
  assert.deepEqual(await documentFor(URL_, { store, fetch: fetchAnswering(new Error("blocked")) }), { bytes: PDF, from: "saved" })
})
