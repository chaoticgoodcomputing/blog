// Writes a Markdown copy of each indexable note's page beside it, and the site's llms.txt
// (src/lib/markdown-copies.ts), once the build has written the pages they are made from.

import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import type { AstroIntegration } from "astro"
import { copiedNotes, llmsTxt, markdownCopy, markdownCopyUrl } from "../lib/markdown-copies.ts"
import { getNotes } from "../lib/notes.ts"

export function markdownCopies(): AstroIntegration {
  let site: URL
  return {
    name: "markdown-copies",
    hooks: {
      "astro:config:done": ({ config }) => {
        if (!config.site) throw new Error("The Markdown copies need the site's address: `site` in astro.config.ts")
        site = new URL(config.site)
      },

      "astro:build:done": async ({ dir, logger }) => {
        const out = fileURLToPath(dir)
        const notes = getNotes()
        const copied = copiedNotes(notes)
        for (const note of copied) {
          const html = await fs.readFile(path.join(out, note.url === "/" ? "index.html" : `${decodeURI(note.url)}.html`), "utf8")
          const file = path.join(out, decodeURI(markdownCopyUrl(note.url)))
          await fs.mkdir(path.dirname(file), { recursive: true })
          await fs.writeFile(file, markdownCopy(note, html, site))
        }
        await fs.writeFile(path.join(out, "llms.txt"), llmsTxt(notes, site))
        logger.info(`${copied.length} Markdown copies, and llms.txt.`)
      },
    },
  }
}
