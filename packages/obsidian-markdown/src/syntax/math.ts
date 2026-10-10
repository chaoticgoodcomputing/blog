// `$inline math$`, read the way Obsidian reads it.
//
// Sätteri's parser, like remark-math, takes any two dollar signs in a paragraph for math, so
// `$5 and then $10` arrives as the math `5 and then `. Obsidian is stricter: a `$` opens math only
// when what follows it is not whitespace, and the next unescaped `$` closes it only when what
// precedes that is not whitespace and what follows is not a digit. Otherwise the first `$` is a
// dollar sign. That is the rule of Obsidian's editor, and Pandoc's `tex_math_dollars`.
//
// So the parser is asked for `$$` math alone (`obsidianFeatures`), and single dollars arrive as text,
// with the Markdown around them parsed as it would be in any paragraph. This plugin pairs them by
// Obsidian's rule. A pair may enclose nodes the parser made of what is really math, `$a *b* c$` or
// `$\{x\}$`, so the math is always taken from the source between the two dollars, never from the
// nodes. A dollar is one the author wrote as such, not escaped as `\$`.
//
// `$$…$$` written within a line is display math in Obsidian, and is marked as display math here.

import { defineMdastPlugin } from "satteri"
import { type Node, isParent, rewriteChildren, text } from "./node.ts"

const INLINE_MATH = "inlineMath"

type Item = { kind: "text"; value: string } | { kind: "dollar"; offset: number } | { kind: "node"; node: Node }

const isEscaped = (source: string, offset: number): boolean => {
  let backslashes = 0
  while (source[offset - 1 - backslashes] === "\\") backslashes++
  return backslashes % 2 === 1
}

// A text node's own dollar signs, each with where it is in the source, or nothing when they can't
// be told apart from escaped ones: the k-th `$` of the text is the k-th `$` of its source, unless
// one was written as a character reference.
function items(node: Node, source: string): Item[] {
  const value = node.value ?? ""
  const position = node.position
  if (!value.includes("$") || !position) return [{ kind: "text", value }]
  const written: number[] = []
  for (let offset = position.start.offset; offset < position.end.offset; offset++) {
    if (source[offset] === "$") written.push(offset)
  }
  if ((value.match(/\$/g) ?? []).length !== written.length) return [{ kind: "text", value }]
  const found: Item[] = []
  let last = 0
  let index = 0
  for (let at = value.indexOf("$"); at !== -1; at = value.indexOf("$", at + 1), index++) {
    const offset = written[index]
    if (offset === undefined || isEscaped(source, offset)) continue
    if (at > last) found.push({ kind: "text", value: value.slice(last, at) })
    found.push({ kind: "dollar", offset })
    last = at + 1
  }
  if (last < value.length) found.push({ kind: "text", value: value.slice(last) })
  return found
}

// Obsidian's rule, read from the source on either side of each dollar.
const opens = (source: string, offset: number) => /^[^\s$]$/.test(source[offset + 1] ?? "")
const closes = (source: string, offset: number) =>
  /^\S$/.test(source[offset - 1] ?? "") && !/^[0-9]$/.test(source[offset + 1] ?? "")

// Sätteri renders `$$…$$` written within a line as inline math. It is given the classes remark-math
// gives display math, which a typesetter looks for.
const DISPLAY = { hProperties: { className: ["language-math", "math-display"] } }

const isDisplay = (node: Node, source: string): boolean =>
  node.type === INLINE_MATH &&
  node.position !== undefined &&
  source.startsWith("$$", node.position.start.offset)

/**
 * Math that runs onto a second line is the source between its dollars without what begins that
 * line in the source and is no part of the paragraph: a quote's or a callout's `>`, a list item's
 * indent. A line of a paragraph never begins with a `>` of its own, which would open a quote.
 */
const withoutLineMarkers = (math: string): string => math.replace(/\n[ \t]*(?:>[ \t]*)*/g, "\n")

function pair(run: Item[], source: string): Node[] | undefined {
  const nodes: Node[] = []
  let changed = false
  const pushText = (value: string) => {
    const last = nodes.at(-1)
    if (last?.type === "text" && last.position === undefined) last.value += value
    else nodes.push(text(value))
  }
  for (let index = 0; index < run.length; index++) {
    const item = run[index]!
    if (item.kind === "text") pushText(item.value)
    else if (item.kind === "node" && isDisplay(item.node, source)) {
      nodes.push({ type: INLINE_MATH, value: item.node.value ?? "", data: DISPLAY })
      changed = true
    } else if (item.kind === "node") nodes.push(item.node)
    else {
      const close = opens(source, item.offset)
        ? run.findIndex((later, at) => at > index && later.kind === "dollar")
        : -1
      const closer = run[close]
      if (closer?.kind === "dollar" && closes(source, closer.offset)) {
        nodes.push({ type: INLINE_MATH, value: withoutLineMarkers(source.slice(item.offset + 1, closer.offset)) })
        changed = true
        index = close
      } else pushText("$")
    }
  }
  return changed ? nodes : undefined
}

export function math() {
  return defineMdastPlugin({
    name: "obsidian-math",
    options: { position: true },
    before(root, ctx) {
      const source = ctx.source
      if (!source.includes("$")) return
      rewriteChildren(
        root as unknown as Node,
        ctx,
        (_parent, children) => {
          const candidate = children.some(
            (child) => (child.type === "text" && child.value?.includes("$")) || isDisplay(child, source),
          )
          if (!candidate) return undefined
          const run = children.flatMap((child): Item[] =>
            child.type === "text" ? items(child, source) : [{ kind: "node", node: child }],
          )
          return pair(run, source)
        },
        (node) => !isParent(node),
      )
    },
  })
}
