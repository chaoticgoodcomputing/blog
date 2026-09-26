// Mirrors: pinned copies of annotation pages' source documents (CONTEXT.md, docs/adr/0001).
//
// This module is the one owner of the URL → mirror name rule. Whatever needs a mirror's name, the
// emitter and the page type (which hands the Viewer its path), takes it from here.
import fs from "node:fs"
import http from "node:http"
import https from "node:https"
import path from "node:path"
import { createHash } from "node:crypto"

/** The source document an annotation page names, if it names one: a non-empty `annotation-target`. */
export function annotationTarget(frontmatter: Record<string, unknown> | undefined): string | undefined {
  const target = frontmatter?.["annotation-target"]
  return typeof target === "string" && target.trim() !== "" ? target.trim() : undefined
}

/** A source document's address, or why it isn't one we can fetch. */
export function sourceUrl(target: string): URL | Unmirrorable {
  let url: URL
  try {
    url = new URL(target)
  } catch {
    return new Unmirrorable("not a URL")
  }
  return url.protocol === "http:" || url.protocol === "https:" ? url : new Unmirrorable("not a web URL")
}

/**
 * A mirror's name: a hash of its source URL, with no extension. The URL is the only identity an
 * annotation page has for its document at render time, and PDF.js checks neither extension nor
 * `Content-Type`. The hash is of the URL's normal form, so two spellings of one URL share a mirror.
 */
export function mirrorName(source: URL): string {
  return createHash("sha256").update(source.href).digest("hex").slice(0, 16)
}

/** Why a source document has no mirror. Logged as a warning; the build goes on without it. */
export class Unmirrorable extends Error {}

/** Where a source document is pinned in `cacheDir`. A copy saved there by hand is pinned too. */
export const cacheEntry = (source: URL, cacheDir: string) => path.join(cacheDir, mirrorName(source))

/**
 * The cached copy of a source document, fetched on first use and pinned from then on: a cache hit
 * never touches the network, so the mirror stays the document its annotations were written
 * against. Evicting the entry is the only way to refresh it. A failed fetch pins nothing.
 *
 * The cache is keyed by source document, never by page, so pages sharing one document share one
 * entry, and a future slice can be cut from the pinned whole.
 */
export async function pinned(source: URL, cacheDir: string, timeout: number): Promise<string> {
  const entry = cacheEntry(source, cacheDir)
  if (fs.existsSync(entry)) return entry

  const signal = AbortSignal.timeout(timeout)
  let bytes: Buffer
  try {
    bytes = await download(source, signal)
  } catch (err) {
    if (err instanceof Unmirrorable) throw err
    if (signal.aborted) throw new Unmirrorable(`no answer in ${timeout}ms`)
    throw new Unmirrorable((err as NodeJS.ErrnoException).code ?? (err as Error).message)
  }
  // PDF only. A host that answers with something else (a login or bot-check page) must not have
  // that pinned in place of the document.
  if (!bytes.subarray(0, 1024).includes("%PDF-")) throw new Unmirrorable("not a PDF")

  // Written aside and renamed into place, so a build killed mid-write never pins half a document.
  await fs.promises.mkdir(cacheDir, { recursive: true })
  const partial = `${entry}.${process.pid}.partial`
  await fs.promises.writeFile(partial, bytes)
  await fs.promises.rename(partial, entry)
  return entry
}

const USER_AGENT = "cgc-annotator (+https://github.com/chaoticgoodcomputing/blog)"
const MAX_REDIRECTS = 10

// A plain GET that follows redirects, through Node's own HTTP client rather than `fetch`. Some
// publishers' bot checks answer `fetch` (undici) with a challenge page, and answer Node's client,
// like curl, with the document: nature.com's did in September 2026.
function download(url: URL, signal: AbortSignal, redirects = MAX_REDIRECTS): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const client = url.protocol === "https:" ? https : http
    // A fresh agent per request: no kept-alive socket holds the build open once it's done.
    const request = client.get(url, { signal, agent: false, headers: { "user-agent": USER_AGENT } }, (response) => {
      const status = response.statusCode ?? 0
      const location = response.headers.location
      if (status >= 300 && status < 400 && location) {
        response.resume()
        if (redirects === 0) return reject(new Unmirrorable("too many redirects"))
        const next = URL.canParse(location, url) ? new URL(location, url) : undefined
        if (next?.protocol !== "http:" && next?.protocol !== "https:") return reject(new Unmirrorable(`redirected to ${location}`))
        return resolve(download(next, signal, redirects - 1))
      }
      if (status < 200 || status >= 300) {
        response.resume()
        return reject(new Unmirrorable(`HTTP ${status}`))
      }
      const chunks: Buffer[] = []
      response.on("data", (chunk: Buffer) => chunks.push(chunk))
      response.on("error", reject)
      response.on("end", () => (response.complete ? resolve(Buffer.concat(chunks)) : reject(new Unmirrorable("connection closed early"))))
    })
    request.on("error", reject)
  })
}
