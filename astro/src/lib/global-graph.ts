// The global graph: every note and tag of the site, filtered by the reader to a time period and to
// whether private pages are drawn. Pure, and run in the browser on the graph index it fetches; how
// it is laid out, around its pinned tags, is src/lib/graph-layout.ts's.

import type { GlobalGraphSettings, TimePeriod } from "../site.config.types.ts"
import { graphOf, type Graph, type GraphIndex, type IndexedNote } from "./graph.ts"
import { TAGS_INDEX, tagAncestors } from "./tags.ts"

/** What the reader has chosen to see. */
export interface GraphFilter {
  period: TimePeriod
  includePrivate: boolean
}

/** The periods, narrowest first: the order a period is widened in. */
export const TIME_PERIODS: TimePeriod[] = ["month", "year", "all"]

// The earliest moment a period holds, at `now`: a calendar month or year before it, on the same day
// of the month, or on the last day of a month that has no such day (31 March's month is from 28
// February, 29 February's year from 28 February).
function since(period: TimePeriod, now: Date): Date | undefined {
  if (period === "all") return undefined
  const [year, month] =
    period === "month" ? [now.getUTCFullYear(), now.getUTCMonth() - 1] : [now.getUTCFullYear() - 1, now.getUTCMonth()]
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const start = new Date(now)
  start.setUTCFullYear(year, month, Math.min(now.getUTCDate(), lastDay))
  return start
}

// A note at a tag page's address is the tag's description note, which goes with the tag.
const isTagPage = (note: IndexedNote) => note.url.startsWith(`${TAGS_INDEX}/`)

// The notes, not tag description notes, that the filter keeps, and those of `keep` whatever it says.
function postsOf(index: GraphIndex, { period, includePrivate }: GraphFilter, now: Date, keep: ReadonlySet<string> = new Set()): IndexedNote[] {
  const start = since(period, now)
  return index.notes.filter(
    (note) =>
      !isTagPage(note) &&
      (keep.has(note.url) || ((includePrivate || !note.private) && (start === undefined || new Date(note.date) >= start))),
  )
}

/**
 * The global graph, as `settings` (site configuration's `graph.global`) draws it, of the notes the
 * filter keeps: those dated within its period, a private page only when it asks for them. A tag's
 * description note is drawn as the tag, and so only while a note kept carries the tag or a tag under
 * it.
 */
export function globalGraph(
  index: GraphIndex,
  settings: Pick<GlobalGraphSettings, "removeTags" | "privatePages">,
  filter: GraphFilter,
  now: Date,
  // Notes drawn whatever the filter says: a reader's trail.
  keep: string[] = [],
): Graph {
  const posts = postsOf(index, filter, now, new Set(keep))
  const carried = new Set(posts.flatMap((note) => note.tags.flatMap((tag) => [...tagAncestors(tag), tag])))
  const descriptions = index.notes.filter((note) => isTagPage(note) && carried.has(note.url.slice(TAGS_INDEX.length + 1)))
  return graphOf({ notes: [...posts, ...descriptions] }, { removeTags: settings.removeTags, privatePages: settings.privatePages })
}

/**
 * The period the global graph opens on: the configured one, widened until it holds at least
 * `minPosts` posts, or every post there is.
 */
export function defaultPeriod(index: GraphIndex, filters: GlobalGraphSettings["filters"], now: Date): TimePeriod {
  const { timePeriod, includePrivate, minPosts } = filters
  const wider = TIME_PERIODS.slice(TIME_PERIODS.indexOf(timePeriod))
  return wider.find((period) => postsOf(index, { period, includePrivate }, now).length >= minPosts) ?? "all"
}
