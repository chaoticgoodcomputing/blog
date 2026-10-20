#!/usr/bin/env node

// Walks every note without a `writing/…` tag and tags it from one keypress:
//   a → writing/notes    d → writing/fragments    s → skip    q → quit
// Each answer is written to the file straight away, so quitting loses nothing and a rerun
// picks up where the last one stopped. Run from content/: `node utils/tag-writing.mjs`.

import { globby } from "globby"
import matter from "gray-matter"
import { readFileSync, writeFileSync } from "fs"
import { basename } from "path"

const KEYS = { a: "writing/notes", d: "writing/fragments" }
const PREVIEW_LINES = 3

const files = (
  await globby(["**/*.{md,mdx}"], {
    ignore: ["**/node_modules/**", "templates/**", "public/tags/**", "public/assets/**", "**/*.excalidraw.md"],
  })
).sort()

const queue = files.filter((file) => {
  const tags = readTags(readFileSync(file, "utf8"))
  return !tags.some((tag) => String(tag).startsWith("writing/"))
})

function readTags(text) {
  try {
    const { data } = matter(text)
    if (Array.isArray(data.tags)) return data.tags
    if (typeof data.tags === "string") return [data.tags]
  } catch {}
  return []
}

// Adds the tag by editing lines, so the rest of the frontmatter keeps its formatting.
function addTag(text, tag) {
  const lines = text.split("\n")
  const end = lines[0]?.trim() === "---" ? lines.indexOf("---", 1) : -1
  if (end === -1) return `---\ntags:\n  - ${tag}\n---\n${text}`

  const tagsAt = lines.findIndex((line, i) => i > 0 && i < end && /^tags:/.test(line))
  if (tagsAt === -1) {
    lines.splice(end, 0, "tags:", `  - ${tag}`)
    return lines.join("\n")
  }

  const inline = lines[tagsAt].slice("tags:".length).trim()
  if (inline.startsWith("[")) {
    const items = inline.slice(1, inline.lastIndexOf("]")).split(",").map((s) => s.trim()).filter(Boolean)
    lines.splice(tagsAt, 1, "tags:", ...[...items, tag].map((item) => `  - ${item}`))
    return lines.join("\n")
  }
  if (inline) {
    lines.splice(tagsAt, 1, "tags:", `  - ${inline}`, `  - ${tag}`)
    return lines.join("\n")
  }

  let last = tagsAt
  let indent = "  "
  for (let i = tagsAt + 1; i < end && /^\s*-\s/.test(lines[i]); i++) {
    last = i
    indent = lines[i].match(/^(\s*)-/)[1]
  }
  lines.splice(last + 1, 0, `${indent}- ${tag}`)
  return lines.join("\n")
}

function describe(file) {
  const text = readFileSync(file, "utf8")
  let data = {}
  let body = text
  try {
    ;({ data, content: body } = matter(text))
  } catch {}

  const title = data.title ?? basename(file).replace(/\.mdx?$/, "")
  const date = data.date instanceof Date ? data.date.toISOString().slice(0, 10) : data.date ?? "—"
  const words = body.split(/\s+/).filter(Boolean).length
  const preview = body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, PREVIEW_LINES)
  return { title, date, words, preview, tags: readTags(text) }
}

const width = process.stdout.columns || 100
const clip = (s) => (s.length > width - 4 ? s.slice(0, width - 5) + "…" : s)
const dim = (s) => `\x1b[2m${s}\x1b[0m`
const bold = (s) => `\x1b[1m${s}\x1b[0m`

let index = 0
let tagged = 0
let skipped = 0

function render() {
  if (index >= queue.length) return finish()
  const file = queue[index]
  const note = describe(file)
  process.stdout.write("\x1b[2J\x1b[H")
  console.log(dim(`[${index + 1}/${queue.length}]  ${file}`))
  console.log()
  console.log(bold(clip(String(note.title))))
  console.log(`${note.date}  ·  ${note.words} words  ·  ${dim(note.tags.join(", ") || "no tags")}`)
  console.log()
  for (const line of note.preview) console.log(`  ${clip(line)}`)
  if (note.preview.length === 0) console.log(dim("  (empty)"))
  console.log()
  console.log(dim("a: notes   d: fragments   s: skip   q: quit"))
}

function finish() {
  process.stdout.write("\x1b[2J\x1b[H")
  console.log(`Tagged ${tagged}, skipped ${skipped}, ${queue.length - index} left.`)
  process.exit(0)
}

if (queue.length === 0) {
  console.log("Every note already has a writing/ tag.")
  process.exit(0)
}

process.stdin.setRawMode(true)
process.stdin.resume()
process.stdin.setEncoding("utf8")
process.stdin.on("data", (key) => {
  const k = key.toLowerCase()
  if (k === "q" || key === "\u0003") return finish()
  if (k === "s") {
    skipped++
    index++
  } else if (KEYS[k]) {
    const file = queue[index]
    writeFileSync(file, addTag(readFileSync(file, "utf8"), KEYS[k]))
    tagged++
    index++
  } else return
  render()
})

render()
