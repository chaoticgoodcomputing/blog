// A note's footnotes that don't work: a reference with no definition, which Markdown leaves as its
// text, `[^1]`, on the page; and a definition no reference cites, which the page leaves out without
// a word. The build reports both (src/integrations/footnote-check.ts).

import { obsidianFeatures } from "@chaoticgoodcomputing/obsidian-markdown"
import { markdownToMdast, mdxToMdast, type MdastNode } from "satteri"

/** What is wrong with one note's footnotes, each by its label as written: `1` for `[^1]`. */
export interface FootnoteProblems {
  /** References with no definition. */
  missing: string[]
  /** Definitions no reference cites. */
  unused: string[]
}

// A reference as written, in text the parser didn't read as one. Code and math are never text.
const REFERENCE = /\[\^([^\]\s]+)\]/g

const FEATURES = { ...obsidianFeatures, gfm: true, frontmatter: true }

/** The footnote problems of a note's source, read as MDX when `mdx` says so. */
export function footnoteProblems(source: string, { mdx = false } = {}): FootnoteProblems {
  const tree = (mdx ? mdxToMdast : markdownToMdast)(source, { features: FEATURES, position: false })
  const cited = new Set<string>()
  const defined: { identifier: string; label: string }[] = []
  const missing: string[] = []
  const visit = (node: MdastNode) => {
    const { type, identifier, label, value } = node as MdastNode & Record<string, unknown>
    if (type === "footnoteReference") cited.add(identifier as string)
    if (type === "footnoteDefinition") defined.push({ identifier: identifier as string, label: (label ?? identifier) as string })
    if (type === "text" && typeof value === "string") {
      for (const match of value.matchAll(REFERENCE)) missing.push(match[1])
    }
    for (const child of ((node as { children?: MdastNode[] }).children ?? [])) visit(child)
  }
  visit(tree)
  // A reference cites a definition by identifier, its label as Markdown matches it, whatever its case.
  const unused = defined.filter((definition) => !cited.has(definition.identifier)).map((definition) => definition.label)
  return { missing: [...new Set(missing)], unused }
}
