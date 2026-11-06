// The feed's items: the site's newest articles that are posts, as @astrojs/rss takes them, and the
// feed they are in. The endpoint src/pages/index.xml.ts serves the feed; once the build has written
// the pages, src/integrations/feed-content.ts writes it again, each item with its page's content.

import type { RSSFeedItem, RSSOptions } from "@astrojs/rss"
import type { Vault } from "@chaoticgoodcomputing/obsidian-markdown"
import { feed, site as siteConfig } from "../site.config.ts"
import { formerAddress } from "./former-addresses.ts"
import { isFragment, newestFirst, type Note } from "./notes.ts"
import { readingMinutes } from "./reading-time.ts"
import { getVault } from "./vault.ts"

/**
 * What a feed reader knows a note's item by: the address the site's feed has always written for
 * the note, its former address: its page's in lower case, and for an MDX note with `.mdx` after
 * it. A reader shows an item whose identifier it has not seen as new, so this never changes
 * (docs/adr/1502).
 */
export function feedIdentifier(note: Note, site: URL): string {
  return new URL(formerAddress(note), site).href.replace(/\/$/, "")
}

/**
 * An item's categories: every part of each of its note's tags, each once, the explicit first. A
 * tag's last part is explicit, the tag the note names, and each part above it implicit, the less
 * specific the farther above: `horticulture/seasons/stamps` names `stamps`, and implies `seasons`,
 * then `horticulture`. So the explicit parts come first, then the parts one above an explicit one,
 * then two above, and parts alike keep the note's order. A part both named and implied is explicit.
 * A part in `excluded` is none.
 *
 * A site that imports the feed reads them as tags of its own, which have no hierarchy, and may keep
 * only the first few: DEV keeps four, and a category's letters and digits alone, so `engineering/ai`
 * would be `engineeringai` there.
 */
export function feedCategories(tags: string[], excluded: string[] = feed.excludedCategories): string[] {
  // How far each part is above the part a tag names: none for the named part itself.
  const above = new Map<string, number>()
  for (const tag of tags) {
    const parts = tag.split("/")
    parts.forEach((part, index) => {
      if (!excluded.includes(part)) above.set(part, Math.min(above.get(part) ?? Infinity, parts.length - index - 1))
    })
  }
  // A sort is stable: parts alike keep the order they were met in, the note's.
  return [...above.keys()].sort((a, b) => above.get(a)! - above.get(b)!)
}

/** The notes the feed holds, newest first: each article whose page is neither private nor a fragment, up to `limit`. */
export const feedNotes = (notes: Note[], limit = feed.limit): Note[] =>
  notes
    .filter((note) => note.isArticle && !note.isPrivate && !isFragment(note.tags))
    .sort(newestFirst)
    .slice(0, limit)

/**
 * The feed's items from `notes`, newest first: each of `feedNotes`. `site` is the site's address,
 * which an item's identifier is written against, and `vault` the vault the notes are of. With
 * `content`, an item has its note's page's content where `content` gives it some.
 */
export function feedItems(
  notes: Note[],
  site: URL,
  {
    limit = feed.limit,
    vault = getVault(),
    content,
  }: { limit?: number; vault?: Vault; content?: (note: Note) => string | undefined } = {},
): RSSFeedItem[] {
  return feedNotes(notes, limit)
    .map((note) => {
      const html = content?.(note)
      const identifier = feedIdentifier(note, site)
      return {
        title: note.title,
        link: note.url,
        pubDate: note.date,
        // An item with no description of its own is described by how long it takes to read, as
        // the site's feed has always described one, so that a reader has a line under its title.
        description: note.summary ?? `(${readingMinutes(note, vault)} min read)`,
        categories: feedCategories(note.tags),
        ...(html !== undefined && { content: html }),
        // @astrojs/rss writes an item's link as its identifier, which is right wherever the two
        // are the same. Where they are not, the item says its own, and that it is no address.
        ...(identifier === new URL(note.url, site).href
          ? {}
          : { customData: `<guid isPermaLink="false">${identifier.replace(/&/g, "&amp;")}</guid>` }),
      }
    })
}

/** The feed: the site's, with `feedItems`'s items, and their content where `content` gives it. */
export function feedOptions(
  notes: Note[],
  site: URL,
  content?: (note: Note) => string | undefined,
): RSSOptions {
  return {
    title: siteConfig.title,
    description: `Last ${feed.limit} notes on ${siteConfig.title}`,
    site,
    items: feedItems(notes, site, content ? { content } : {}),
    xmlns: { atom: "http://www.w3.org/2005/Atom" },
    // Its WebSub hub, and its own address, which a hub knows it by (https://www.w3.org/TR/websub/#discovery).
    customData: [
      `<language>${siteConfig.locale.toLowerCase()}</language>`,
      `<atom:link rel="hub" href="${feed.hub}"/>`,
      `<atom:link rel="self" href="${new URL("/index.xml", site).href}" type="application/rss+xml"/>`,
    ].join(""),
    // A page's address has no trailing slash (docs/adr/0003), and neither has an item's link.
    trailingSlash: false,
  }
}
