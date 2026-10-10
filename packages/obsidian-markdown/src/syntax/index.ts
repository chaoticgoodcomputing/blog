// Obsidian's syntax, as Sätteri mdast plugins. None of them knows the vault: they turn what the
// parser left as text or as plain Markdown into nodes that say what the author wrote. Resolving a
// link to a file is the resolver's job (../resolve.ts), and reading a note's metadata the metadata
// plugin's (../metadata.ts); both run after these.

import type { Features, MdastPluginDefinition } from "satteri"
import { blocks } from "./blocks.ts"
import { callouts } from "./callouts.ts"
import { comments } from "./comments.ts"
import { math } from "./math.ts"
import { type InlineOptions, inline } from "./inline.ts"
import { wikilinks } from "./wikilinks.ts"

export type SyntaxOptions = InlineOptions

/**
 * The parser features Obsidian's syntax needs. The host turns these on beside its own. The parser
 * reads `$$` math, and single dollars are left to the math plugin, which pairs them as Obsidian does.
 */
export const obsidianFeatures = { wikilinks: true, math: { singleDollarTextMath: false } } satisfies Features

/**
 * The syntax plugins, in the order they depend on each other: math goes first, while every text node
 * still has the position its dollar signs are read from in the source; then comments, so nothing
 * else reads what a comment hides; wikilinks need the parser's own nodes, before any is moved; block ids are
 * set on a quote before it becomes a callout, which keeps them.
 */
export function obsidianSyntax(options: SyntaxOptions = {}): MdastPluginDefinition[] {
  return [math(), comments(), wikilinks(), inline(options), blocks(), callouts()]
}

export { CALLOUT } from "./callouts.ts"
export { HIGHLIGHT, TAG } from "./inline.ts"
export { WIKILINK } from "./wikilinks.ts"
export { blockAnchor } from "./blocks.ts"
