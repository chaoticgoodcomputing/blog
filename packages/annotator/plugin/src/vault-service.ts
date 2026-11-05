// The local service's API: the fake service (src/service.ts) for the whole vault, not one note. A
// request about a page goes to the page's annotation note, found by its annotation target; a
// request about an annotation, to the note that holds it; the first annotation of a page makes its
// note. Nothing here reaches Obsidian: the notes come through `VaultNotes`, so the same service
// runs in the plugin and in the tests.

import { parseNote, type WriteOptions } from "@chaoticgoodcomputing/annotator-format"
import { type ApiRequest, type ApiResponse, createService, type NoteStore, type Service } from "./service.ts"

/** An annotation note, by its path in the vault, and its annotation target's address. */
export interface AnnotationNote {
  path: string
  target: string
}

/** A page the client names, as an annotation made on it names it. */
export interface Page {
  uri: string
  title?: string
}

/** The vault's annotation notes, as the local service reads and makes them. */
export interface VaultNotes {
  /** Every annotation note whose target is an address, now. */
  list(): AnnotationNote[]
  /** Where a note is read and written. */
  store(path: string): NoteStore
  /** Makes a page's annotation note, and gives back its path. */
  create(page: Page): Promise<string>
  /** A link to an annotation of a note, as the vault writes one. */
  linkTo?(path: string, id: string): string
}

export interface VaultServiceOptions {
  notes: VaultNotes
  /** Where the API is, as the client calls it. Ends with `/`. */
  apiUrl: string
  displayName?: string
  view?: WriteOptions
  now?: () => string
}

/**
 * An address, so that two which name the same document compare equal: without its fragment, its
 * scheme and host in lower case, its path without a trailing `/`. One that is not a URL (a PDF's
 * `urn:x-pdf:` fingerprint) as it is.
 */
export function normalizeAddress(address: string): string {
  try {
    const url = new URL(address.trim())
    url.hash = ""
    if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, "")
    return url.href
  } catch {
    return address.trim()
  }
}

const json = (value: unknown, status = 200): ApiResponse => ({ status, body: JSON.stringify(value) })

export function createVaultService(options: VaultServiceOptions): Service {
  const { notes, apiUrl, displayName, view, now } = options

  // Each note's service, by its path; and one for what names no note (the index, the profile, the
  // groups), whose note is never written.
  const services = new Map<string, Service>()
  const serviceOf = (path: string) => {
    let service = services.get(path)
    if (!service) {
      const linkTo = notes.linkTo
      service = createService({ store: notes.store(path), apiUrl, displayName, view, now, linkTo: linkTo && ((id) => linkTo(path, id)) })
      services.set(path, service)
    }
    return service
  }
  let empty = ""
  const general = createService({
    store: { read: async () => empty, update: async (change) => void (empty = change(empty)) },
    apiUrl,
    displayName,
  })

  /** The note annotating any of `addresses`: the first by path, when there are several. */
  const noteFor = (addresses: string[]) => {
    const wanted = new Set(addresses.filter(Boolean).map(normalizeAddress))
    return notes
      .list()
      .filter((note) => wanted.has(normalizeAddress(note.target)))
      .sort((a, b) => a.path.localeCompare(b.path))[0]
  }

  /** The note holding the annotation `id`. */
  const noteWith = async (id: string) => {
    for (const note of notes.list()) {
      const annotations = parseNote(await notes.store(note.path).read()).annotations
      if (annotations.some((annotation) => annotation.id === id)) return note
    }
    return undefined
  }

  return async function vaultService(request: ApiRequest): Promise<ApiResponse> {
    const url = new URL(request.url)
    if (!url.href.startsWith(apiUrl)) return json({ status: "failure", reason: `Not the API: ${request.url}` }, 404)
    const path = url.pathname.slice(new URL(apiUrl).pathname.length).replace(/\/$/, "")
    const method = request.method.toUpperCase()
    const [first, id] = path.split("/")

    // A page's annotations: the client names the page by its address, and by the others it has
    // (a canonical link, a PDF's fingerprint). A reply thread, by the annotation it replies to.
    if (path === "search") {
      const references = url.searchParams.get("references")
      const note = noteFor(url.searchParams.getAll("uri")) ?? (references ? await noteWith(references) : undefined)
      return note ? serviceOf(note.path)(request) : json({ total: 0, rows: [] })
    }

    // The extension's toolbar badge: how many annotations a page has.
    if (path === "badge") {
      const note = noteFor(url.searchParams.getAll("uri"))
      const total = note ? parseNote(await notes.store(note.path).read()).annotations.length : 0
      return json({ total })
    }

    // A new annotation goes to its page's note, which the first one makes.
    if (first === "annotations" && !id && method === "POST") {
      const posted = request.body ? (JSON.parse(request.body) as Record<string, any>) : {}
      const uri = typeof posted.uri === "string" ? posted.uri : undefined
      if (!uri) return json({ status: "failure", reason: "An annotation names no page" }, 400)
      const links: string[] = (posted.document?.link ?? []).map((link: { href?: string }) => link.href)
      const sources: string[] = (posted.target ?? []).map((target: { source?: string }) => target.source)
      const existing = noteFor([uri, ...links, ...sources])
      const notePath = existing?.path ?? (await notes.create({ uri, title: posted.document?.title }))
      return serviceOf(notePath)(request)
    }

    // An annotation, by its id: the note holding it.
    if (first === "annotations" && id) {
      const note = await noteWith(id)
      return note ? serviceOf(note.path)(request) : json({ status: "failure", reason: `No annotation ${id}` }, 404)
    }

    return general(request)
  }
}

/** The longest a new note's name is, before `.md`. */
const MAX_NAME = 100

/** A page's note's name: its title, else its address, without what a file name can't hold. */
export function noteName(page: Page): string {
  const fromAddress = () => {
    try {
      const url = new URL(page.uri)
      return `${url.host}${url.pathname}`.replace(/\/$/, "")
    } catch {
      return page.uri
    }
  }
  const name = (page.title?.trim() || fromAddress())
    .replace(/[\\/:*?"<>|#^[\]]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_NAME)
    .trim()
  return name || "Annotations"
}

/**
 * A page's new annotation note: its properties as the vault's annotation template has them
 * (content/templates/annotation.template.md), and nothing else; the annotations follow.
 */
export function newNote(page: Page, today: string): string {
  const quoted = (text: string) => JSON.stringify(text)
  return [
    "---",
    `title: ${quoted(page.title?.trim() || noteName(page))}`,
    `date: ${today}`,
    "tags:",
    "  - writing/annotations",
    `annotation-target: ${quoted(page.uri)}`,
    "---",
    "",
  ].join("\n")
}
