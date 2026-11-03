// Mirrors: the site's own pinned copies of the annotated documents, which the annotation viewer
// draws (docs/adr/2801). A mirror is saved in the mirror directory, the repository's dist/mirrors,
// since the documents are somebody else's and nothing the build runs writes into the vault: by
// hand, or by `astro:mirrors` (scripts/pin-mirrors.ts). The directory is the same whichever vault
// the site reads, so a vault assembled afresh keeps the mirrors already saved. The site serves each
// one under assets/annotated-documents, the address mirrors have always had, which robots.txt tells
// crawlers to skip. They are no files of the vault, so the mirrors integration
// (src/integrations/mirrors.ts) publishes them, as the attachments integration publishes the vault's
// own files.
//
// A scanned mirror has a text file beside it, `<mirror>.text.json`: its scanned pages' text, which
// `astro:mirrors` recognizes once (@chaoticgoodcomputing/pdf-ocr), as the Annotator plugin does, so
// that the passages annotated in the plugin are found in the same text here. It is published beside
// the mirror while it is that mirror's.
//
// A note with a page range (`annotation-pages`) is shown a slice of its mirror: those pages alone,
// cut from the saved mirror by `astro:mirrors` (src/lib/slices.ts) and kept beside it, named for
// them. The document is downloaded once however many notes show it in slices, and a mirror no note
// shows whole is neither recognized nor published: a book read a chapter at a time is served a
// chapter at a time. A slice has a text file of its own, recognized from its own pages.

import { createHash } from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { annotationPages, annotationTarget, type PageRange } from "@chaoticgoodcomputing/obsidian-markdown"
import { isTextFileOf, textFileName } from "@chaoticgoodcomputing/pdf-ocr/text"
import { documentFileName } from "./annotations.ts"
import { getNotes, type Note } from "./notes.ts"
import { slugFor } from "./vault.ts"

/** Where mirrors are served from on the site. public/robots.txt names it. */
export const MIRRORS = "assets/annotated-documents"

/**
 * The repository's root: the nearest folder holding nx.json at or above the first of `from` that
 * has one. Undefined when none is in the repository.
 */
export function workspaceRoot(...from: string[]): string | undefined {
  for (const start of from) {
    for (let folder = path.resolve(start); ; folder = path.dirname(folder)) {
      if (fs.existsSync(path.join(folder, "nx.json"))) return folder
      if (path.dirname(folder) === folder) break
    }
  }
  return undefined
}

/** The mirror directory of the repository at `root` when MIRRORS_ROOT names none: dist/mirrors. */
export const defaultMirrorsRoot = (root: string): string => path.join(root, "dist", "mirrors")

// The repository this module is in: found from its own folder, which a build's bundled copy of it
// is under too, and then from the working directory, so it is the same whichever folder runs it.
function repository(): string {
  const root = workspaceRoot(path.dirname(fileURLToPath(import.meta.url)), process.cwd())
  if (root === undefined) throw new Error("No nx.json above this module or the working directory: set MIRRORS_ROOT to the mirror directory")
  return root
}

/**
 * The mirror directory: MIRRORS_ROOT, else the repository's dist/mirrors, whatever folder the code
 * runs from. git ignores dist and no build clears it whole, so the mirrors outlive a fresh
 * node_modules, and the deploy keeps the directory between runs. It is not moved with a cache the
 * end-to-end suite names for its own build, so the suite over the real vault draws the mirrors
 * already saved; the fixture vault's suite names its own.
 */
export const MIRRORS_ROOT = path.resolve(process.env.MIRRORS_ROOT ?? defaultMirrorsRoot(repository()))

/**
 * What a document's mirror is called: the file name its address ends in, written as a slug writes a
 * name, a space as `-`. Undefined for a document that is not on the web, or whose address names no
 * file.
 */
export function mirrorName(target: string): string | undefined {
  if (!URL.canParse(target)) return undefined
  const { protocol } = new URL(target)
  if (protocol !== "http:" && protocol !== "https:") return undefined
  const file = documentFileName(target)
  return file ? slugFor(file) : undefined
}

/**
 * What a mirror's slice of the pages `range` is called: the mirror's name with the pages before its
 * extension, `Book.p12-40.pdf`, each run after the first after a `_`: `Book.p3-5_9.pdf`.
 */
