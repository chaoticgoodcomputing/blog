// `nx run vault:writing-stats`: measures the prose of each public note and writes the numbers to
// content/public/widgets/writing-stats/corpus.json, which the WritingStats widget charts.
//
// What counts as prose is the author's own words a reader sees: paragraphs and list items, each
// item a paragraph of its own. Not frontmatter, code, tables, headings, MDX imports and widgets,
// comments, or anything quoted with `>`: a plain blockquote quotes someone else, and a callout of
// any label (a quote, an LLM's answer, an aside) is set apart from the text. An annotation note's
// blocks count only for their comment, not the passage they quote. A meeting's transcript and a
// subtitle file are no one's writing, and are left out whole.
//
// Private notes count too, as numbers and a title, which their stubs already publish: a private
// note's record has no path and none of its text. So the
// file can only be written where the private vault is checked out; without it, the script leaves the
// committed file as it is. The pre-commit hook runs it (.githooks/pre-commit).
//
// The widget never reads the vault: it gets these numbers, so the site ships counts and not the
// text they came from.

import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import matter from "gray-matter"
import { parseNote } from "../../packages/annotator/format/src/index.ts"

// ---------------------------------------------------------------------------------------------
// Dashes

/**
 * The kinds of dash prose uses as punctuation: a single hyphen, a double hyphen, an em dash and an
 * en dash. A dash counts only with a space before it, after it, or both: `a - b`, `a- b`, `a -b`.
 * One written between two words with no space, as in `well-known`, `1990–2000` or `word—word`, is
 * part of a word or a range, not punctuation. A dash in a quote, code or math never reaches here
 * (proseOf). Neither does an arrow (`-->`, `<-`) or a rule (`---`): a dash beside another dash or an
 * arrowhead is none of these, and nor is a suspended hyphen (`super- and sub-structures`).
 */
export const DASH_KINDS = ["em", "en", "double", "single"] as const
export type DashKind = (typeof DASH_KINDS)[number]
export type DashCounts = Record<DashKind, number>

const spaced = (dash: string) => new RegExp(`(?<![-–—<])(?:(?<=\\s)${dash}|${dash}(?=\\s))(?![-–—>])`, "g")
const DASH_PATTERNS: Record<DashKind, RegExp> = {
  em: spaced("—"),
  en: spaced("–"),
  double: spaced("--"),
  single: spaced("-"),
}
// A suspended hyphen, as in `super- and sub-structures`, is a word's, not a dash.
const SUSPENDED = /(?<=\p{L})-(?=\s+(?:and|or|nor|to|\()\b|\s+\()/gu

export function dashesOf(text: string): DashCounts {
  const counts = {} as DashCounts
  const unsuspended = text.replace(SUSPENDED, "")
  for (const kind of DASH_KINDS) counts[kind] = unsuspended.match(DASH_PATTERNS[kind])?.length ?? 0
  return counts
}

const totalDashes = (counts: DashCounts) => DASH_KINDS.reduce((sum, kind) => sum + counts[kind], 0)

// ---------------------------------------------------------------------------------------------
// Prose: the blocks of a note's body that are the author's own words

export type BlockKind = "paragraph" | "list-item"
export interface ProseBlock {
  kind: BlockKind
  /** The block's text, with its markup taken off. */
  text: string
}

/** What a reader reads of a line: links as their text, code and URLs as a stand-in word. */
export function plainText(line: string): string {
  return (
    line
      .replace(/!\[\[[^\]]*\]\]/g, "") // embeds
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // images
      .replace(/`[^`]*`/g, "code") // inline code
      .replace(/\$[^$\n]+\$/g, "math") // inline math
      .replace(/\[\[([^\]|]*)\|([^\]]*)\]\]/g, "$2") // [[target|shown]]
      .replace(/\[\[([^\]]*)\]\]/g, (_, target: string) => target.split(/[/#]/).at(-1)!.replace(/\.mdx?$/, ""))
      .replace(/\[\^[^\]]*\]/g, "") // footnote references
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // [text](url)
      .replace(/https?:\/\/\S+/g, "link")
      .replace(/<[^>]+>/g, "") // inline HTML
      .replace(/(\*\*|\*|==|~~)/g, "")
      .replace(/(^|\s)_([^_]+)_(?=\s|$|[.,;:!?])/g, "$1$2")
      .replace(/\s\^[a-z0-9-]+\s*$/i, "") // block ids
      .replace(/\\([*_\[\]`~])/g, "$1")
      .trim()
  )
}

