// Publishing public notes' annotations to Hypothesis (./hypothesis-mirror.ts), from Obsidian: a
// note is mirrored a moment after it changes, however it changed (the browser's sidebar, a card's
// comment, the note's text), and on the user's command. Hypothesis is reached with Obsidian's
// `requestUrl`, which no page's CORS stands in the way of, with the user's developer token.

import { setRecordFields, AnnotationWriteError } from "@chaoticgoodcomputing/web-annotations"
import { type CachedMetadata, type Plugin, requestUrl, TFile } from "obsidian"
import { fieldOf, type HypothesisApi, type Ledger, MIRROR_FIELD, type MirrorResult, isPublic, mirrorNote } from "./hypothesis-mirror.ts"
import { pageUrl, publicMarkdown, type LinkedFile } from "./public-markdown.ts"
import type { AnnotatorSettings } from "./settings.ts"

const API = "https://api.hypothes.is/api/"

/** How long a note is left after a change before it is mirrored: a comment being typed changes it often. */
const SETTLE_MS = 2000

/** Hypothesis's API, as the user's token reaches it. */
export function hypothesisApi(token: string): HypothesisApi {
  const call = async (method: string, path: string, body?: unknown) => {
    const response = await requestUrl({
      url: API + path,
      method,
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
      throw: false,
    })
    if (response.status >= 400 && response.status !== 404) {
      throw new Error(`Hypothesis answered ${method} ${path} with ${response.status}: ${response.text.slice(0, 200)}`)
    }
    return response
  }
  return {
    async create(payload) {
      const response = await call("POST", "annotations", payload)
      if (response.status === 404) throw new Error("Hypothesis answered 404 to a new annotation")
      return (response.json as { id: string }).id
    },
    async update(id, payload) {
      return (await call("PATCH", `annotations/${encodeURIComponent(id)}`, payload)).status !== 404
    },
    async remove(id) {
      await call("DELETE", `annotations/${encodeURIComponent(id)}`)
    },
  }
}

export interface HypothesisSync {
  /** Mirrors a note now, sending all of it again; resolves to what happened, or none when it can't be mirrored. */
  resend(file: TFile): Promise<MirrorResult | undefined>
}

/** Mirrors the vault's public web pages' notes as they change, for as long as the plugin is loaded. */
export function syncWithHypothesis(
  plugin: Plugin & { settings: AnnotatorSettings; saveSettings(): Promise<void> },
  /** Whether a PDF's note's document had its text recognized by the plugin (./ocr.ts). */
  recognized: (file: TFile) => Promise<boolean>,
): HypothesisSync {
  const app = plugin.app
  const settings = () => plugin.settings
  const timers = new Map<string, number>()
  /** Each note's mirroring, so that one doesn't start while another of the same note runs. */
  const running = new Map<string, Promise<unknown>>()

  const ledger: Ledger = {
    ids: (path) => settings().hypothesisLedger[path] ?? [],
    async add(path, id) {
      const ledger = settings().hypothesisLedger
      ledger[path] = [...new Set([...(ledger[path] ?? []), id])]
      await plugin.saveSettings()
    },
    async remove(path, id) {
      const ledger = settings().hypothesisLedger
      const left = (ledger[path] ?? []).filter((each) => each !== id)
      if (left.length) ledger[path] = left
      else delete ledger[path]
      await plugin.saveSettings()
    },
  }

  const linkedFile = (linkpath: string, from: TFile): LinkedFile | undefined => {
    const file = linkpath === "" ? from : app.metadataCache.getFirstLinkpathDest(linkpath, from.path)
    if (!file) return undefined
    return { path: file.path, headings: (app.metadataCache.getFileCache(file)?.headings ?? []).map((heading) => heading.heading) }
  }

  async function mirror(file: TFile, force: boolean): Promise<MirrorResult | undefined> {
    const { hypothesisToken, hypothesisGroup, siteUrl, siteRoots } = settings()
    if (!hypothesisToken) return undefined
    const text = await app.vault.read(file)
    // Nothing to do for a note that has never been published and isn't now: no request is made.
    const published = isPublic(app.metadataCache.getFileCache(file)?.frontmatter)
    if (!published && !text.includes(`"${MIRROR_FIELD}":`) && ledger.ids(file.path).length === 0) return undefined
    const site = { url: siteUrl, roots: siteRoots }
    const result = await mirrorNote(file.path, text, file.basename, published, {
      api: hypothesisApi(hypothesisToken),
      ledger,
      group: hypothesisGroup,
      toPublic: (comment) => publicMarkdown(comment, (linkpath) => linkedFile(linkpath, file), site),
      pageUrl: pageUrl(file.path, site),
      recognized: published && (await recognized(file)),
      force,
    })
    if (result.fields.size > 0) {
      // Written into the note as it is now: a block removed meanwhile is passed over, and its copy
      // goes the next time, by the ledger.
      await app.vault.process(file, (note) => {
        for (const [blockId, copies] of result.fields) {
          try {
            note = setRecordFields(note, blockId, { [MIRROR_FIELD]: copies && fieldOf(copies) }).text
          } catch (error) {
            if (!(error instanceof AnnotationWriteError)) throw error
          }
        }
        return note
      })
    }
    for (const error of result.errors) console.warn(`Annotator: publishing ${file.path} to Hypothesis`, error)
    return result
  }

  /** Mirrors a note after any mirroring of it already running. */
  function queue(file: TFile, force: boolean): Promise<MirrorResult | undefined> {
    const next = (running.get(file.path) ?? Promise.resolve()).catch(() => {}).then(() => mirror(file, force))
    running.set(file.path, next)
    void next.finally(() => running.get(file.path) === next && running.delete(file.path)).catch(() => {})
    return next
  }

  function changed(file: TFile, cache: CachedMetadata | null) {
    if (file.extension !== "md" || !settings().hypothesisToken) return
    const frontmatter = cache?.frontmatter
    // Only an annotation note, or one that once was published.
    if (!frontmatter?.["annotation-target"] && ledger.ids(file.path).length === 0) return
    window.clearTimeout(timers.get(file.path))
    timers.set(
      file.path,
      window.setTimeout(() => {
        timers.delete(file.path)
        void queue(file, false).catch((error) => console.error(`Annotator: publishing ${file.path} to Hypothesis`, error))
      }, SETTLE_MS),
    )
  }

  plugin.registerEvent(app.metadataCache.on("changed", (file, _data, cache) => changed(file, cache)))
  // A note renamed keeps its copies; one deleted takes them with it.
  plugin.registerEvent(
    app.vault.on("rename", (file, oldPath) => {
      const ledgers = settings().hypothesisLedger
      if (!(file instanceof TFile) || !ledgers[oldPath]) return
      ledgers[file.path] = [...new Set([...(ledgers[file.path] ?? []), ...ledgers[oldPath]!])]
      delete ledgers[oldPath]
      void plugin.saveSettings()
    }),
  )
  plugin.registerEvent(
    app.vault.on("delete", (file) => {
      const ids = ledger.ids(file.path)
      const token = settings().hypothesisToken
      if (!token || ids.length === 0) return
      const api = hypothesisApi(token)
      for (const id of ids) {
        void api
          .remove(id)
          .then(() => ledger.remove(file.path, id))
          .catch((error) => console.warn(`Annotator: removing ${file.path}'s annotations from Hypothesis`, error))
      }
    }),
  )
  plugin.register(() => timers.forEach((timer) => window.clearTimeout(timer)))

  return { resend: (file) => queue(file, true) }
}
