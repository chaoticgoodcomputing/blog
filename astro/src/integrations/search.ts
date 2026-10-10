// The site's search index, built by Pagefind from the pages the build wrote (docs/adr/1901). Only
// the pages src/lib/search.ts names are in it: no private page, no private tag page, no 404 page
// and no alias redirect. The index is written to `/pagefind`, beside the pages, and the search box
// (src/components/Search.astro) loads it from there when a reader searches.

import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import type { AstroIntegration } from "astro"
import * as pagefind from "pagefind"
import sirv from "sirv"
import { isSearched } from "../lib/search.ts"
import { SEARCH_INDEX } from "../lib/search-index.ts"

export function search(): AstroIntegration {
  let outDir: string
  return {
    name: "search",
    hooks: {
      "astro:config:done": ({ config }) => {
        outDir = fileURLToPath(config.outDir)
      },

      // The dev server writes no pages to index, so it serves the index the last build wrote, as
      // the build left it. With no build yet, the search box says it has nothing to search.
      "astro:server:setup": ({ server }) => {
        server.middlewares.use(`/${SEARCH_INDEX}`, sirv(path.join(outDir, SEARCH_INDEX), { dev: true }))
      },

      "astro:build:done": async ({ dir, pages, logger }) => {
        const out = fileURLToPath(dir)
        const { index, errors } = await pagefind.createIndex({
          // A page's own content, its title over it and its body, and not the site shell around it:
          // the sidebars and the footer are the same on every page, and what follows the body (a
          // listing of other pages, the subscribe box) is about other pages. Nor the furniture under
          // the title, its date, reading time and tag badges: every note has them, so each would
          // make every page a match for "min read" or a year, and a result's passage would be them.
          rootSelector: "main",
          excludeSelectors: [".after-body", ".date-and-reading-time", ".tag-list"],
        })
        if (!index) throw new Error(`Pagefind could not start: ${errors.join("; ")}`)
        try {
          let searched = 0
          // A page's pathname is its address without the leading `/`: `""` for the home page.
          for (const { pathname } of pages) {
            const url = `/${pathname}`
            if (!isSearched(url)) continue
            const file = path.join(out, url === "/" ? "index.html" : `${url}.html`)
            const added = await index.addHTMLFile({ url, content: await fs.readFile(file, "utf8") })
            if (added.errors.length) throw new Error(`${url} is not in the search index: ${added.errors.join("; ")}`)
            searched++
          }
          const written = await index.writeFiles({ outputPath: path.join(out, SEARCH_INDEX) })
          if (written.errors.length) throw new Error(`The search index is not written: ${written.errors.join("; ")}`)
          logger.info(`${searched} pages in the search index.`)
        } finally {
          await pagefind.close()
        }
      },
    },
  }
}
