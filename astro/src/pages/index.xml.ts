// The site's RSS feed, at /index.xml, where feed readers have followed it from the start
// (docs/adr/1501). Its items are ../lib/feed.ts's. This is the feed the dev server serves; the
// build writes it again with each item's content (src/integrations/feed-content.ts).
import rss from "@astrojs/rss"
import type { APIRoute } from "astro"
import { feedOptions } from "../lib/feed.ts"
import { getPublicNotes } from "../lib/notes.ts"

export const GET: APIRoute = ({ site: address }) => rss(feedOptions(getPublicNotes(), address!))