// Whole-body passes, before the body is read line by line.
function stripNonProse(body: string): string {
  return (
    body
      .replace(/%%[\s\S]*?%%/g, "") // Obsidian comments
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/^(```|~~~)[\s\S]*?^\1[ \t]*$/gm, "") // fenced code
      .replace(/^\$\$[\s\S]*?^\$\$[ \t]*$/gm, "") // display math
      .replace(/^(import|export)\s.*$/gm, "") // MDX imports and exports
      // A widget: from a line opening a component to the line that closes it.
      .replace(/^<([A-Z]\w*)\b[\s\S]*?(?:\/>|<\/\1>)[ \t]*$/gm, "")
  )
}

const LIST_ITEM = /^\s*(?:[-*+]|\d+[.)])\s+(?:\[.\]\s+)?/

/** The prose of a note's body (no frontmatter), block by block. */
export function proseOf(body: string): ProseBlock[] {
  const blocks: ProseBlock[] = []
  const lines = stripNonProse(body).split(/\r?\n/)
  let current: ProseBlock | null = null
  const end = () => {
    if (current) {
      const text = plainText(current.text)
      if (/[\p{L}\p{N}]/u.test(text)) blocks.push({ kind: current.kind, text })
    }
    current = null
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    if (/^\s*$/.test(line)) {
      end()
      continue
    }
    // A quote or a callout, to its last `>` line: none of it counts.
    if (/^\s*>/.test(line)) {
      end()
      while (i + 1 < lines.length && /^\s*>/.test(lines[i + 1]!)) i++
      continue
    }
    if (/^#{1,6}\s/.test(line) || /^\s*\|/.test(line) || /^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) {
      end() // headings, tables, rules
      continue
    }
    if (LIST_ITEM.test(line)) {
      end()
      current = { kind: "list-item", text: line.replace(LIST_ITEM, "") }
      continue
    }
    if (current) current.text += " " + line.trim()
    else current = { kind: "paragraph", text: line.trim() }
  }
  end()
  return blocks
}

// ---------------------------------------------------------------------------------------------
// Sentences and words

const WORD = /[\p{L}\p{N}][\p{L}\p{N}'’\-]*/gu
export const wordsOf = (text: string) => text.match(WORD)?.length ?? 0

// Abbreviations whose full stop ends no sentence.
const ABBREVIATIONS = /\b(?:e\.g|i\.e|etc|vs|Dr|Mr|Mrs|Ms|St|Jr|Sr|al|approx|cf|ca|No|Fig|U\.S)\.$/i

/** A block's sentences: split after `.`, `!`, `?` or `…` and any closing quotes or brackets. */
export function sentencesOf(text: string): string[] {
  const sentences: string[] = []
  const boundary = /[.!?…]+["'”’)\]]*(?=\s+["'“‘(\[]?[\p{Lu}\p{N}])/gu
  let start = 0
  for (const match of text.matchAll(boundary)) {
    const stop = match.index! + match[0].length
    const candidate = text.slice(start, stop)
    // "e.g. The" and initials like "K. Pedram" carry on the sentence.
    if (ABBREVIATIONS.test(candidate) || /(?:^|\s)\p{Lu}\.$/u.test(candidate)) continue
    sentences.push(candidate.trim())
    start = stop
  }
  const rest = text.slice(start).trim()
  if (rest) sentences.push(rest)
  return sentences.filter((sentence) => wordsOf(sentence) > 0)
}

// ---------------------------------------------------------------------------------------------
// A note's numbers

export interface NoteStats {
  /** The note's path in the vault, from `public/`; none for a private note. */
  path?: string
  /** The address of the note's page on the site; none for a private note. */
  url?: string
  title: string
  private: boolean
  /** Its frontmatter date, `YYYY-MM-DD`. */
  date: string
  /** The id of the era its date falls in (ERAS). */
  era: string
  /** Its first `writing/*` tag, under `writing/`: essays, notes, fragments, annotations. */
  form: string
  words: number
  dashes: DashCounts
  /** Words in each sentence, in order. */
  sentences: number[]
  /** Dashes in each sentence, in the same order. */
  sentenceDashes: number[]
  /** Words in each paragraph, a list item being one. */
  paragraphWords: number[]
  /** Sentences in each paragraph. */
  paragraphSentences: number[]
}

/** A note's body with each annotation block reduced to its comment. */
export function withoutQuotedPassages(body: string): string {
  const { blocks } = parseNote(body)
  if (blocks.length === 0) return body
  let out = ""
  let at = 0
  for (const block of blocks) {
    out += body.slice(at, block.span.start) + "\n\n" + (block.annotation?.text ?? "") + "\n\n"
    at = block.span.end
  }
  return out + body.slice(at)
}

export function statsOf(body: string): Omit<NoteStats, "path" | "title" | "private" | "date" | "era" | "form"> {
  const stats = {
    words: 0,
    dashes: dashesOf(""),
    sentences: [] as number[],
    sentenceDashes: [] as number[],
    paragraphWords: [] as number[],
    paragraphSentences: [] as number[],
  }
  for (const block of proseOf(withoutQuotedPassages(body))) {
    const sentences = sentencesOf(block.text)
    const words = wordsOf(block.text)
    const dashes = dashesOf(block.text)
    stats.words += words
    for (const kind of DASH_KINDS) stats.dashes[kind] += dashes[kind]
    for (const sentence of sentences) {
      stats.sentences.push(wordsOf(sentence))
      stats.sentenceDashes.push(totalDashes(dashesOf(sentence)))
    }
    stats.paragraphWords.push(words)
    stats.paragraphSentences.push(sentences.length)
  }
  return stats
}

// ---------------------------------------------------------------------------------------------
// Eras: the notes before "GPTinglish", from it up to this post, and from this post on

export interface Era {
  id: string
  label: string
  /** The first day in it, `YYYY-MM-DD`; none for the first era. */
  from?: string
}

/** Each era after the first starts on the date of the note that opens it. */
const ERA_OPENERS = [
  { id: "before", label: "Before GPTinglish" },
  // "GPTinglish", whose file keeps the name it was first published under.
  { id: "between", label: "GPTinglish", opener: "public/content/articles/binglish.md" },
  { id: "after", label: "Future", opener: "public/content/notes/dashes.mdx" },
]

/**
 * Things that happened, marked on the charts by note where they happened, without starting an era:
 * a rule before the first note on or after the day, and its label.
 */
export interface Milestone {
  /** `YYYY-MM-DD`. */
  date: string
  label: string
}

/** Each on a day, or on the date of the note that marks it. */
const MILESTONES: ({ label: string } & ({ date: string } | { opener: string }))[] = [
  { label: "Blog Started", opener: "public/content/articles/hello-blog.md" },
  { label: "New Laptop", date: "2026-05-01" },
]

export const eraOf = (date: string, eras: Era[]) => eras.findLast((era) => !era.from || date >= era.from)!.id

// ---------------------------------------------------------------------------------------------
// The script

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
const VAULTS = { public: path.join(ROOT, "content/public/content"), private: path.join(ROOT, "content/private/content") }
const OUT = path.join(ROOT, "content/public/widgets/writing-stats/corpus.json")

function* notesUnder(dir: string): Generator<string> {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) yield* notesUnder(full)
    else if (/\.mdx?$/i.test(entry.name)) yield full
  }
}

