// The graph index: the site's notes, their tags and the links between them, as the vault's metadata
// cache has them, which the site publishes for every graph to be drawn from (src/pages/graph.json.ts).
// It is built here, where the vault is read; what a graph makes of it is ./graph.ts's, which the
// browser runs too.
//
// A private page is in it, flagged: whether a graph draws one is that graph's setting. A tag's
// description note is in it at its tag page's address, which is where a link to it goes, so that a
// graph draws the note's links as the tag's, and a link to the note or to the tag's page as one to
// the tag.

import type { Vault } from "@chaoticgoodcomputing/obsidian-markdown"
import type { GraphIndex, IndexedNote } from "./graph.ts"
import { getNotes, getUnpublished, noteOf, unpublished, urlOfPath, type Note, type NoteFacts, type NoteIndex } from "./notes.ts"
import { tagAt } from "./page.ts"
import { getVault } from "./vault.ts"

export interface GraphIndexOptions {
  /** The vault and its notes' index. The site's by default; a test passes a vault of its own. */
  vault?: Vault
  index?: NoteIndex
}

// The site's, built once for the notes as the vault was last read.
const built = new WeakMap<Note[], GraphIndex>()

// Whether an address is a tag's page; the tags index is not one.
const isTagPage = (url: string | undefined): url is string => url !== undefined && tagAt(url)?.tag !== undefined

/**
 * The graph index of the published notes, in the vault's order, then the tag description notes of
 * the tags that have a page, each at that page's address. A note's links are the addresses it links
 * to or embeds, each once, the files it names first: a published note's page, or a tag's page, by
 * its description note or by a path no file has (`urlOfPath`). A link to itself, to any other
 * unpublished note or to an attachment is not among them.
 */
export function graphIndex(options: GraphIndexOptions = {}): GraphIndex {
  const { vault = getVault(), index } = options
  const notes = index?.notes ?? getNotes()
  const lookup = (file: string) => (index ? index.byPath.get(file) : noteOf(file))
  const pageAt = index ? index.urlOfPath : urlOfPath
  const cached = index ? undefined : built.get(notes)
  if (cached) return cached

  // The unpublished notes a link to goes to a tag's page: its description notes.
  const ruledOut = index ? [...index.unpublished.values()].flat() : unpublished.flatMap((rule) => getUnpublished(rule.reason))
  const descriptions = ruledOut.filter((note) => isTagPage(note.url))

  const indexed = (note: NoteFacts, url: string): IndexedNote => {
    const { resolvedLinks, unresolvedLinks } = vault.metadataCache
    const links = [
      ...Object.keys(resolvedLinks[note.file.path] ?? {}).map((file) => {
        const linked = lookup(file)
        return linked && (!("reason" in linked) || isTagPage(linked.url)) ? linked.url : undefined
      }),
      ...Object.keys(unresolvedLinks[note.file.path] ?? {}).map(pageAt),
    ]
    return {
      url,
      title: note.title,
      date: note.date.toISOString(),
      tags: note.tags,
      links: [...new Set(links.filter((link): link is string => link !== undefined && link !== url))],
      private: note.isPrivate,
    }
  }

  const graph: GraphIndex = {
    notes: [...notes.map((note) => indexed(note, note.url)), ...descriptions.map((note) => indexed(note, note.url!))],
  }
  if (!index) built.set(notes, graph)
  return graph
}
