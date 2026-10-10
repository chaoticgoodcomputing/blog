// What GitHub Pages, which serves the site, would answer at an address of the suite's build. Pages
// answers from the build's files and tells case apart: `/a` is the file `a`, else `a.html`, else the
// folder `a/`'s `index.html`, by way of `/a/`. `astro preview` serves the same build, but on a disk
// that ignores case, as a Mac's does, it answers `/a` from `A.html` too, and a spec over HTTP can't
// tell whether a former address has a redirect of its own (docs/adr/2901). So these read the names
// of the build's files, as Pages does (README.md, "Tests"). The pages the build wrote are ./build.ts's.

import fs from "node:fs"
import path from "node:path"
import { buildRoot, type Site } from "./build.ts"

/** Where a redirect page Astro writes sends the reader, or nothing for a page. */
export const forwardsTo = (html: string) => /<meta http-equiv="refresh" content="0;url=([^"]*)"/.exec(html)?.[1]

/** A file of the build that Pages would serve, by its path in the build, and what it holds. */
export interface Served {
  file: string
  contents: Buffer
  /** Where it forwards the reader, if it is a redirect page. */
  forwardsTo?: string
}

/** The build of a vault as GitHub Pages would serve it. */
export function githubPages(site: Site) {
  const root = buildRoot(site)
  const files = new Set<string>()
  const folders = new Set<string>([""])
  for (const entry of fs.readdirSync(root, { recursive: true, withFileTypes: true })) {
    const name = path.relative(root, path.join(entry.parentPath, entry.name)).split(path.sep).join("/")
    if (entry.isDirectory()) folders.add(name)
    else files.add(name)
  }

  /** The file Pages serves at an address, or nothing where it answers with the 404 page. */
  function fileAt(address: string): string | undefined {
    const wanted = decodeURI(address).replace(/^\//, "")
    if (wanted === "" || wanted.endsWith("/")) return files.has(`${wanted}index.html`) ? `${wanted}index.html` : undefined
    if (files.has(wanted)) return wanted
    if (files.has(`${wanted}.html`)) return `${wanted}.html`
    if (folders.has(wanted) && files.has(`${wanted}/index.html`)) return `${wanted}/index.html`
    return undefined
  }

  /** What Pages serves at an address, or nothing. */
  function serve(address: string): Served | undefined {
    const file = fileAt(address)
    if (file === undefined) return undefined
    const contents = fs.readFileSync(path.join(root, file))
    return { file, contents, forwardsTo: file.endsWith(".html") ? forwardsTo(contents.toString("utf8")) : undefined }
  }

  /** What a reader ends on from an address, following a redirect page once as a browser would. */
  function landing(address: string): (Served & { address: string }) | undefined {
    const first = serve(address)
    if (first?.forwardsTo === undefined) return first && { address, ...first }
    const next = serve(first.forwardsTo)
    return next && { address: first.forwardsTo, ...next }
  }

  return { serve, landing }
}