/**
 * A public note's page address, as the site gives it: its path in the assembled vault (without
 * `public/`), as a slug, with a folder's `index` as the folder. A copy of astro/src/lib/vault.ts's
 * slugFor and pagePath, which this script can't import (they come with the site's vault reader).
 */
export function pageUrlOf(notePath: string): string {
  const slug = notePath
    .replace(/^public\//, "")
    .replace(/\.mdx?$/i, "")
    .split("/")
    .map((segment) => segment.replace(/\s/g, "-").replace(/&/g, "-and-").replace(/%/g, "-percent").replace(/[?#]/g, ""))
    .join("/")
  return `/${slug === "index" ? "" : slug.replace(/\/index$/, "")}`
}

const isoDate = (value: unknown) =>
  value instanceof Date ? value.toISOString().slice(0, 10) : String(value ?? "").slice(0, 10)

/** A note that is no one's writing: a meeting's transcript, or a subtitle file pasted in. */
export const isTranscript = (tags: string[], body: string) =>
  tags.some((tag) => tag.startsWith("writing/annotations/meetings")) ||
  (body.match(/^\d{2}:\d{2}:\d{2}[,.]\d{3} --> /gm)?.length ?? 0) > 5

const dateOf = (file: string) => isoDate(matter(fs.readFileSync(file, "utf8")).data.date)

const publicAddress = (notePath: string) => ({ path: notePath, url: pageUrlOf(notePath) })

export function corpus(): { eras: Era[]; milestones: Milestone[]; notes: NoteStats[] } {
  const eras: Era[] = ERA_OPENERS.map(({ id, label, opener }) =>
    opener ? { id, label, from: dateOf(path.join(ROOT, "content", opener)) } : { id, label },
  )
  const notes: NoteStats[] = []
  for (const [vault, dir] of Object.entries(VAULTS)) {
    const isPrivate = vault === "private"
    for (const file of notesUnder(dir)) {
      const { data, content } = matter(fs.readFileSync(file, "utf8"))
      const tags: string[] = (Array.isArray(data.tags) ? data.tags : []).map(String)
      if (data.draft === true || isTranscript(tags, content)) continue
      // A public note under a private tag is no post; it counts with the private notes.
      const hidden = isPrivate || tags.some((tag) => tag === "private" || tag.startsWith("private/"))
      const date = isoDate(data.date)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue
      const stats = statsOf(content)
      if (stats.words === 0) continue
      notes.push({
        // A private note's title is already public, on its stub (vault:publish-private); its path is not.
        ...(hidden ? {} : publicAddress(path.relative(path.join(ROOT, "content"), file))),
        title: String(data.title ?? path.basename(file).replace(/\.mdx?$/, "")),
        private: hidden,
        date,
        era: eraOf(date, eras),
        form: tags.find((tag) => tag.startsWith("writing/"))?.split("/")[1] ?? "other",
        ...stats,
      })
    }
  }
  notes.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title))
  const milestones: Milestone[] = MILESTONES.map((milestone) => ({
    label: milestone.label,
    date: "date" in milestone ? milestone.date : dateOf(path.join(ROOT, "content", milestone.opener)),
  }))
  return { eras, milestones, notes }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (!fs.existsSync(VAULTS.private)) {
    console.log("The private vault is not checked out; leaving the writing stats as they are.")
    process.exit(0)
  }
  const result = corpus()
  const json = JSON.stringify(result) + "\n"
  const before = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : ""
  if (json !== before) {
    fs.writeFileSync(OUT, json)
    // From the pre-commit hook, the new numbers go into the commit being made.
    if (process.argv.includes("--stage")) execFileSync("git", ["add", OUT], { cwd: ROOT })
  }
  const words = result.notes.reduce((sum, note) => sum + note.words, 0)
  const hidden = result.notes.filter((note) => note.private).length
  console.log(
    `${result.notes.length} notes (${hidden} private), ${words} words → ${path.relative(ROOT, OUT)}${json === before ? " (unchanged)" : ""}`,
  )
}
