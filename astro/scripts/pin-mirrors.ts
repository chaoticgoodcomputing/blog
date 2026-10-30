// Saves a mirror of each annotated document that has none (docs/adr/2801): `pnpm nx run
// astro:mirrors`. A mirror is pinned: once saved it is the document the annotations were written
// against, and it is never fetched again, so a document whose host has since changed it keeps the
// copy the passages were found in. Deleting a mirror is how one is fetched afresh.
//
// Run before a build that should have every mirror: by hand, after a new annotation note, and by
// the deploy before it builds. The build itself never fetches anything; a page whose document has
// no mirror is built with its annotations alone. A document that can't be fetched is reported and
// left, and the script still succeeds, so a host that refuses one reader can't stop a deploy.
//
// Then gives each mirror with no text file of its own one (src/lib/mirrors.ts): its scanned pages'
// text, recognized by @chaoticgoodcomputing/pdf-ocr as the Annotator plugin recognizes it, or, for a
// mirror with none, a text file with no pages, so it is looked at once. Recognizing a scanned book
// takes a minute or two; a text file, like the mirror, is never made again while it is the mirror's.
//
// Reads the vault VAULT_ROOT names, else the assembled one (`astro:vault`), and writes only into the
// mirror directory, MIRRORS_ROOT, else the repository's dist/mirrors (src/lib/mirrors.ts): never
// into the vault.

import fs from "node:fs"
import http from "node:http"
import https from "node:https"
import path from "node:path"
import { recognizePdf } from "@chaoticgoodcomputing/pdf-ocr/node"
import { isPdf, mirrorFile, mirrorName, mirrorsToRecognize, mirrorsToSave, mirrorTextFile, unmirroredDocuments } from "../src/lib/mirrors.ts"

const TIMEOUT = 60_000
const MAX_REDIRECTS = 10
const USER_AGENT = "chaoticgoodcomputing-blog (+https://github.com/chaoticgoodcomputing/blog)"

class Unfetchable extends Error {}

// A plain GET that follows redirects, through Node's own HTTP client rather than `fetch`: some
// publishers' bot checks answer `fetch` with a challenge page, and Node's client, like curl, with the
// document. nature.com's did in September 2026.
function download(url: URL, signal: AbortSignal, redirects = MAX_REDIRECTS): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const client = url.protocol === "https:" ? https : http
    // A fresh agent for each request, so no socket kept alive holds the script open.
    const request = client.get(url, { signal, agent: false, headers: { "user-agent": USER_AGENT } }, (response) => {
      const status = response.statusCode ?? 0
      const location = response.headers.location
      if (status >= 300 && status < 400 && location) {
        response.resume()
        if (redirects === 0) return reject(new Unfetchable("too many redirects"))
        const next = URL.canParse(location, url) ? new URL(location, url) : undefined
        if (next?.protocol !== "http:" && next?.protocol !== "https:") return reject(new Unfetchable(`redirected to ${location}`))
        return resolve(download(next, signal, redirects - 1))
      }
      if (status < 200 || status >= 300) {
        response.resume()
        return reject(new Unfetchable(`HTTP ${status}`))
      }
      const chunks: Buffer[] = []
      response.on("data", (chunk: Buffer) => chunks.push(chunk))
      response.on("error", reject)
      response.on("end", () => (response.complete ? resolve(Buffer.concat(chunks)) : reject(new Unfetchable("the connection closed early"))))
    })
    request.on("error", reject)
  })
}

async function pin(target: string): Promise<string> {
  const file = mirrorFile(mirrorName(target)!)
  const signal = AbortSignal.timeout(TIMEOUT)
  let bytes: Buffer
  try {
    bytes = await download(new URL(target), signal)
  } catch (error) {
    if (signal.aborted) throw new Unfetchable(`no answer in ${TIMEOUT / 1000}s`)
    if (error instanceof Unfetchable) throw error
    // A failure to connect is an error with a code and, when every address failed, no message.
    throw new Unfetchable((error as NodeJS.ErrnoException).code ?? (error as Error).message)
  }
  if (!isPdf(bytes)) throw new Unfetchable("not a PDF")
  // Written beside it and renamed into place, so a run stopped halfway never pins half a document.
  fs.mkdirSync(path.dirname(file), { recursive: true })
  const partial = `${file}.${process.pid}.partial`
  fs.writeFileSync(partial, bytes)
  fs.renameSync(partial, file)
  return file
}

const targets = unmirroredDocuments()
const { save, clashing } = mirrorsToSave(targets)
let failed = 0
for (const [name, sharing] of clashing) {
  console.warn(`✗ ${name}: the mirror of ${sharing.length} documents, ${sharing.join(", ")}; none is saved`)
  failed += sharing.length
}
for (const target of save) {
  try {
    console.log(`✓ ${target} → ${path.relative(process.cwd(), await pin(target))}`)
  } catch (error) {
    failed++
    console.warn(`✗ ${target}: ${(error as Error).message}`)
  }
}
console.log(`${targets.length - failed} of ${targets.length} documents with no mirror saved.`)

// The text of the mirrors' scanned pages. A mirror that can't be read is reported and left, as a
// document that can't be fetched is.
for (const name of mirrorsToRecognize()) {
  const started = Date.now()
  try {
    const text = await recognizePdf(new Uint8Array(fs.readFileSync(mirrorFile(name))))
    const file = mirrorTextFile(name)
    const partial = `${file}.${process.pid}.partial`
    fs.writeFileSync(partial, JSON.stringify(text))
    fs.renameSync(partial, file)
    const pages = Object.keys(text.pages).length
    console.log(pages ? `✓ ${name}: the text of ${pages} scanned pages recognized, in ${Math.round((Date.now() - started) / 1000)}s` : `✓ ${name}: no scanned pages`)
  } catch (error) {
    console.warn(`✗ ${name}: its scanned pages could not be recognized: ${(error as Error).message}`)
  }
}
