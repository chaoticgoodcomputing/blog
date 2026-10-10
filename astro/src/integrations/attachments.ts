// The vault's attachments, published as they are (docs/adr/0101). Astro publishes files as they are
// from `public/`, and the vault is not in it (docs/adr/0002), so this integration does for the
// vault what Astro does for that folder: the dev server serves each attachment from where it is,
// and the build copies it to the same address. Which attachments those are is
// src/lib/attachments.ts's answer.

import path from "node:path"
import { fileURLToPath } from "node:url"
import type { AstroIntegration } from "astro"
import { copyIntoBuild, publishedAttachments, serveAttachments } from "../lib/attachments.ts"
import { getVault } from "../lib/vault.ts"

export function attachments(): AstroIntegration {
  return {
    name: "vault-attachments",
    hooks: {
      // Runs before Vite's own middleware and Astro's routes, as an integration's middleware does.
      "astro:server:setup": ({ server }) => {
        server.middlewares.use(serveAttachments(getVault().root))
      },

      "astro:build:done": async ({ dir, logger }) => {
        const vault = getVault()
        const files = [...publishedAttachments()].map(([address, file]): [string, string] => [address, path.join(vault.root, file.path)])
        const { copied, taken } = await copyIntoBuild(files, fileURLToPath(dir))
        // A file the build wrote is a page of the site's own, and the page stays.
        for (const address of taken) logger.warn(`${address.slice(1)} is not published: the build has a page at ${address}.`)
        logger.info(`${copied} attachments copied from the vault.`)
      },
    },
  }
}
