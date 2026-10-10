---
status: accepted
date: 2026-10-02
---

# `$math$` is paired by Obsidian's rule, not by the parser

Sätteri's parser reads `$…$` as remark-math does: any two dollar signs in a paragraph enclose math.
So `e.g. $120,000 or $120k` arrives as the math `120,000 or `, which Quartz's build typesets today.
Obsidian doesn't: a `$` opens math only when what follows it is not whitespace, and the next
unescaped `$` closes it only when what precedes that is not whitespace and what follows is not a
digit; otherwise the first `$` is a dollar sign. That is the rule of Obsidian's editor, read from the
app, and Pandoc's
([`tex_math_dollars`](https://pandoc.org/MANUAL.html#extension-tex_math_dollars)).

The library asks the parser for `$$` math only (`obsidianFeatures.math` is
`{ singleDollarTextMath: false }`), so single dollars arrive as text and the Markdown around them is
parsed as in any paragraph. Its `math` plugin then pairs them by Obsidian's rule, and takes each
formula from the source between its two dollar signs, since the parser has read what lies between
as Markdown. A formula that runs onto another line of a quote, a callout or a list item is taken
without what begins that line in the source and is no part of the paragraph: the `>` and the
indent. It also marks `$$…$$` written within a line as display math, as Obsidian shows it.

## Considered options

- **Keep the parser's math, and turn a pair that breaks the rule back into text.** Everything
  between the two prices would then be unparsed source: a link or emphasis between them shown as
  written, and missing from the metadata cache.
- **Leave it to the author**, escaping each `\$`. The vault is written for Obsidian, where a price
  needs no escape.

## Consequences

- In an MDX note, a `{…}` inside inline math is an MDX expression to the parser, before any plugin
  runs. The formula still comes out as written (`e^{i\pi}`, `\frac{1}{2}`), since it is taken from
  the source, but a brace MDX can't close is an error in the note's build, as it is anywhere in MDX
  prose. `$$` math, which the parser still reads, has no such limit. No MDX note of the vault has
  math.
- A dollar sign written as a character reference (`&#36;`) in a text node stops that node's dollar
  signs from opening or closing math, since they can't then be told from escaped ones.