export function sliceName(name: string, range: PageRange): string {
  const pages = range.map(([first, last]) => (first === last ? `${first}` : `${first}-${last}`)).join("_")
  const dot = name.lastIndexOf(".")
  return dot > 0 ? `${name.slice(0, dot)}.p${pages}${name.slice(dot)}` : `${name}.p${pages}`
}

/**
 * What the mirror a note's annotation viewer draws is called: its document's mirror, or, for a
 * note with a page range, that mirror's slice of those pages. Undefined for a note whose document
 * can have no mirror.
 */
export function shownMirrorName(frontmatter: Note["frontmatter"]): string | undefined {
  const target = annotationTarget(frontmatter)
  const name = target === undefined ? undefined : mirrorName(target)
  const range = annotationPages(frontmatter)
  return name && range ? sliceName(name, range) : name
}

/** Where a mirror is kept, in the mirror directory `root`. */
export const mirrorFile = (name: string, root: string = MIRRORS_ROOT): string => path.join(root, name)

/**
 * The address the site serves a document's mirror at, from the site's root and not encoded, when
 * the mirror directory `root` has one saved. Undefined when it has none.
 */
export const mirrorOf = (target: string, root: string = MIRRORS_ROOT): string | undefined => servedAt(mirrorName(target), root)

// The address a mirror or a slice called `name` is served at, when it is saved.
const servedAt = (name: string | undefined, root: string): string | undefined =>
  name && fs.existsSync(mirrorFile(name, root)) ? `/${MIRRORS}/${name}` : undefined

/**
 * The address of the mirror a note's annotation viewer draws, when it is an annotation page and
 * that mirror is saved: its document's, or its slice of the note's page range.
 */
export const mirrorFor = (note: Pick<Note, "frontmatter">, root: string = MIRRORS_ROOT): string | undefined =>
  servedAt(shownMirrorName(note.frontmatter), root)

/** Where a mirror's text file is kept, beside it. */
export const mirrorTextFile = (name: string, root: string = MIRRORS_ROOT): string => textFileName(mirrorFile(name, root))

// Each file's SHA-256, kept while the file is unchanged: the dev server asks on every request.
const hashes = new Map<string, { mtimeMs: number; size: number; hash: string }>()
function hashOf(file: string): string {
  const { mtimeMs, size } = fs.statSync(file)
  const known = hashes.get(file)
  if (known?.mtimeMs === mtimeMs && known.size === size) return known.hash
  const hash = createHash("sha256").update(fs.readFileSync(file)).digest("hex")
  hashes.set(file, { mtimeMs, size, hash })
  return hash
}

/**
 * A mirror's text file, read, when it has one that is its own: made from this mirror, byte for byte,
 * as the hash in it says. Undefined for none, or for one made from another copy of the document.
 */
export function mirrorText(name: string, root: string = MIRRORS_ROOT) {
  const file = mirrorTextFile(name, root)
  if (!fs.existsSync(file) || !fs.existsSync(mirrorFile(name, root))) return undefined
  try {
    const text: unknown = JSON.parse(fs.readFileSync(file, "utf8"))
    return isTextFileOf(text, hashOf(mirrorFile(name, root))) ? text : undefined
  } catch {
    return undefined
  }
}

/**
 * The address the site serves a document's text file at, beside its mirror, when the mirror has
 * one of its own with text in it. Undefined for a mirror with no scanned pages, or none recognized.
 */
export const mirrorTextOf = (target: string, root: string = MIRRORS_ROOT): string | undefined => textServedAt(mirrorName(target), root)

function textServedAt(name: string | undefined, root: string): string | undefined {
  const text = name === undefined ? undefined : mirrorText(name, root)
  return text && Object.keys(text.pages).length ? `/${MIRRORS}/${textFileName(name!)}` : undefined
}

/** The address of the text file of the mirror a note's viewer draws, when it has one to serve: `mirrorTextOf`. */
export const mirrorTextFor = (note: Pick<Note, "frontmatter">, root: string = MIRRORS_ROOT): string | undefined =>
  textServedAt(shownMirrorName(note.frontmatter), root)

/**
 * The mirrors the site publishes, by address, each with its file: those of the annotated documents
 * of the published notes, that are saved in the mirror directory, and the text files of those that
 * have one to serve.
 */
