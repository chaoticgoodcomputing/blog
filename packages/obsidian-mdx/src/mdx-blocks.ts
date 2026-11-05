// Finds the parts of an MDX document that are code, not Markdown: its ESM (`import` and `export`
// statements) and its JSX components (`<Graph … />`, `<Figure>…</Figure>`). Lowercase HTML tags
// are left to Obsidian, which renders them. Frontmatter and fenced code are skipped.

export type MdxBlockKind = "esm" | "jsx"

/** A run of whole lines: `startLine` to `endLine`, 0-based and inclusive; `from` and `to` are offsets. */
export interface MdxBlock {
  kind: MdxBlockKind
  startLine: number
  endLine: number
  from: number
  to: number
}

const ESM = /^(?:import|export)\b/
const COMPONENT = /^ {0,3}<(?:[A-Z][\w.]*|>)/
const FENCE = /^ {0,3}(`{3,}|~{3,})/
const HEADING = /^ {0,3}#{1,6}(?:\s|$)/

export function findMdxBlocks(text: string): MdxBlock[] {
  const lines = text.split("\n")
  const starts: number[] = []
  let offset = 0
  for (const line of lines) {
    starts.push(offset)
    offset += line.length + 1
  }
  const lineAt = (pos: number) => {
    let lo = 0
    let hi = lines.length - 1
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1
      if (starts[mid] <= pos) lo = mid
      else hi = mid - 1
    }
    return lo
  }
  const isBlank = (i: number) => lines[i].trim() === ""
  /** The last line of the paragraph that starts at `i`: the line before the next blank one. */
  const paragraphEnd = (i: number) => {
    while (i + 1 < lines.length && !isBlank(i + 1)) i++
    return i
  }
  const block = (kind: MdxBlockKind, startLine: number, endLine: number): MdxBlock => ({
    kind,
    startLine,
    endLine,
    from: starts[startLine],
    to: starts[endLine] + lines[endLine].length,
  })

  const blocks: MdxBlock[] = []
  let i = 0
  if (lines[0] === "---") {
    const close = lines.findIndex((line, n) => n > 0 && (line === "---" || line === "..."))
    if (close > 0) i = close + 1
  }
  let atBlockStart = true
  for (; i < lines.length; i++) {
    const line = lines[i]
    if (isBlank(i)) {
      atBlockStart = true
      continue
    }
    const fence = FENCE.exec(line)
    if (fence) {
      const marker = fence[1]
      const closing = new RegExp(`^ {0,3}${marker[0] === "`" ? "`" : "~"}{${marker.length},}\\s*$`)
      while (i + 1 < lines.length && !closing.test(lines[i + 1])) i++
      i++
      atBlockStart = true
      continue
    }
    if (atBlockStart && ESM.test(line)) {
      const end = paragraphEnd(i)
      blocks.push(block("esm", i, end))
      i = end
      continue
    }
    if (atBlockStart && COMPONENT.test(line)) {
      const close = scanJsx(text, starts[i] + line.indexOf("<"))
      const end = close < 0 ? paragraphEnd(i) : lineAt(close - 1)
      blocks.push(block("jsx", i, end))
      i = end
      atBlockStart = true
      continue
    }
    atBlockStart = HEADING.test(line)
  }
  return blocks
}

const TAG = /<(\/?)([A-Za-z][\w.:-]*)?/y

/**
 * Where the JSX element opening at `start` ends: the offset after its closing `>`, or -1 if it never
 * closes. Strings and `{…}` expressions are skipped, in attributes and in children, so a `>` or `<`
 * in them is not a tag. Only components (capitalized) and fragments count towards nesting.
 */
export function scanJsx(text: string, start: number): number {
  const stack: string[] = []
  let pos = start
  while (pos < text.length) {
    const ch = text[pos]
    if (ch === "{") {
      pos = skipExpression(text, pos)
      if (pos < 0) return -1
      continue
    }
    if (ch !== "<") {
      pos++
      continue
    }
    TAG.lastIndex = pos
    const match = TAG.exec(text)!
    const closing = match[1] === "/"
    const name = match[2] ?? ""
    const counted = name === "" || /^[A-Z]/.test(name)
    if (name === "" && text[TAG.lastIndex] !== ">") {
      pos++ // a bare `<`, as in `a < b`
      continue
    }
    const end = skipTag(text, TAG.lastIndex)
    if (end < 0) return -1
    if (counted) {
      if (closing) {
        const at = stack.lastIndexOf(name)
        if (at >= 0) stack.length = at
      } else if (text[end - 2] !== "/") {
        stack.push(name)
      }
      if (stack.length === 0) return end
    }
    pos = end
  }
  return -1
}

/** From inside a tag, after its name: the offset after its `>`, skipping strings and expressions. */
function skipTag(text: string, pos: number): number {
  while (pos < text.length) {
    const ch = text[pos]
    if (ch === ">") return pos + 1
    if (ch === "{") {
      pos = skipExpression(text, pos)
      if (pos < 0) return -1
    } else if (ch === '"' || ch === "'") {
      const close = text.indexOf(ch, pos + 1)
      if (close < 0) return -1
      pos = close + 1
    } else pos++
  }
  return -1
}

/** From a `{`: the offset after its matching `}`, skipping strings and template literals. */
function skipExpression(text: string, pos: number): number {
  let depth = 0
  while (pos < text.length) {
    const ch = text[pos]
    if (ch === "{") depth++
    else if (ch === "}") {
      depth--
      if (depth === 0) return pos + 1
    } else if (ch === '"' || ch === "'" || ch === "`") {
      let close = pos + 1
      while (close < text.length && text[close] !== ch) close += text[close] === "\\" ? 2 : 1
      if (close >= text.length) return -1
      pos = close
    }
    pos++
  }
  return -1
}

/** A block's source as a fenced `jsx` code block, its fence longer than any backtick run in it. */
export function asCodeBlock(source: string): string {
  const longest = Math.max(2, ...(source.match(/`+/g) ?? []).map((run) => run.length))
  const fence = "`".repeat(longest + 1)
  return `${fence}jsx\n${source}\n${fence}`
}
