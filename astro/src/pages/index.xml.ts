// The site's RSS feed, at /index.xml, where feed readers have followed it from the start
// (docs/adr/1501). Its items are ../lib/feed.ts's.
import rss from "@astrojs/rss"
import type { APIRoute } from "astro"
import { feedItems } from "../lib/feed.ts"
import { getPublicNotes } from "../lib/notes.ts"
import { feed, site } from "../site.config.ts"

export const GET: APIRoute = ({ site: address }) =>
  rss({
    title: site.title,
    description: `Last ${feed.limit} notes on ${site.title}`,
    site: address!,
    items: feedItems(getPublicNotes(), address!),
    customData: `<language>${site.locale.toLowerCase()}</language>`,
    // A page's address has no trailing slash (docs/adr/0003), and neither has an item's link.
    trailingSlash: false,
  })
