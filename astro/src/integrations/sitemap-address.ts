// The sitemap at /sitemap.xml, the address the site has always given it and the one search consoles
// have on file, as well as at /sitemap-index.xml, where @astrojs/sitemap writes it (docs/adr/1501).
// The file is the integration's index as it wrote it, so what is in the sitemap stays the
// integration's to decide. It runs after the integration's own `astro:build:done`, so it comes
// after `sitemap()` in the config's integrations.

import fs from "node:fs/promises"
import type { AstroIntegration } from "astro"

export function sitemapAddress(): AstroIntegration {
  return {
    name: "sitemap-address",
    hooks: {
      "astro:build:done": async ({ dir }) => {
        await fs.copyFile(new URL("sitemap-index.xml", dir), new URL("sitemap.xml", dir))
      },
    },
  }
}
