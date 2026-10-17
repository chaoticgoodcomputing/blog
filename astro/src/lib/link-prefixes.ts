// What the assembly (./assembly.ts) changes in a note it copies: the links Obsidian writes from its
// own vault's root, `content/`, written again from the assembled vault's root. Obsidian has the
// public vault at `content/public` and the private one at `content/private`, so it writes an
// absolute link as `[[public/content/notes/x]]` or `[[private/content/notes/x]]`. The assembled
// vault mounts both at its root, where each of those notes is `content/notes/x`: the prefix names a
// folder the assembled vault doesn't have, and is taken off.
//
// It is done to the copy, and not in the Markdown pipeline, because the vault's metadata cache
// reads links on its own, for backlinks and the graph: a link it can't resolve would be no edge of
// either, even where the page rendered it. The sources keep the links Obsidian wrote.
//
// A link loses the prefix whatever follows it, as Obsidian writes it: a path with spaces, a heading
// or block reference, an alias after `|`, or after `\|` in a table. Every link `fix-vault-links.mjs`
// rewrote in the notes before the assembly did is rewritten as it was.

// A wikilink or an embed, `[[…` or `![[…`, whose path starts with `public/` or `private/`, with or
// without a leading `/`: `[[public/content/x|alias]]` is `[[/content/x|alias]]`.
const WIKILINK_PREFIX = /\[\[\/?(?:private|public)\//g

// A Markdown link's destination, `](…`, bare or in `<…>`, likewise. The lookbehind leaves alone a
// `](` inside an address, where `public/` would be the other site's: `https://example.com/[x](public/y)`.
const MARKDOWN_PREFIX = /(?<!:\/\/[^\s]*)\]\((<?)\/?(?:private|public)\//g

// A link to a tag's description note as Quartz 4 kept it, `tags/<tag>/index`, goes to the tag page,
// `tags/<tag>` (#43, #81). A wikilink with a plain or table-escaped alias, or a Markdown link, with or
// without a leading `/` or a heading.
const TAG_INDEX = /(\[\[|\]\()(\/?tags\/[-\w/.]+?)\/index(?=\\?\||\]\]|\)|#)/g

/**
 * A note's text with its links written from the assembled vault's root: each `public/` or
 * `private/` prefix taken off, leaving the path from the root, and each `tags/<tag>/index` written
 * `tags/<tag>`. Anything else in the text is as it was.
 */
export function mapLinkPrefixes(text: string): string {
  return text.replace(WIKILINK_PREFIX, "[[/").replace(MARKDOWN_PREFIX, "]($1/").replace(TAG_INDEX, "$1$2")
}
