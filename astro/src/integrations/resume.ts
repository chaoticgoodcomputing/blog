// The resume, published at the address the vault's copy of it had (src/lib/resume.ts). It is
// compiled into dist/resume by `resume:build`, outside the vault, so the attachments integration
// never sees it. This one does for it what that one does for the vault's files: the dev server
// serves it from where it is, and the build copies it to its address.

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import type { AstroIntegration } from "astro"
import sirv from "sirv"
import { attachmentAddressOf, copyIntoBuild } from "../lib/attachments.ts"
import { RESUME_ADDRESS, RESUME_PDF, publishesResume } from "../lib/resume.ts"

export function resume(): AstroIntegration {
  return {
    name: "resume",
    hooks: {
      "astro:server:setup": ({ server }) => {
        const serve = sirv(path.dirname(RESUME_PDF), { dev: true, etag: true })
        server.middlewares.use((request, response, next) => {
          if (attachmentAddressOf(request.url ?? "/") !== RESUME_ADDRESS || !publishesResume()) return next()
          request.url = `/${path.basename(RESUME_PDF)}`
          serve(request, response, next)
        })
      },

      "astro:build:done": async ({ dir, logger }) => {
        if (!publishesResume()) return
        // A build run without `resume:build` first is built all the same, and its resume note's
        // viewer has nothing to show.
        if (!fs.existsSync(RESUME_PDF)) {
          logger.warn(`${RESUME_PDF} is missing, so ${RESUME_ADDRESS} is not published; \`pnpm nx run resume:build\` compiles it.`)
          return
        }
        const { taken } = await copyIntoBuild([[RESUME_ADDRESS, RESUME_PDF]], fileURLToPath(dir))
        if (taken.length) logger.warn(`The resume is not published: the build already has a file at ${RESUME_ADDRESS}.`)
        else logger.info(`The resume copied to ${RESUME_ADDRESS}.`)
      },
    },
  }
}
