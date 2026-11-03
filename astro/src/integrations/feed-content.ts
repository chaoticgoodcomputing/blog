// Writes the feed again once the build has written the pages, each item with its page's content
// (src/lib/feed-content.ts). The endpoint src/pages/index.xml.ts wrote it without: an endpoint is
// rendered before the pages are, and the content is made from them.

import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { getRssString } from "@astrojs/rss"
import type { AstroIntegration } from "astro"
import { getDrawingPngs } from "../lib/drawings.ts"
import { feedContent } from "../lib/feed-content.ts"
import { feedNotes, feedOptions } from "../lib/feed.ts"
import { getPublicNotes, type Note } from "../lib/notes.ts"

export function feedContentIntegration(): AstroIntegration {
  let site: URL
  return {
    name: "feed-content",
    hooks: {
      "astro:config:done": ({ config }) => {
        if (!config.site) throw new Error("The feed's content needs the site's address: `site` in astro.config.ts")
        site = new URL(config.site)
      },

      "astro:build:done": async ({ dir, logger }) => {
        const out = fileURLToPath(dir)
        const notes = getPublicNotes()
        const pngs = getDrawingPngs()
        const content = new Map<Note, string>()
        for (const note of feedNotes(notes)) {
          const file = path.join(out, `${decodeURI(note.url)}.html`)
          content.set(note, feedContent(note, await fs.readFile(file, "utf8"), site, pngs))
        }
        await fs.writeFile(path.join(out, "index.xml"), await getRssString(feedOptions(notes, site, (note) => content.get(note))))
        logger.info(`The feed, with the content of its ${content.size} items.`)
      },
    },
  }
}
