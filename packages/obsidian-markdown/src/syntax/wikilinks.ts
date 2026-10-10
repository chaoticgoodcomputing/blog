// `[[wikilinks]]` and `![[embeds]]`. Sätteri parses both (`features.wikilinks`), but hands them over
// as an ordinary `link` and `image`, with the subpath left in the URL and the alias, or an image's
// size, in the text. So each is read again from its own source text, which is the only place that
// says it was a wikilink at all, and replaced by a `wikilink` node carrying what Obsidian's cache
// keeps for a link. The node renders as a plain link until the resolver gives it a destination.

import { defineMdastPlugin } from "satteri"
import { parseWikilink } from "../linktext.ts"
import type { WikilinkData } from "../types.ts"
import { type Ctx, type Node, text } from "./node.ts"

export const WIKILINK = "wikilink"

function replace(node: Node, ctx: Ctx, embed: boolean): void {
  const position = node.position
  if (!position) return
  const original = ctx.source.slice(position.start.offset, position.end.offset)
  const parsed = parseWikilink(original)
  if (!parsed || parsed.embed !== embed) return

  const wikilink: WikilinkData = {
    link: parsed.link,
    original,
    displayText: parsed.displayText,
    ...(parsed.alias === undefined ? {} : { alias: parsed.alias }),
    embed,
    position,
  }
  const replacement: Node = {
    type: WIKILINK,
    data: {
      wikilink,
      hName: embed ? "span" : "a",
      hProperties: embed
        ? { className: ["internal-embed"], "data-src": parsed.link }
        : { className: ["internal-link"], href: parsed.link, "data-href": parsed.link },
    },
    // A link with no alias shows its target, which is a name, as written.
    children: [text(parsed.alias !== undefined && !embed ? aliasText(node, ctx.source, parsed.alias) : parsed.displayText)],
  }
  ctx.replaceNode(node as never, replacement as never)
}

/**
 * What a wikilink's alias reads: its text as written, since Obsidian shows an alias's Markdown as
 * text, with the host's smart punctuation, which the parser put in the text nodes it read the alias
 * into. Each text node's source is swapped for its value, and the rest of the source (emphasis
 * markers, backticks, HTML) is kept as written.
 */
function aliasText(node: Node, source: string, alias: string): string {
  const children = node.children ?? []
  const start = children[0]?.position?.start.offset
  const end = children.at(-1)?.position?.end.offset
  if (start === undefined || end === undefined) return alias
  const texts: Node[] = []
  const collect = (n: Node) => {
    if (n.type === "text" && n.position) texts.push(n)
    else for (const child of n.children ?? []) collect(child)
  }
  children.forEach(collect)

  let written = ""
  let punctuated = ""
  let at = start
  for (const t of texts) {
    const from = t.position!.start.offset
    const to = t.position!.end.offset
    if (from < at || to > end) return alias
    written += source.slice(at, to)
    punctuated += source.slice(at, from) + (t.value ?? "")
    at = to
  }
  written += source.slice(at, end)
  punctuated += source.slice(at, end)
  // Read any other way than as written (an escaped `|` in a table, say), the alias is shown as the
  // link's parser read it, unpunctuated.
  return written.trim() === alias ? punctuated.trim() : alias
}

export function wikilinks() {
  return defineMdastPlugin({
    name: "obsidian-wikilinks",
    options: { position: true },
    link(node, ctx) {
      replace(node as unknown as Node, ctx, false)
    },
    image(node, ctx) {
      replace(node as unknown as Node, ctx, true)
    },
  })
}
