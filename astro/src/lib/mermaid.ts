// A `mermaid` code block is a diagram. The note's HTML holds the block as it was written, a code
// block of its source, inside a `<mermaid-diagram>` element; the element draws the diagram in the
// reader's browser (src/components/MermaidDiagram.astro, docs/adr/0401). Until it has, and where
// it can't, the reader has the source.

import { parseLinktext, type Vault, type VaultFile } from "@chaoticgoodcomputing/obsidian-markdown"
import { defineMdastPlugin } from "satteri"
import { getVault } from "./vault.ts"

/** The custom element a mermaid block is put in, which is also its class. */
export const MERMAID_ELEMENT = "mermaid-diagram"

/**
 * An mdast plugin, since that is where a block still says what language it is in, whatever is
 * later made of its code. The code block inside is highlighted like any other.
 */
export function mermaidDiagrams() {
  return defineMdastPlugin({
    name: "mermaid-diagrams",
    code(node, ctx) {
      if (node.lang !== "mermaid") return
      ctx.wrapNode(node, {
        type: "mermaidDiagram",
        children: [],
        data: { hName: MERMAID_ELEMENT, hProperties: { className: [MERMAID_ELEMENT] } },
      })
    },
  })
}

// The opening fence of a mermaid block: at the start of a line, or inside quotes and a list item.
// A fence that only looks like one, inside another code block or a comment, counts too, and costs a
// page no more than loading mermaid for nothing.
const MERMAID_FENCE = /^[ \t>]*(?:(?:[-*+]|\d+[.)])[ \t>]+)*(?:`{3,}|~{3,})[ \t]*mermaid(?:[ \t{]|$)/m

/**
 * Whether a note's page has a diagram to draw: the note has a mermaid block, or a note it embeds
 * does. Read from the note's source as the vault last read it, since a page's layout has the note
 * and not its rendered body.
 */
export function hasDiagrams(file: VaultFile, vault: Vault = getVault(), seen = new Set<string>()): boolean {
  if (seen.has(file.path)) return false
  seen.add(file.path)
  if (MERMAID_FENCE.test(vault.read(file) ?? "")) return true

  const cache = vault.metadataCache
  return (cache.getFileCache(file)?.embeds ?? []).some((embed) => {
    const embedded = cache.getFirstLinkpathDest(parseLinktext(embed.link).path, file.path)
    return embedded !== null && vault.isNote(embedded) && hasDiagrams(embedded, vault, seen)
  })
}
