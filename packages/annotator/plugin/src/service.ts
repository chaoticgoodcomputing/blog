// The fake service: Hypothesis's API as the sidebar calls it, answered from annotation notes in
// place of Hypothesis's servers. Nothing here reaches a network, Obsidian or the DOM: the notes come
// and go through a port (`Notes`), one note for the sidebar in Obsidian (`oneNote`) or the whole
// vault for the extension (src/vault-service.ts), so the same routes run in both and in the tests.
// The client speaks Hypothesis's JSON; the notes keep W3C Web Annotations, mapped by web-annotations.
//
// The routes are those the client calls (its src/sidebar/services/api.ts and api-routes.ts, at the
// version the plugin pins), with the smallest answers it accepts; research-hypothesis-embedding.md
// in the effort's notes lists them, with the client's own code for each.

import {
  AnnotationWriteError,
  fromHypothesis,
  type HypothesisAnnotation,
  type Mint,
  readNote,
  removeAnnotation,
  toHypothesis,
} from "@chaoticgoodcomputing/web-annotations"
import type { Page } from "./new-notes.ts"

/**
 * The address Obsidian's sidebar is told the API is at. It never resolves: every request is
 * answered here. The local service (src/server.ts) is at an address of its own (`apiUrl`).
 */
export const API_URL = "https://annotator.invalid/api/"

/** The authority of the vault's one user: other than the sidebar's `authDomain`, so the client is a third party's. */
export const AUTHORITY = "obsidian.local"

/** The one group every annotation is in. Not `__world__`, which the client treats as public. */
export const GROUP_ID = "vault"

/** A request as the sidebar made it, and the answer to it. Bodies are text, as `fetch` carries them. */
export interface ApiRequest {
  method: string
  url: string
  body?: string
}
export interface ApiResponse {
  status: number
  body: string
}

/** Where the service reads a note, and writes it. `update` applies a change to the note as it is then. */
export interface NoteStore {
  read(): Promise<string>
  update(change: (note: string) => string): Promise<void>
}

/** An annotation note the service has found: where it is read and written, and what the sidebar shows of it. */
export interface FoundNote extends NoteStore {
  /** The note's title, as the annotations' document. */
  title(): string
  /**
   * A link to an annotation of the note, by its id, as the user's vault writes one: `[[note#^id]]`.
   * The sidebar's Share button copies it. Without one, an annotation has no Share button.
   */
  linkTo?(id: string): string
}

/** Where the service finds the note a request is about. */
export interface Notes {
  /** The note of a page, by any of the addresses the client has for it. */
  forPage(addresses: readonly string[]): Promise<FoundNote | undefined>
  /** The note holding an annotation, by its id (its block id). */
  forAnnotation(id: string): Promise<FoundNote | undefined>
  /** Makes a page's note, for its first annotation. Without it, a page with no note is refused. */
  create?(page: Page): Promise<FoundNote>
}

/**
 * One note, the sidebar's in Obsidian: every request is about it, whatever page it names, since a
 * note is about one document and older annotations name it as Via did.
 */
export function oneNote(store: NoteStore, options: { title?: () => string; linkTo?: (id: string) => string } = {}): Notes {
  const { title = () => "", linkTo } = options
  const note: FoundNote = { read: () => store.read(), update: (change) => store.update(change), title, linkTo }
  return { forPage: async () => note, forAnnotation: async () => note }
}

export interface ServiceOptions {
  notes: Notes
  /** The user's name in the sidebar. */
  displayName?: string
  /** Where the API is, as the client calls it: API_URL by default. Ends with `/`. */
  apiUrl?: string
  /**
   * The logo the sidebar shows by the group's name, as an image's address: its organization's.
   * Without one, the client shows Hypothesis's.
   */
  logo?: string
  /** The time and new ids of what is written; the tests fix them. */
  mint?: Partial<Mint>
}

export type Service = (request: ApiRequest) => Promise<ApiResponse>

const USERID = `acct:obsidian@${AUTHORITY}`

const ok = (value: unknown, status = 200): ApiResponse => ({ status, body: JSON.stringify(value) })
const failure = (status: number, reason: string): ApiResponse => ({ status, body: JSON.stringify({ status: "failure", reason }) })

