// Where an annotated document's bytes come from, for a document on the web: the saved copy, when
// there is one; else the web, saving what came back; else, when the web won't give it (a paywall, a
// bot check), the file the user supplies for it. Whatever is saved is checked to be a PDF first, so
// that a login page or a challenge is never kept in a document's place.
//
// Storage and fetching are passed in, so the plugin keeps copies in a folder of its choosing, and
// tests keep them in memory. Nothing here reaches Obsidian, the DOM or Node.

/// <reference path="./url.d.ts" />

/** Where saved copies are kept, by name: a folder, as far as this package knows. */
export interface DocumentStore {
  /** The saved copy of that name; undefined when there is none. */
  read(name: string): Promise<Uint8Array | undefined>
  write(name: string, bytes: Uint8Array): Promise<void>
}

/** What a fetch of an address answered: its status, and its body. Thrown errors are network failures. */
export type Fetch = (url: string) => Promise<{ status: number; bytes: Uint8Array }>

/** Why a document can't be had from the web. */
export type Unavailable =
  | { reason: "network"; detail: string }
  | { reason: "status"; status: number }
  | { reason: "not-a-pdf" }

/** Thrown when a document has no saved copy and the web won't give it: the user may supply it. */
export class DocumentUnavailable extends Error {
  readonly url: string
  readonly why: Unavailable
  constructor(url: string, why: Unavailable) {
    super(`${url}: ${describe(why)}`)
    this.name = "DocumentUnavailable"
    this.url = url
    this.why = why
  }
}

/** Thrown when what the user supplies for a document is not a PDF. */
export class NotAPdf extends Error {
  readonly url: string
  constructor(url: string) {
    super(`What was supplied for ${url} is not a PDF.`)
    this.name = "NotAPdf"
    this.url = url
  }
}

function describe(why: Unavailable): string {
  switch (why.reason) {
    case "network":
      return `it could not be fetched (${why.detail})`
    case "status":
      return `the site answered ${why.status}`
    case "not-a-pdf":
      return "the site answered with something other than a PDF, such as a login page or a bot check"
  }
}

/**
 * Whether bytes are a PDF: the `%PDF-` header within the first kilobyte, where PDF readers look for
 * it (the site's mirrors check the same).
 */
export function isPdf(bytes: Uint8Array): boolean {
  const head = bytes.subarray(0, 1024)
  const marker = [0x25, 0x50, 0x44, 0x46, 0x2d] // %PDF-
  outer: for (let at = 0; at + marker.length <= head.length; at++) {
    for (let i = 0; i < marker.length; i++) if (head[at + i] !== marker[i]) continue outer
    return true
  }
  return false
}

/**
 * The name a document's saved copy is kept under: its host, then the file name its address ends
 * in, `example.org/paper.pdf`, so that two sites' `paper.pdf` are two copies. An address with no
 * file name is named by a hash of it. Characters a file system may refuse are replaced by `-`.
 */
export function savedName(url: string): string {
  const address = new URL(url)
  const host = safe(address.hostname) || "document"
  let file = ""
  try {
    file = decodeURIComponent(address.pathname.split("/").at(-1) ?? "")
  } catch {
    file = address.pathname.split("/").at(-1) ?? ""
  }
  file = safe(file)
  if (!file || file === "." || file === "..") file = `${hash(address.href)}.pdf`
  else if (address.search) file = `${file.replace(/\.pdf$/i, "")}-${hash(address.href)}.pdf`
  else if (!/\.pdf$/i.test(file)) file = `${file}.pdf`
  return `${host}/${file}`
}

const safe = (text: string) => text.replace(/[\u0000-\u001f<>:"/\\|?*]/g, "-").replace(/^[ .]+|[ .]+$/g, "")

/** A short, stable hash of a text: FNV-1a, 32 bits, in hex. */
function hash(text: string): string {
  let value = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    value ^= text.charCodeAt(i)
    value = Math.imul(value, 0x01000193) >>> 0
  }
  return value.toString(16).padStart(8, "0")
}

/** Where a document's bytes came from. */
export type Source = "saved" | "web"

/**
 * A document on the web's bytes: its saved copy, or else fetched and then saved. Throws
 * DocumentUnavailable when there is no copy and the web won't give a PDF.
 */
export async function documentFor(url: string, { store, fetch }: { store: DocumentStore; fetch: Fetch }): Promise<{ bytes: Uint8Array; from: Source }> {
  const name = savedName(url)
  const saved = await store.read(name)
  if (saved && isPdf(saved)) return { bytes: saved, from: "saved" }

  let answer: Awaited<ReturnType<Fetch>>
  try {
    answer = await fetch(url)
  } catch (error) {
    throw new DocumentUnavailable(url, { reason: "network", detail: error instanceof Error ? error.message : String(error) })
  }
  if (answer.status < 200 || answer.status >= 300) throw new DocumentUnavailable(url, { reason: "status", status: answer.status })
  if (!isPdf(answer.bytes)) throw new DocumentUnavailable(url, { reason: "not-a-pdf" })
  await store.write(name, answer.bytes)
  return { bytes: answer.bytes, from: "web" }
}

/** Keeps a file the user supplies as a document's saved copy, which is then what it is opened from. */
export async function supplyDocument(url: string, bytes: Uint8Array, store: DocumentStore): Promise<void> {
  if (!isPdf(bytes)) throw new NotAPdf(url)
  await store.write(savedName(url), bytes)
}
