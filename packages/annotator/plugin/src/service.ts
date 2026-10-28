// The fake service: Hypothesis's API as the sidebar calls it, answered from one annotation note in
// place of Hypothesis's servers. Nothing here reaches a network, Obsidian or the DOM: the note comes
// and goes through a store, so the same service runs in the plugin and in the tests.
//
// The routes are those the client calls (its src/sidebar/services/api.ts and api-routes.ts, at the
// version the plugin pins), with the smallest answers it accepts; research-hypothesis-embedding.md
// in the effort's notes lists them, with the client's own code for each.

import { type Annotation, parseNote, removeAnnotation, upsertAnnotation, type WriteOptions } from "@chaoticgoodcomputing/annotator-format"

/** The address the sidebar is told the API is at. It never resolves: every request is answered here. */
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

/** Where the service reads the note, and writes it. `update` applies a change to the note as it is then. */
export interface NoteStore {
  read(): Promise<string>
  update(change: (note: string) => string): Promise<void>
}

export interface ServiceOptions {
  store: NoteStore
  /** The user's name in the sidebar. */
  displayName?: string
  /** How a block's view is written (the plugin's settings). */
  view?: WriteOptions
  /** The time now, as an ISO 8601 instant; a function so the tests can fix it. */
  now?: () => string
}

export type Service = (request: ApiRequest) => Promise<ApiResponse>

const USERID = `acct:obsidian@${AUTHORITY}`

const ok = (value: unknown, status = 200): ApiResponse => ({ status, body: JSON.stringify(value) })
const failure = (status: number, reason: string): ApiResponse => ({ status, body: JSON.stringify({ status: "failure", reason }) })

/** Every route the client may look up, by name. A name the UI asks for and the index lacks throws in the client. */
function routes(): Record<string, unknown> {
  const route = (method: string, path: string, desc: string) => ({ method, url: API_URL + path, desc })
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

const GROUP = {
  id: GROUP_ID,
  groupid: `group:${GROUP_ID}@${AUTHORITY}`,
  name: "This note",
  type: "private",
  organization: null,
  scopes: null,
  links: {},
  pre_moderated: false,
}

export function createService(options: ServiceOptions): Service {
  const { store, displayName = "Me", view = {}, now = () => new Date().toISOString() } = options
  let preferences: Record<string, unknown> = { show_sidebar_tutorial: false }

  const profile = () => ({
    userid: USERID,
    authority: AUTHORITY,
    preferences,
    features: {},
    user_info: { display_name: displayName },
  })

  /** An annotation as the client is given it: the vault's user's, in the one group, whoever the note says wrote it. */
  const shown = (annotation: Annotation) => ({
    ...annotation,
    user: USERID,
    user_info: { display_name: displayName },
    group: GROUP_ID,
    permissions: { read: [`group:${GROUP_ID}`], update: [USERID], delete: [USERID], admin: [USERID] },
    links: {},
    hidden: false,
    flagged: false,
  })

  const annotations = async () => parseNote(await store.read()).annotations

  /** Writes an annotation into the note, and gives back what was stored. */
  const write = async (annotation: Omit<Annotation, "id"> & { id?: string }) => {
    let stored: Annotation | undefined
    await store.update((note) => {
      const written = upsertAnnotation(note, annotation, view)
      stored = written.annotation
      return written.note
    })
    return stored!
  }

  return async function service(request: ApiRequest): Promise<ApiResponse> {
    const url = new URL(request.url)
    if (!url.href.startsWith(API_URL)) return failure(404, `Not the API: ${request.url}`)
    const path = url.pathname.slice(new URL(API_URL).pathname.length).replace(/\/$/, "")
    const method = request.method.toUpperCase()
    const body = () => (request.body ? (JSON.parse(request.body) as Record<string, unknown>) : {})
    const [first, id, rest] = path.split("/")

    if (path === "" && method === "GET") return ok({ links: routes() })
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
      // Every annotation of the note, whatever document it names: a note is about one document, and
      // older annotations name it as Via did. `references` asks for one thread's replies.
      const references = url.searchParams.get("references")
      const rows = (await annotations()).filter((annotation) => !references || annotation.references?.includes(references))
      return ok({ total: rows.length, rows: rows.map(shown) })
    }

    if (first === "annotations") {
      if (!id && method === "POST") {
        const { id: _ignored, ...posted } = body()
        const time = now()
        return ok(shown(await write({ ...posted, created: time, updated: time })))
      }
      if (id && !rest) {
        const existing = (await annotations()).find((annotation) => annotation.id === id)
        if (!existing) return failure(404, `No annotation ${id}`)
        if (method === "GET") return ok(shown(existing))
        if (method === "PATCH" || method === "PUT") return ok(shown(await write({ ...existing, ...body(), id, updated: now() })))
        if (method === "DELETE") {
          await store.update((note) => removeAnnotation(note, id))
          return ok({ id, deleted: true })
        }
      }
      // Flagging and hiding, which the sidebar is configured never to offer.
      if (id && (rest === "flag" || rest === "hide")) return ok({})
    }

    if (path === "analytics/events") return ok({})
    return failure(404, `No route ${method} ${path}`)
  }
}