/** Every route the client may look up, by name. A name the UI asks for and the index lacks throws in the client. */
function routes(apiUrl: string): Record<string, unknown> {
  const route = (method: string, path: string, desc: string) => ({ method, url: apiUrl + path, desc })
  return {
    annotation: {
      create: route("POST", "annotations", "Create an annotation"),
      read: route("GET", "annotations/:id", "Fetch an annotation"),
      update: route("PATCH", "annotations/:id", "Update an annotation"),
      delete: route("DELETE", "annotations/:id", "Delete an annotation"),
      flag: route("PUT", "annotations/:id/flag", "Flag an annotation"),
      hide: route("PUT", "annotations/:id/hide", "Hide an annotation"),
      unhide: route("DELETE", "annotations/:id/hide", "Unhide an annotation"),
    },
    analytics: { events: { create: route("POST", "analytics/events", "Record an event") } },
    group: {
      read: route("GET", "groups/:id", "Fetch a group"),
      members: { read: route("GET", "groups/:pubid/members", "Fetch a group's members") },
      member: { delete: route("DELETE", "groups/:pubid/members/:userid", "Leave a group") },
    },
    groups: { read: route("GET", "groups", "Fetch the user's groups") },
    links: route("GET", "links", "URL templates"),
    profile: {
      read: route("GET", "profile", "Fetch the user's profile"),
      update: route("PATCH", "profile", "Update the user's profile"),
      groups: { read: route("GET", "profile/groups", "Fetch the user's groups") },
    },
    search: route("GET", "search", "Search annotations"),
  }
}

/**
 * What `links` answers. The client reads every one of these names, and fills in the `:user` and
 * `:tag` of the two templates, throwing on a template without them; none of them goes anywhere.
 * `websocket` is left out, which turns the client's live updates off.
 */
const NOWHERE = "https://annotator.invalid/"
const LINKS = {
  "account.settings": `${NOWHERE}account`,
  "forgot-password": `${NOWHERE}forgot-password`,
  "groups.new": `${NOWHERE}groups/new`,
  help: `${NOWHERE}help`,
  "oauth.authorize": `${NOWHERE}oauth/authorize`,
  "oauth.revoke": `${NOWHERE}oauth/revoke`,
  "search.tag": `${NOWHERE}search?tag=:tag`,
  signup: `${NOWHERE}signup`,
  user: `${NOWHERE}users/:user`,
}

/** The one group, in an organization of the vault's own when there is a logo to show for it. */
const groupWith = (logo?: string) => ({
  id: GROUP_ID,
  groupid: `group:${GROUP_ID}@${AUTHORITY}`,
  name: "This note",
  type: "private",
  organization: logo ? { id: "vault", name: "Chaotic Good Computing", logo } : null,
  scopes: null,
  links: {},
  pre_moderated: false,
})

/** Every address an annotation the client posts has for its page: its own, its links, its targets'. */
function addressesOf(posted: Record<string, any>): string[] {
  const links: unknown[] = (posted.document?.link ?? []).map((link: { href?: unknown }) => link?.href)
  const sources: unknown[] = (posted.target ?? []).map((target: { source?: unknown }) => target?.source)
  return [posted.uri, ...links, ...sources].filter((address): address is string => typeof address === "string" && address !== "")
}