export function publishedMirrors(root: string = MIRRORS_ROOT, notes: Pick<Note, "frontmatter">[] = getNotes()): Map<string, string> {
  const published = new Map<string, string>()
  for (const note of notes) {
    const address = mirrorFor(note, root)
    if (!address) continue
    published.set(address, mirrorFile(path.posix.basename(address), root))
    const text = mirrorTextFor(note, root)
    if (text) published.set(text, mirrorTextFile(path.posix.basename(address), root))
  }
  return published
}

// The names of the mirrors and slices the published notes' viewers draw, each once.
const shownNames = (notes: Pick<Note, "frontmatter">[]): string[] =>
  [...new Set(notes.map((note) => shownMirrorName(note.frontmatter)))].filter((name): name is string => name !== undefined)

/**
 * The saved mirrors and slices the published notes' viewers draw that have no text file of their
 * own yet, by name: those `astro:mirrors` looks at for scanned pages to recognize. A mirror only
 * sliced is not among them: its slices are.
 */
export function mirrorsToRecognize(root: string = MIRRORS_ROOT, notes: Pick<Note, "frontmatter">[] = getNotes()): string[] {
  return shownNames(notes).filter((name) => fs.existsSync(mirrorFile(name, root)) && !mirrorText(name, root))
}

/**
 * The mirrors and slices the published notes' viewers draw that are not saved, by name: each one's
 * page shows its annotations without it.
 */
export const missingMirrors = (root: string = MIRRORS_ROOT, notes: Pick<Note, "frontmatter">[] = getNotes()): string[] =>
  shownNames(notes).filter((name) => !fs.existsSync(mirrorFile(name, root)))

/** A slice still to make: the pages `range` of the saved mirror `mirror`, saved as `slice`. */
export interface SliceToMake {
  slice: string
  mirror: string
  range: PageRange
}

/** The slices the published notes' viewers draw that are not saved, and whose mirror is: each once. */
export function slicesToMake(root: string = MIRRORS_ROOT, notes: Pick<Note, "frontmatter">[] = getNotes()): SliceToMake[] {
  const slices = new Map<string, SliceToMake>()
  for (const { frontmatter } of notes) {
    const target = annotationTarget(frontmatter)
    const mirror = target === undefined ? undefined : mirrorName(target)
    const range = annotationPages(frontmatter)
    if (!mirror || !range || !fs.existsSync(mirrorFile(mirror, root))) continue
    const slice = sliceName(mirror, range)
    if (!fs.existsSync(mirrorFile(slice, root))) slices.set(slice, { slice, mirror, range })
  }
  return [...slices.values()]
}

/**
 * Whether what a host answered with is a PDF: its header within the first kilobyte, where readers
 * look for it. A login page or a bot check must not be saved in a document's place.
 */
export const isPdf = (bytes: Uint8Array): boolean => Buffer.from(bytes.subarray(0, 1024)).includes("%PDF-")

/**
 * Which of `targets`, documents with no mirror, may be saved: each but those whose file names are
 * one, which would share a mirror, so that one page would show the other's document. Those are
 * listed, by the name they share, and none of them is saved.
 */
export function mirrorsToSave(targets: string[]): { save: string[]; clashing: [string, string[]][] } {
  const byName = Map.groupBy(targets, (target) => mirrorName(target)!)
  const clashing = [...byName].filter(([, sharing]) => sharing.length > 1)
  return { save: [...byName.values()].filter((sharing) => sharing.length === 1).flat(), clashing }
}

/**
 * The annotated documents of the published notes to download: on the web, with a file name, with
 * no mirror saved, and shown by a note whose mirror or slice is not saved either. A document whose
 * notes all have their slices needs no mirror of its own.
 */
export function unmirroredDocuments(root: string = MIRRORS_ROOT, notes: Pick<Note, "frontmatter">[] = getNotes()): string[] {
  const missing = new Set(missingMirrors(root, notes))
  const targets = notes
    .filter((note) => missing.has(shownMirrorName(note.frontmatter)!))
    .map((note) => annotationTarget(note.frontmatter)!)
  return [...new Set(targets)].filter((target) => !mirrorOf(target, root))
}
