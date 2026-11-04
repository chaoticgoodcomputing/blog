// The vault's footnotes, checked when the site builds and when the dev server starts: a reference
// with no definition, and a definition no reference cites, each reported by note
// (src/lib/footnotes.ts). The build goes on; the page still renders, only without the footnote.

import type { AstroIntegration, AstroIntegrationLogger } from "astro"
import { footnoteProblems } from "../lib/footnotes.ts"
import { getNotes } from "../lib/notes.ts"
import { getVault } from "../lib/vault.ts"

const quoted = (labels: string[]) => labels.map((label) => `[^${label}]`).join(", ")

function report(logger: AstroIntegrationLogger): void {
  const vault = getVault()
  for (const note of getNotes()) {
    const source = vault.read(note.file)
    if (source === null) continue
    const { missing, unused } = footnoteProblems(source, { mdx: note.file.extension === "mdx" })
    if (missing.length > 0) logger.warn(`${note.file.path} cites footnotes it never defines: ${quoted(missing)}.`)
    if (unused.length > 0) logger.warn(`${note.file.path} defines footnotes it never cites: ${quoted(unused)}.`)
  }
}

export function footnoteCheck(): AstroIntegration {
  return {
    name: "footnote-check",
    hooks: {
      "astro:build:start": ({ logger }) => report(logger),
      "astro:server:start": ({ logger }) => report(logger),
    },
  }
}
