// `nx run vault:alias-moves`: gives each public note that the next commit moves an alias at its old
// path, so its old address forwards to its new one instead of being the 404 page. Run by the
// pre-commit hook (.githooks/pre-commit) on what is staged.
//
// A note's address is its path in the vault (content/public), and the site turns each alias in a
// note's frontmatter into a redirect to the note (astro/src/lib/aliases.ts). So for each staged move
// of a published note, this adds the note's old path, without its extension, to the moved note's
// `aliases`, in the staged file and in the working tree's alike. Each is edited on its own, so an
// unstaged change to the note stays unstaged. A tag description note, `tags/<tag>.md`, is treated
// the same way: moving it is how a tag is renamed, and its aliases forward the old tag's page to
// the new tag's.
//
// A move is a rename git finds, or a deleted note and an added one with the same name. A deleted
// note no move accounts for is reported, and the commit goes ahead: its address will be the 404
// page. Only public notes get aliases: a private note's stub, in dist/vault-private, carries no
// frontmatter but its title, date and tags (utils/guard-private.ts), so a private note that moves
// to a new address is reported too.

import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import matter from "gray-matter"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
const PUBLIC = "content/public/"
const STUBS = "dist/vault-private/"

const isNote = (file: string) => /\.mdx?$/i.test(file)

/** A file's path in the vault, or nothing for a file of neither vault source. */
export function vaultPath(file: string): string | undefined {
  for (const source of [PUBLIC, STUBS]) if (file.startsWith(source)) return file.slice(source.length)
  return undefined
}

/**
 * The address a path in the vault has, in lower case, to tell when two are the same: the site's
 * slug rule (astro/src/lib/vault.ts, `slugFor` and `pagePath`), and a folder's `index` as the folder.
 */
