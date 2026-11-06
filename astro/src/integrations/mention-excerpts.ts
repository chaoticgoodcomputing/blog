// The mention excerpts (src/lib/mention-excerpts.ts): for each indexable note, one page for each
// site it links to, holding only its paragraphs that link there, written beside the pages under
// `/mentions`, and the manifest of them all, `/webmentions.json`, which the deploy sends
// (.github/workflows/scripts/webmention.mjs) and reads back from the live site on the next deploy
// to know what it sent before.
//
// Written after the build, from the pages it wrote, rather than by a route: what a note links to
// is in its rendered page, which no route can read. They are not in the sitemap or the search
// index, which know only the build's own pages, and each says `noindex`.

import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import type { AstroIntegration } from "astro"
import {
  MENTION_MANIFEST,
  excerptAddress,
  excerptBlock,
  excerptDigest,
  excerptPage,
  linkingBlocks,
  mentionTarget,
  noteAtBlock,
  type ManifestEntry,
} from "../lib/mention-excerpts.ts"
import { webAnnotationTarget } from "../lib/annotations.ts"
import { getNotes } from "../lib/notes.ts"
import { isIndexable } from "../lib/page.ts"
import { site as siteConfig } from "../site.config.ts"

export function mentionExcerpts(): AstroIntegration {
  let site: string
  return {
    name: "mention-excerpts",
    hooks: {
      "astro:config:done": ({ config }) => {
        site = config.site!
      },

      "astro:build:done": async ({ dir, pages, logger }) => {
        const out = fileURLToPath(dir)
        const notes = new Map(getNotes().map((note) => [note.url, note]))
        const author = { name: siteConfig.author.name, url: new URL(siteConfig.author.url, site).href }
        const manifest: ManifestEntry[] = []

        // A page's pathname is its address without the leading `/`: `""` for the home page.
        for (const { pathname } of pages) {
          const url = `/${pathname}`
          const note = notes.get(url)
          if (!note || !isIndexable({ kind: "note", note })) continue
          const file = path.join(out, url === "/" ? "index.html" : `${url}.html`)
          const noteAddress = new URL(url, site).href
          // A web page's annotation page answers the page it annotates.
          const annotated = webAnnotationTarget(note)
          const answers = annotated === undefined ? undefined : mentionTarget(annotated)

          for (const [target, blocks] of linkingBlocks(await fs.readFile(file, "utf8"), site)) {
            const address = excerptAddress(url, target)
            const source = new URL(address, site).href
            const excerpt = blocks.map((block) => excerptBlock(block, noteAddress))
            const facts = { title: note.title, url, date: note.date }
            const inReplyTo = target === answers ? target : undefined
            const html = excerptPage({
              address: source,
              noteAddress,
              note: facts,
              blocks: excerpt,
              continueTo: noteAtBlock(noteAddress, blocks[0]!.text),
              author,
              locale: siteConfig.locale,
              inReplyTo,
            })
            const written = path.join(out, `${address}.html`)
            await fs.mkdir(path.dirname(written), { recursive: true })
            await fs.writeFile(written, html)
            manifest.push({ source, target, note: noteAddress, digest: excerptDigest(facts, excerpt, inReplyTo) })
          }
        }

        manifest.sort((a, b) => a.source.localeCompare(b.source))
        await fs.writeFile(path.join(out, MENTION_MANIFEST), `${JSON.stringify(manifest, null, 2)}\n`)
        logger.info(`${manifest.length} mention excerpts, of ${new Set(manifest.map((each) => each.note)).size} notes.`)
      },
    },
  }
}
