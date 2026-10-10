// The feed's items: the site's newest articles that are posts, as @astrojs/rss takes them. The
// feed itself is the endpoint src/pages/index.xml.ts.

import type { RSSFeedItem } from "@astrojs/rss"
import type { Vault } from "@chaoticgoodcomputing/obsidian-markdown"
import { feed } from "../site.config.ts"
import { formerAddress } from "./former-addresses.ts"
import { newestFirst, type Note } from "./notes.ts"
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
 * The feed's items from `notes`, newest first: each article among them whose page is not private,
 * up to `limit`. `site` is the site's address, which an item's identifier is written against, and
 * `vault` the vault the notes are of.
 */
export function feedItems(
  notes: Note[],
  site: URL,
  { limit = feed.limit, vault = getVault() }: { limit?: number; vault?: Vault } = {},
): RSSFeedItem[] {
  return notes
    .filter((note) => note.isArticle && !note.isPrivate)
    .sort(newestFirst)
    .slice(0, limit)
    .map((note) => {
      const identifier = feedIdentifier(note, site)
      return {
        title: note.title,
        link: note.url,
        pubDate: note.date,
        // An item with no description of its own is described by how long it takes to read, as
        // the site's feed has always described one, so that a reader has a line under its title.
        description: note.description ?? `(${readingMinutes(note, vault)} min read)`,
        categories: note.tags,
        // @astrojs/rss writes an item's link as its identifier, which is right wherever the two
        // are the same. Where they are not, the item says its own, and that it is no address.
        ...(identifier === new URL(note.url, site).href
          ? {}
          : { customData: `<guid isPermaLink="false">${identifier.replace(/&/g, "&amp;")}</guid>` }),
      }
    })
}