export function addressOf(file: string): string {
  const slug = file
    .replace(/\.mdx?$/i, "")
    .split("/")
    .map((part) => part.replace(/\s/g, "-").replace(/&/g, "-and-").replace(/%/g, "-percent").replace(/[?#]/g, ""))
    .join("/")
  return `/${slug === "index" ? "" : slug.replace(/\/index$/, "")}`.toLowerCase()
}

/** The alias a note's old path in the vault is: the path without its extension. */
export const aliasFor = (file: string): string => file.replace(/\.mdx?$/i, "")

/** One staged change, from `git diff --name-status -z`. */
export interface Change {
  status: "A" | "D" | "R"
  /** The file's path before the change: a deleted or renamed file's. */
  from?: string
  /** The file's path after the change: an added or renamed file's. */
  to?: string
}

/** The changes in `git diff --name-status -z` output. */
export function parseNameStatus(output: string): Change[] {
  const fields = output.split("\0").filter((field) => field !== "")
  const changes: Change[] = []
  for (let i = 0; i < fields.length; ) {
    const status = fields[i++][0]
    if (status === "R") changes.push({ status, from: fields[i++], to: fields[i++] })
    else if (status === "D") changes.push({ status, from: fields[i++] })
    else if (status === "A") changes.push({ status, to: fields[i++] })
    else i++
  }
  return changes
}

/** An alias to add to a staged note. */
export interface Alias {
  /** The note's file, from the repository's root. */
  file: string
  alias: string
}

export interface Plan {
  aliases: Alias[]
  /** What no alias can cover, to report. */
  warnings: string[]
}

const stem = (file: string) => path.posix.basename(file).replace(/\.mdx?$/i, "").toLowerCase()

/**
 * The aliases the staged changes call for. `wasPublished` says whether a file had a page as the
 * last commit has it: a note that is not a draft or a drawing.
 */
export function planAliases(changes: Change[], wasPublished: (file: string) => boolean): Plan {
  const plan: Plan = { aliases: [], warnings: [] }
  const moves: { from: string; to: string }[] = []
  const deleted: string[] = []
  const added: string[] = []

  for (const { status, from, to } of changes) {
    if (status === "A" && to) added.push(to)
    if (status === "D" && from) deleted.push(from)
    if (status !== "R" || !from || !to) continue
    // A rename to something that is no note of the vault's is a deletion as far as an address goes.
    if (vaultPath(to) === undefined || !isNote(to)) deleted.push(from)
    else moves.push({ from, to })
  }

  // A deleted note and an added one with the same name, where only one of each has it, are a move
  // git didn't find, as when a note is moved and much of it rewritten at once.
  const unpaired: string[] = []
  for (const from of deleted) {
    const named = (files: string[]) => files.filter((file) => isNote(file) && stem(file) === stem(from))
    const [to, ...more] = named(added)
    if (to && more.length === 0 && named(deleted).length === 1) moves.push({ from, to })
    else unpaired.push(from)
  }

  for (const { from, to } of moves) {
    const oldPath = from.startsWith(PUBLIC) ? vaultPath(from) : undefined
    if (oldPath === undefined || !isNote(from) || !wasPublished(from)) continue
    if (addressOf(oldPath) === addressOf(vaultPath(to)!)) continue
    if (to.startsWith(PUBLIC)) plan.aliases.push({ file: to, alias: aliasFor(oldPath) })
    else {
      const gone = addressOf(oldPath)
      plan.warnings.push(`${from} moved to ${to}, a private note, which can't carry an alias: ${gone} will be the 404 page.`)
    }
  }

  // A public note deleted outright. One that became a private note at the same path, whose stub
  // is staged, keeps its address. A tag description note's tag keeps its page while a note
  // carries the tag.
  const stubs = new Set(added.filter((file) => file.startsWith(STUBS)).map((file) => addressOf(vaultPath(file)!)))
  for (const from of unpaired) {
    const oldPath = from.startsWith(PUBLIC) ? vaultPath(from) : undefined
    if (oldPath === undefined || oldPath.startsWith("tags/") || !isNote(from) || !wasPublished(from)) continue
    if (stubs.has(addressOf(oldPath))) continue
    plan.warnings.push(`${from} is deleted, and no move accounts for it: ${addressOf(oldPath)} will be the 404 page.`)
  }
  return plan
}

const FRONTMATTER = /^---\r?\n((?:[\s\S]*?\r?\n)?)---[ \t]*(?:\r?\n|$)/

/** A YAML scalar for an alias: bare where that is safe, else double-quoted. */
const scalar = (alias: string) => (/^[A-Za-z_][\w./-]*$/.test(alias) ? alias : JSON.stringify(alias))

/** The aliases frontmatter lists, as Obsidian reads them: a list, or one string of them, comma-separated. */
function aliasesIn(data: Record<string, unknown>): string[] {
  const aliases = data.aliases
  if (Array.isArray(aliases)) return aliases.filter((alias) => alias != null).map(String)
  if (typeof aliases === "string") return aliases.split(",").map((alias) => alias.trim()).filter(Boolean)
  return []
}

/**
 * A note's text with `alias` among its frontmatter's aliases, and without any alias that is the
 * note's own address, at `own`, its path in the vault, since a page keeps its own address. The text
 * as it was where nothing changes. A block list of aliases gets a line added; aliases written
 * another way are written again as a block list, which is how Obsidian writes them.
 */
export function withAlias(text: string, alias: string, own: string): string {
  const eol = text.includes("\r\n") ? "\r\n" : "\n"
  const match = FRONTMATTER.exec(text)
  if (!match) return `---${eol}aliases:${eol}  - ${scalar(alias)}${eol}---${eol}${text}`

  const existing = aliasesIn(matter(text).data)
  const ownAddress = addressOf(own)
  const kept = existing.filter((each) => addressOf(each) !== ownAddress)
  const adding = !kept.some((each) => addressOf(each) === addressOf(alias)) && addressOf(alias) !== ownAddress
  if (!adding && kept.length === existing.length) return text
  const wanted = adding ? [...kept, alias] : kept

  const lines = match[1].split(/\r?\n/)
  if (lines.at(-1) === "") lines.pop()
  const start = lines.findIndex((line) => /^aliases\s*:/.test(line))
  let replacement: string[]
  if (start === -1) {
    lines.push("aliases:", ...wanted.map((each) => `  - ${scalar(each)}`))
    replacement = lines
  } else {
    let end = start + 1
    while (end < lines.length && /^(\s+\S|-(\s|$))/.test(lines[end])) end++
    const items = lines.slice(start + 1, end)
    const indent = /^(\s*)- /.exec(items[0] ?? "")?.[1] ?? "  "
    const isBlockList = /^aliases\s*:\s*$/.test(lines[start]) && items.every((line) => /^\s*- /.test(line))
    const block =
      isBlockList && kept.length === existing.length
        ? [...lines.slice(start, end), `${indent}- ${scalar(alias)}`]
        : wanted.length > 0
          ? ["aliases:", ...wanted.map((each) => `${indent}- ${scalar(each)}`)]
          : []
    replacement = [...lines.slice(0, start), ...block, ...lines.slice(end)]
  }
  const frontmatter = `---${eol}${replacement.map((line) => `${line}${eol}`).join("")}---`
  return `${frontmatter}${text.slice(match[0].replace(/\r?\n$/, "").length)}`
}

const git = (args: string[], input?: string) =>
  execFileSync("git", args, { cwd: ROOT, encoding: "utf8", input, maxBuffer: 1 << 30, stdio: ["pipe", "pipe", "pipe"] })

/** Whether a file had a page as the last commit has it: a note that is not a draft or a drawing. */
function wasPublished(file: string): boolean {
  try {
    const data = matter(git(["show", `HEAD:${file}`])).data
    return data.draft !== true && !("excalidraw-plugin" in data)
  } catch {
    return false
  }
}

/** Adds an alias to a note as staged, and to the working tree's copy. */
function addAlias({ file, alias }: Alias): boolean {
  const own = vaultPath(file)!
  const staged = git(["show", `:${file}`])
  const updated = withAlias(staged, alias, own)
  if (updated === staged) return false
  const blob = git(["hash-object", "-w", "--stdin"], updated).trim()
  const mode = git(["ls-files", "-s", "--", file]).split(" ")[0]
  git(["update-index", "--cacheinfo", `${mode},${blob},${file}`])
  const onDisk = path.join(ROOT, file)
  if (fs.existsSync(onDisk)) {
    const text = fs.readFileSync(onDisk, "utf8")
    const edited = withAlias(text, alias, own)
    if (edited !== text) fs.writeFileSync(onDisk, edited)
  }
  return true
}

function main() {
  try {
    git(["rev-parse", "--verify", "--quiet", "HEAD"])
  } catch {
    return
  }
  const diff = ["diff", "--cached", "--name-status", "-z", "-M", "--diff-filter=ADR", "HEAD"]
  const output = git([...diff, "--", PUBLIC, STUBS])
  const { aliases, warnings } = planAliases(parseNameStatus(output), wasPublished)
  for (const each of aliases) {
    if (addAlias(each)) console.log(`alias-moves: ${each.file} has the alias ${each.alias}`)
  }
  for (const warning of warnings) console.warn(`alias-moves: ${warning}`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
