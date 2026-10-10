// The suite's build of a vault, as files: where it is, and the pages it wrote. A server can't say
// which pages it has, which a spec that checks every page needs, so they are read from the build's
// files here. This file and ./github-pages.ts, which reads the build's file names as GitHub Pages
// would serve them, are the only places a spec reads the build rather than asking the server for it
// (README.md, "Tests").

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

/** Which vault the suite builds (playwright.config.ts). */
export type Site = "fixture" | "vault"

/** Where the suite writes its build of a vault, from the project's root: beside `dist`, never in it. */
export const builtSite = (site: Site) => `.e2e/${site}/dist`

/** The folder of the suite's build of a vault, as an absolute path ending in `/`. */
export const buildRoot = (site: Site) => fileURLToPath(new URL(`../../${builtSite(site)}/`, import.meta.url))

/** A page the build wrote: its file in the build, the address it is served at, and its HTML. */
export interface BuiltPage {
  file: string
  address: string
  html: string
}

/**
 * Every page the suite's build of a vault wrote in the site shell, the 404 page and private pages
 * among them: not an alias's redirect, nor an HTML attachment of the vault's.
 */
export function builtPages(site: Site): BuiltPage[] {
  const root = buildRoot(site)
  const pages: BuiltPage[] = []
  for (const name of fs.readdirSync(root, { recursive: true, encoding: "utf8" })) {
    if (!name.endsWith(".html")) continue
    const html = fs.readFileSync(path.join(root, name), "utf8")
    if (!html.includes("site-title")) continue
    const file = name.split(path.sep).join("/")
    pages.push({ file, address: `/${encodeURI(file.replace(/\.html$/, "").replace(/^index$/, ""))}`, html })
  }
  return pages
}

/** The address of every page the build wrote but the 404 page, private pages among them. */
export function builtAddresses(site: Site): string[] {
  return builtPages(site).flatMap(({ file, address }) => (file === "404.html" ? [] : [address]))
}
