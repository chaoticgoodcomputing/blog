// `nx run vault:updated-dates`: stamps `updated:` into the frontmatter of each public note whose
// content the next commit changes, in the staged file and in the working tree's alike. Run by the
// pre-commit hook (.githooks/pre-commit) on what is staged. The site takes a note's `updated` as when
// it last changed: the sitemap's `lastmod`, and what IndexNow is told (astro/src/lib/dates.ts).
//
// A note's content is what a reader sees of it: its title, its description and its body, with each
// link reduced to its text. A tag rename, an alias, or a note moved and its links rewritten by
// Obsidian changes no content, and leaves `updated` as it was. Only that is the point of the stamp:
// git's date for a note is its last commit, whatever the commit did.
//
//   --backfill   stamps each public note with no `updated` from its history instead: the newest
//                commit that changed its content. Writes the working tree only; commit the result.
//
// The stamp is the day in UTC, as Obsidian's date property writes it (`2026-11-02`). A second edit on
// the same day leaves it as it was.

import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import matter from "gray-matter"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
const PUBLIC = "content/public/"

const isNote = (file: string) => /\.mdx?$/i.test(file)
const FRONTMATTER = /^---\r?\n((?:[\s\S]*?\r?\n)?)---[ \t]*(?:\r?\n|$)/

const baseName = (target: string) => target.split("/").at(-1)!.replace(/\.mdx?$/i, "")

/**
 * What a reader sees of a note, to tell whether a commit changed it: its title and description,
 * then its body with each link's target reduced to what the link shows. A wikilink with display text
 * is that text; one without shows its file's name and heading. A Markdown link to a file of the vault
 * keeps its file's name; one to another site keeps its address. Trailing spaces and blank lines at
 * either end are no content.
 */
