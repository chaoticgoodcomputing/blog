// Finishes a build of the real site: copies the site's own root-level files into it. Run by
// site-v5's `build` target after `quartz build`, as v4's `_postbuild` did. v5's Static emitter
// writes only under `/static/`, and a file at the site root that no plugin owns is the site's
// (FORK-LEDGER, "Root-level files").
//
// Usage: node quartz-v5/utils/postbuild.mjs [output directory, default quartz-v5/quartz/public]
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

// Each file of the site's, relative to `quartz-v5/`, and where it goes in the built site.
const SITE_FILES = [
  // Hand-written. Keeps cgc-annotator's mirrors out of search (#37).
  { from: "robots.txt", to: "robots.txt" },
]

export function postbuild(output) {
  for (const { from, to } of SITE_FILES) {
    const dest = path.join(output, to)
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.copyFileSync(path.join(root, from), dest)
  }
  return SITE_FILES.map(({ to }) => to)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const output = path.resolve(process.argv[2] ?? path.join(root, "quartz", "public"))
  console.log(`copied ${postbuild(output).join(", ")} into ${path.relative(process.cwd(), output) || "."}`)
}
