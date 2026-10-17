// The mirrors of the annotated documents, published under assets/annotated-documents
// (docs/adr/2801). They are saved in the mirror directory, dist/mirrors, so they are no files of
// the vault the site reads, and the attachments integration never sees them. This one does for them
// what that one does for the vault's files: the dev server serves each from where it is, and the
// build copies it to its address. Which mirrors those are is src/lib/mirrors.ts's answer.

import { fileURLToPath } from "node:url"
import type { AstroIntegration } from "astro"
import sirv from "sirv"
import { attachmentAddressOf, copyIntoBuild } from "../lib/attachments.ts"
import { MIRRORS, MIRRORS_ROOT, publishedMirrors, unmirroredDocuments } from "../lib/mirrors.ts"

export function mirrors(): AstroIntegration {
  return {
    name: "annotation-mirrors",
    hooks: {
      "astro:server:setup": ({ server }) => {
        const serve = sirv(MIRRORS_ROOT, { dev: true, etag: true })
        server.middlewares.use((request, response, next) => {
          // Asked on every request, so a mirror saved while the server runs is served too.
          const address = attachmentAddressOf(request.url ?? "/")
          if (address === undefined || !publishedMirrors().has(address)) return next()
          request.url = request.url!.slice(`/${MIRRORS}`.length)
          serve(request, response, next)
        })
      },

      "astro:build:done": async ({ dir, logger }) => {
        // A mirror already there is a file of the vault at the same address, which the attachments
        // integration has copied.
        const { copied } = await copyIntoBuild(publishedMirrors(), fileURLToPath(dir))
        logger.info(`${copied} mirrors copied from the mirror directory.`)
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
