/** A line of a note, by offsets into it: `end` is before its line ending, `next` after it. */
export interface Line {
  readonly text: string
  readonly start: number
  readonly end: number
  readonly next: number
}

export type LineEnding = "\n" | "\r\n"

export function splitLines(text: string): Line[] {
  const lines: Line[] = []
  let start = 0
  while (start < text.length) {
    const newline = text.indexOf("\n", start)
    const next = newline === -1 ? text.length : newline + 1
    let end = newline === -1 ? text.length : newline
    if (end > start && text[end - 1] === "\r") end--
    lines.push({ text: text.slice(start, end), start, end, next })
    start = next
  }
  return lines
}

/** The note's line ending, from its first line; `\n` for a note of one line. */
export function lineEndingOf(text: string): LineEnding {
  const newline = text.indexOf("\n")
  return newline > 0 && text[newline - 1] === "\r" ? "\r\n" : "\n"
}

export function isBlank(line: string): boolean {
  return line.trim() === ""
}
