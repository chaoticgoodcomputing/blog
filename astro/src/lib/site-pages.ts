// The site's pages: every page the site builds, each described once. A route shows the page it is
// given, and what knows a page only by its address (the sitemap, search, the Markdown copies) asks
// for it here, so that a page's title, description and indexability are decided in one place.

import { isAnnotationPage } from "./annotations.ts"
import type { Note, NoteIndex, UnpublishedNote } from "./notes.ts"
import { GRAPH_PAGE, isDiscoverable, isIndexable, type PageKind } from "./page.ts"
import { tagPages, tagPageTitle } from "./tag-pages.ts"
import { TAGS_INDEX, tagUrl } from "./tags.ts"

/** One page of the site, as everything that shows or lists it describes it. */
export interface SitePage {
  kind: PageKind
  /** Its address from the site's root, not percent-encoded. */
  url: string
  /** Its title, without the site's suffix. */
  title: string
  /** Its description (a note's, see `NoteFacts.description`), or none. */
  description: string | undefined
  /** The note it shows: its own, or on a tag page the tag's description note. */
  note?: Note | UnpublishedNote | undefined
  /** On a tag page, the tag, as a tag slug; none on the tags index. */
  tag?: string | undefined
  /** Whether the site helps a reader find it: in its search, with a share card. */
  discoverable: boolean
  /** Whether it asks search engines to index it, and is in the sitemap. */
  indexable: boolean
}

const GRAPH_DESCRIPTION = "Every page of the site, and how they connect."

const described = new WeakMap<NoteIndex, { pages: SitePage[]; byUrl: Map<string, SitePage> }>()

function describe(index: NoteIndex): { pages: SitePage[]; byUrl: Map<string, SitePage> } {
  const known = described.get(index)
  if (known) return known
  const page = (props: Omit<SitePage, "discoverable" | "indexable">): SitePage => ({
    ...props,
    discoverable: isDiscoverable(props),
    indexable: isIndexable(props),
  })
  const pages: SitePage[] = [
    ...index.notes.map((note) =>
      page({
        kind: note.url === "/" ? "home" : isAnnotationPage(note) ? "annotation" : "note",
        url: note.url,
        title: note.title,
        description: note.description,
        note,
      }),
    ),
    ...tagPages(index.notes).map((tag) => {
      const { title, description } = tagPageTitle(tag, index)
      return page({ kind: "tag", url: tagUrl(tag), title, description, note: index.tagDescription(tag), tag })
    }),
    page({ kind: "tag", url: TAGS_INDEX, title: tagPageTitle(undefined, index).title, description: undefined }),
    page({ kind: "404", url: "/404", title: "Not Found", description: undefined }),
    page({ kind: "graph", url: GRAPH_PAGE, title: "Graph", description: GRAPH_DESCRIPTION }),
  ]
  const result = { pages, byUrl: new Map(pages.map((each) => [each.url, each])) }
  described.set(index, result)
  return result
}

/** Every page the site builds. */
export const sitePages = (index: NoteIndex): SitePage[] => describe(index).pages

/** The page at an address, from the site's root and not percent-encoded; undefined where there is none. */
export const sitePageAt = (index: NoteIndex, url: string): SitePage | undefined => describe(index).byUrl.get(url)