export function createService(options: ServiceOptions): Service {
  const { notes, displayName = "Me", mint = {}, apiUrl = API_URL, logo } = options
  const GROUP = groupWith(logo)
  let preferences: Record<string, unknown> = { show_sidebar_tutorial: false }

  const profile = () => ({
    userid: USERID,
    authority: AUTHORITY,
    preferences,
    features: {},
    user_info: { display_name: displayName },
  })

  /** An annotation as the client is given it: the vault's user's, in the one group. */
  const shown = (note: FoundNote, annotation: HypothesisAnnotation) => ({
    ...annotation,
    user: USERID,
    user_info: { display_name: displayName },
    group: GROUP_ID,
    permissions: { read: [`group:${GROUP_ID}`], update: [USERID], delete: [USERID], admin: [USERID] },
    // What the client's Share button shows and copies (its AnnotationShareControl): the link to the
    // annotation, to paste into another note.
    links: note.linkTo ? { html: note.linkTo(annotation.id!) } : {},
    hidden: false,
    flagged: false,
  })

  /** A note's annotations, as the client has them; what can't be read isn't shown. */
  const annotationsOf = (note: FoundNote, text: string) => toHypothesis(readNote(text), note.title())

  const annotationIn = async (note: FoundNote, id: string) => annotationsOf(note, await note.read()).find((annotation) => annotation.id === id)

  /** Writes an annotation from the client into a note, and gives back what was stored. */
  const write = async (note: FoundNote, annotation: HypothesisAnnotation) => {
    let written: { text: string; blockId: string } | undefined
    await note.update((text) => {
      written = fromHypothesis(text, annotation, mint)
      return written.text
    })
    return annotationsOf(note, written!.text).find((stored) => stored.id === written!.blockId)!
  }

  /** A write the note can't take (its parent is gone) is a 404, as the client expects of what isn't there. */
  const writing = async (answer: () => Promise<ApiResponse>) => {
    try {
      return await answer()
    } catch (error) {
      if (error instanceof AnnotationWriteError) return failure(404, error.message)
      throw error
    }
  }

  return async function service(request: ApiRequest): Promise<ApiResponse> {
    const url = new URL(request.url)
    if (!url.href.startsWith(apiUrl)) return failure(404, `Not the API: ${request.url}`)
    const path = url.pathname.slice(new URL(apiUrl).pathname.length).replace(/\/$/, "")
    const method = request.method.toUpperCase()
    const body = () => (request.body ? (JSON.parse(request.body) as Record<string, any>) : {})
    const [first, id, rest] = path.split("/")

    if (path === "" && method === "GET") return ok({ links: routes(apiUrl) })
    if (path === "links") return ok(LINKS)
    // The grant token's exchange (the client's oauth-client.ts): any token will do, for as long as it likes.
    if (path === "token") return ok({ access_token: "local", token_type: "Bearer", expires_in: 10 ** 9, refresh_token: "local" })

    if (path === "profile") {
      if (method === "PATCH") preferences = { ...preferences, ...((body().preferences as object) ?? {}) }
      return ok(profile())
    }
    if (path === "profile/groups" || path === "groups") return ok([GROUP])
    if (first === "groups" && id && !rest) return id === GROUP_ID ? ok(GROUP) : failure(404, `No group ${id}`)
    if (first === "groups" && rest === "members") return ok({ meta: { page: { total: 0 } }, data: [] })

    if (path === "search") {
      // A page's annotations: the client names the page by its address, and by the others it has (a
      // canonical link, a PDF's fingerprint). `references` asks for one thread's replies.
      const references = url.searchParams.get("references")
      const note =
        (await notes.forPage(url.searchParams.getAll("uri"))) ?? (references ? await notes.forAnnotation(references) : undefined)
      if (!note) return ok({ total: 0, rows: [] })
      const rows = annotationsOf(note, await note.read()).filter((annotation) => !references || annotation.references?.includes(references))
      return ok({ total: rows.length, rows: rows.map((annotation) => shown(note, annotation)) })
    }

    // The extension's toolbar badge: how many annotations a page has.
    if (path === "badge") {
      const note = await notes.forPage(url.searchParams.getAll("uri"))
      return ok({ total: note ? readNote(await note.read()).annotations.length : 0 })
    }

    if (first === "annotations" && !id && method === "POST") {
      const { id: _ignored, ...posted } = body()
      // A reply goes where its parent is; a new annotation, to its page's note, which the first makes.
      const parent = Array.isArray(posted.references) ? posted.references.at(-1) : undefined
      let note: FoundNote | undefined
      if (typeof parent === "string") {
        note = await notes.forAnnotation(parent)
        if (!note) return failure(404, `No annotation ${parent}`)
      } else {
        const addresses = addressesOf(posted)
        note = await notes.forPage(addresses)
        if (!note) {
          const uri = typeof posted.uri === "string" ? posted.uri : undefined
          if (!uri || !notes.create) return failure(400, "An annotation names no page")
          // The client names a PDF by its fingerprint, as `urn:x-pdf:`, beside its address.
          const pdf = addresses.some((address) => /^urn:x-pdf:|\.pdf(?:[?#]|$)/i.test(address))
          note = await notes.create({ uri, title: posted.document?.title, pdf })
        }
      }
      const found = note
      return writing(async () => ok(shown(found, await write(found, posted))))
    }

    if (first === "annotations" && id && !rest) {
      const note = await notes.forAnnotation(id)
      const existing = note && (await annotationIn(note, id))
      if (!note || !existing) return failure(404, `No annotation ${id}`)
      if (method === "GET") return ok(shown(note, existing))
      // What the client leaves out of an edit stays as it was.
      if (method === "PATCH" || method === "PUT") return writing(async () => ok(shown(note, await write(note, { ...existing, ...body(), id }))))
      if (method === "DELETE") {
        // Its replies stay in the note, as Hypothesis keeps a deleted annotation's replies.
        await note.update((text) => removeAnnotation(text, id))
        return ok({ id, deleted: true })
      }
    }
    // Flagging and hiding, which the sidebar is configured never to offer.
    if (first === "annotations" && id && (rest === "flag" || rest === "hide")) return ok({})

    if (path === "analytics/events") return ok({})
    return failure(404, `No route ${method} ${path}`)
  }
}
