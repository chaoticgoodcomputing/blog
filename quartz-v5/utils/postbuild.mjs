// Finishes a build of the real site: puts the site's own files into it. Run by site-v5's `build`
// target after `quartz build`, as v4's `_postbuild` did, so it runs after every emitter has finished.
// - Root-level files. v5's Static emitter writes only under `/static/`, and a file at the site root
//   that no plugin owns is the site's (FORK-LEDGER, "Root-level files").
// - The site's icon (#44, #70). Quartz reads the icon from inside the vendored copy,
//   `quartz/static/icon.png`: the Static emitter copies it, core's Head links it and the favicon
//   plugin draws `favicon.ico` from it. The site's own replaces both outputs here. A site emitter
//   could not: full builds run emitters at once, so it would race the Static emitter's copy.
//
// Usage: node quartz-v5/utils/postbuild.mjs [output directory, default quartz-v5/quartz/public]
import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const sharp = createRequire(path.join(root, "quartz", "package.json"))("sharp")

// Each file of the site's, relative to `quartz-v5/`, and where it goes in the built site.
const SITE_FILES = [
  // Hand-written. Keeps cgc-annotator's mirrors out of search (#37).
  { from: "robots.txt", to: "robots.txt" },
  // The site's icon, over stock's: what the head links and the page title shows.
  { from: "icon.png", to: "static/icon.png" },
]

// Drawn from the site's icon as the favicon plugin draws stock's, and as v4 drew it: 48px, PNG.
const FAVICON = { from: "icon.png", to: "favicon.ico", size: 48 }

export async function postbuild(output) {
  for (const { from, to } of SITE_FILES) {
    const dest = path.join(output, to)
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.copyFileSync(path.join(root, from), dest)
  }
  const favicon = await sharp(path.join(root, FAVICON.from)).resize(FAVICON.size, FAVICON.size).png().toBuffer()
  fs.writeFileSync(path.join(output, FAVICON.to), favicon)
  return [...SITE_FILES.map(({ to }) => to), FAVICON.to]
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const output = path.resolve(process.argv[2] ?? path.join(root, "quartz", "public"))
  console.log(`wrote ${(await postbuild(output)).join(", ")} into ${path.relative(process.cwd(), output) || "."}`)
}