export function contentOf(text: string): string {
  const { data, content } = matter(text)
  const body = content
    .replace(/(!?)\[\[([^\]|#]*?)\\?(#[^\]|]*?)?\\?(?:\|([^\]]*))?\]\]/g, (_, bang: string, target: string, heading = "", display?: string) =>
      display !== undefined ? `${bang}[[|${display}]]` : `${bang}[[${baseName(target)}${heading}]]`,
    )
    .replace(/(!?)\[([^\]]*)\]\((?![a-z][a-z0-9+.-]*:)([^)\s]*)\)/gi, (_, bang: string, label: string, target: string) => {
      const [file, anchor = ""] = target.split("#")
      return `${bang}[${label}](${baseName(decodeURI(file))}${anchor ? `#${anchor}` : ""})`
    })
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .join("\n")
    .trim()
  return JSON.stringify([data.title ?? null, data.description ?? null, body])
}

/** A time as the stamp writes it: its day in UTC. */
export const stampOf = (time: Date): string => time.toISOString().slice(0, 10)

/**
 * A note's text with `updated: <stamp>` in its frontmatter: in place of an `updated` it has, else
 * after its `date`, else last. Every other line is left as it was.
 */
export function withUpdated(text: string, stamp: string): string {
  const eol = text.includes("\r\n") ? "\r\n" : "\n"
  const line = `updated: ${stamp}`
  const match = FRONTMATTER.exec(text)
  if (!match) return `---${eol}${line}${eol}---${eol}${text}`

  const lines = match[1].split(/\r?\n/)
  if (lines.at(-1) === "") lines.pop()
  const existing = lines.findIndex((each) => /^updated\s*:/.test(each))
  if (existing !== -1) {
    if (lines[existing] === line) return text
    lines[existing] = line
  } else {
    const date = lines.findIndex((each) => /^date\s*:/.test(each))
    lines.splice(date === -1 ? lines.length : date + 1, 0, line)
  }
  const frontmatter = `---${eol}${lines.map((each) => `${each}${eol}`).join("")}---`
  return `${frontmatter}${text.slice(match[0].replace(/\r?\n$/, "").length)}`
}

/** Whether a note is stamped: a note, not an Excalidraw drawing, which is a canvas and no page. */
export function isStamped(file: string, text: string): boolean {
  return file.startsWith(PUBLIC) && isNote(file) && !("excalidraw-plugin" in matter(text).data)
}

/** Whether a commit changes a note's content: `before` is the note as the last commit has it, if it had one. */
export const changesContent = (before: string | undefined, after: string): boolean =>
  before === undefined || contentOf(before) !== contentOf(after)

/** One version of a file in its history, newest first, from `git log --follow`. */
export interface Version {
  time: Date
  /** The text the file had after the commit. */
  text: string
}

/** When a note's content last changed: the newest version whose content differs from the one before it. */
export function lastContentChange(history: Version[]): Date | undefined {
  for (let i = 0; i < history.length; i++) {
    if (changesContent(history[i + 1]?.text, history[i].text)) return history[i].time
  }
  return undefined
}

// ─── Git ────────────────────────────────────────────────────────────────────────────────────────

const git = (args: string[], input?: string) =>
  execFileSync("git", args, { cwd: ROOT, encoding: "utf8", input, maxBuffer: 1 << 30, stdio: ["pipe", "pipe", "pipe"] })

const show = (spec: string): string | undefined => {
  try {
    return git(["show", spec])
  } catch {
    return undefined
  }
}

/** Stamps a note as staged, and the working tree's copy, without staging an unstaged change. */
function stampStaged(file: string, stamp: string) {
  const staged = git(["show", `:${file}`])
  const updated = withUpdated(staged, stamp)
  if (updated !== staged) {
    const blob = git(["hash-object", "-w", "--stdin"], updated).trim()
    const mode = git(["ls-files", "-s", "--", file]).split(" ")[0]
    git(["update-index", "--cacheinfo", `${mode},${blob},${file}`])
  }
  const onDisk = path.join(ROOT, file)
  if (fs.existsSync(onDisk)) {
    const text = fs.readFileSync(onDisk, "utf8")
    const edited = withUpdated(text, stamp)
    if (edited !== text) fs.writeFileSync(onDisk, edited)
  }
}

/** Each staged note added, changed or moved, with the path it had at HEAD. */
function stagedNotes(): { from?: string; to: string }[] {
  const fields = git(["diff", "--cached", "--name-status", "-z", "-M", "--diff-filter=AMR", "HEAD", "--", PUBLIC])
    .split("\0")
    .filter(Boolean)
  const notes: { from?: string; to: string }[] = []
  for (let i = 0; i < fields.length; ) {
    const status = fields[i++][0]
    if (status === "R") notes.push({ from: fields[i++], to: fields[i++] })
    else if (status === "M") notes.push({ from: fields[i], to: fields[i++] })
    else notes.push({ to: fields[i++] })
  }
  return notes
}

function precommit() {
  try {
    git(["rev-parse", "--verify", "--quiet", "HEAD"])
  } catch {
    return
  }
  const stamp = stampOf(new Date())
  for (const { from, to } of stagedNotes()) {
    const after = git(["show", `:${to}`])
    if (!isStamped(to, after)) continue
    if (!changesContent(from && show(`HEAD:${from}`), after)) continue
    stampStaged(to, stamp)
    console.log(`updated-dates: ${to} updated ${stamp}`)
  }
}

/** A file's versions, newest first, following it through moves. */
function historyOf(file: string): Version[] {
  const log = git(["log", "--follow", "--format=%x01%H %ct", "--name-only", "--", file])
  const versions: Version[] = []
  for (const record of log.split("\x01").filter(Boolean)) {
    const [header, ...paths] = record.split("\n").filter(Boolean)
    const [sha, seconds] = header.split(" ")
    const text = paths[0] && show(`${sha}:${paths[0]}`)
    // A commit that deleted the file at that path, on the way to its being added back.
    if (text === undefined) continue
    versions.push({ time: new Date(Number(seconds) * 1000), text })
  }
  return versions
}

function backfill() {
  const files = git(["ls-files", "-z", "--", PUBLIC]).split("\0").filter(isNote)
  let stamped = 0
  for (const file of files) {
    const onDisk = path.join(ROOT, file)
    if (!fs.existsSync(onDisk)) continue
    const text = fs.readFileSync(onDisk, "utf8")
    if (!isStamped(file, text) || "updated" in matter(text).data) continue
    const changed = lastContentChange(historyOf(file))
    if (!changed) continue
    fs.writeFileSync(onDisk, withUpdated(text, stampOf(changed)))
    stamped++
  }
  console.log(`updated-dates: stamped ${stamped} of ${files.length} public note(s) from their history`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes("--backfill")) backfill()
  else precommit()
}
