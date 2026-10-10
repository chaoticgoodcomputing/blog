// The mirrors of the annotated documents, published at their path in the vault (docs/adr/2801).
// They are saved in the vault's mirror directory, which git ignores, so they are no files of the
// vault the site reads, and the attachments integration never sees them. This one does for them
// what that one does for the vault's files: the dev server serves each from where it is, and the
// build copies it to the same address. Which mirrors those are is src/lib/mirrors.ts's answer.

import path from "node:path"
import { fileURLToPath } from "node:url"
import type { AstroIntegration } from "astro"
import sirv from "sirv"
import { attachmentAddressOf, copyIntoBuild } from "../lib/attachments.ts"
import { MIRRORS, publishedMirrors, unmirroredDocuments } from "../lib/mirrors.ts"
import { getVault } from "../lib/vault.ts"

export function mirrors(): AstroIntegration {
  return {
    name: "annotation-mirrors",
    hooks: {
      "astro:server:setup": ({ server }) => {
        const serve = sirv(path.join(getVault().root, MIRRORS), { dev: true, etag: true })
        server.middlewares.use((request, response, next) => {
          // Asked on every request, so a mirror saved while the server runs is served too.
          const address = attachmentAddressOf(request.url ?? "/")
          if (address === undefined || !publishedMirrors().has(address)) return next()
          request.url = request.url!.slice(`/${MIRRORS}`.length)
          serve(request, response, next)
        })
      },

      "astro:build:done": async ({ dir, logger }) => {
        // A mirror already there is one git does not ignore: a file of the vault, which the
        // attachments integration has copied to the same address.
        const { copied } = await copyIntoBuild(publishedMirrors(), fileURLToPath(dir))
        logger.info(`${copied} mirrors copied from the vault.`)
        // A page whose document has no mirror is built all the same, with its annotations alone.
        const unmirrored = unmirroredDocuments()
        if (unmirrored.length) {
          logger.warn(
            `${unmirrored.length} annotated documents have no mirror, and their pages no viewer; ` +
              `\`pnpm nx run astro:mirrors\` saves them: ${unmirrored.join(", ")}`,
          )
        }
      },
    },
  }
}
