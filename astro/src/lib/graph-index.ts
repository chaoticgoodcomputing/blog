// The graph index: the site's notes, their tags and the links between them, as the vault's metadata
// cache has them, which the site publishes for every graph to be drawn from (src/pages/graph.json.ts).
// It is built here, where the vault is read; what a graph makes of it is ./graph.ts's, which the
// browser runs too.
//
// A private page is in it, flagged: whether a graph draws one is that graph's setting. A tag's
// description note is in it at its tag page's address, which is where a link to it goes, so that a
// graph draws the note's links as the tag's, and a link to the note or to the tag's page as one to
// the tag.

import type { GraphIndex, IndexedNote } from "./graph.ts"
import { getNoteIndex, getNotes, getUnpublished, unpublished, type Note, type NoteFacts, type NoteIndex } from "./notes.ts"
import { tagAt } from "./page.ts"

export interface GraphIndexOptions {
  /** The notes index. The site's by default; a test passes one of its own. */
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
  const { index } = options
  const notes = index?.notes ?? getNotes()
  const linking = index ?? getNoteIndex()
  const cached = index ? undefined : built.get(notes)
  if (cached) return cached

  // The unpublished notes a link to goes to a tag's page: its description notes.
  const ruledOut = index ? [...index.unpublished.values()].flat() : unpublished.flatMap((rule) => getUnpublished(rule.reason))
  const descriptions = ruledOut.filter((note) => isTagPage(note.url))

  const indexed = (note: NoteFacts, url: string): IndexedNote => {
    const links = [...linking.outlinks(note).map((linked) => linked.url), ...linking.tagLinks(note)]
    return {
      url,
      title: note.title,
      ...(note.date && { date: note.date.toISOString() }),
      tags: note.tags,
      links: [...new Set(links.filter((link) => link !== url))],
      private: note.isPrivate,
    }
  }

  const graph: GraphIndex = {
    notes: [...notes.map((note) => indexed(note, note.url)), ...descriptions.map((note) => indexed(note, note.url!))],
  }
  if (!index) built.set(notes, graph)
  return graph
}
