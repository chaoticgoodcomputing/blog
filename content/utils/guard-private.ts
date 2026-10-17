// `nx run vault:guard-private`: fails if a private note's stub in dist/vault-private publishes
// anything more than a placeholder. Read-only.
//
// dist/vault-private is committed, and CI builds the site from it, so every file there is public.
// The private vault's scrub writes each stub (content/private/scrub.mjs); this check is the public
// repo's own, independent check of what the scrub wrote. Each file there must be:
//
//   - a `.md` file;
//   - frontmatter of only `title`, `date`, `tags` and `draft`, in the shape the scrub writes
//     (`key: "value"`, `  - "tag"` lines and `draft: true`), with `private` among the tags;
//   - a body of exactly the placeholder text, content/utils/private-stub-body.txt, followed by
//     nothing or by the scrub's `## Links` list, every link of which points within the site.
//
// A failure names the file and the rule broken, never the text that broke it: CI's logs are public.
//
// With `--staged`, it checks the files as staged for the next commit (the pre-commit hook,
// .githooks/pre-commit); without it, the files on disk.

import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
const STUBS = "dist/vault-private"
const PLACEHOLDER = "content/utils/private-stub-body.txt"
const SITE = "chaoticgood.computer"

const KEPT_FIELDS = new Set(["title", "date", "tags", "draft"])
const LINKS_HEADING = "## Links\n\nThis note originally contained the following links:\n\n"
const LINK_LINE = /^- \[([^\]\n]+)\]\(([^)\n]+)\)$/

/**
 * Whether a link's target is within the site: a relative or `/`-rooted path, an in-page anchor, or
 * an http(s) URL on the site's domain or a subdomain of it. The scrub keeps only these.
 */
export function isInternal(target: string): boolean {
  const t = target.trim()
  if (!t || t.startsWith("//")) return false
  const scheme = t.match(/^([a-z][a-z0-9+.-]*):/i)
  if (!scheme) return true
  if (!/^https?$/i.test(scheme[1])) return false
  try {
    const host = new URL(t).hostname.toLowerCase()
    return host === SITE || host.endsWith(`.${SITE}`)
  } catch {
    return false
  }
}

/** A JSON string, as the scrub writes each frontmatter value; undefined for anything else. */
function jsonString(value: string): string | undefined {
  try {
    const parsed = JSON.parse(value)
    return typeof parsed === "string" ? parsed : undefined
  } catch {
    return undefined
  }
}

/** The rules the frontmatter's lines break. */
function checkFrontmatter(lines: string[]): string[] {
  const problems: string[] = []
  const seen = new Set<string>()
  const tags: string[] = []
  let inTags = false

  for (const line of lines) {
    const item = line.match(/^  - (.*)$/)
    if (item) {
      const tag = inTags ? jsonString(item[1]) : undefined
      if (tag === undefined) problems.push("frontmatter has a list item that is not a quoted tag under `tags`")
      else tags.push(tag)
      continue
    }
    inTags = false
    const field = line.match(/^([^:\s]+):(?: (.*))?$/)
    if (!field) {
      problems.push("frontmatter has a line that is not a field or a tag")
      continue
    }
    const [, key, value] = field
    if (!KEPT_FIELDS.has(key)) {
      problems.push(`frontmatter has a field other than title, date, tags and draft (\`${key}\`)`)
      continue
    }
    if (seen.has(key)) problems.push(`frontmatter repeats \`${key}\``)
    seen.add(key)
    if (key === "tags") {
      if (value !== undefined) problems.push("`tags` is not a list")
      inTags = true
    } else if (key === "draft") {
      if (value !== "true") problems.push("`draft` is not `true`")
    } else if (value === undefined || jsonString(value) === undefined) {
      problems.push(`\`${key}\` is not a quoted string`)
    }
  }

  if (!tags.includes("private")) problems.push("tags do not include `private`")
  return problems
}

/** The rules the body after the frontmatter breaks. */
function checkBody(body: string, placeholder: string): string[] {
  const text = body.replace(/^\n/, "")
  const opening = `${placeholder.trimEnd()}\n`
  if (!text.startsWith(opening)) return ["body does not start with the placeholder text"]

  const rest = text.slice(opening.length)
  if (rest === "") return []
  if (!rest.startsWith(`\n${LINKS_HEADING}`)) return ["body has text after the placeholder other than the `## Links` list"]

  const lines = rest.slice(LINKS_HEADING.length + 1).split("\n")
  if (lines.pop() !== "") return ["`## Links` list does not end with a newline"]
  if (lines.length === 0) return ["`## Links` list is empty"]

  const problems = new Set<string>()
  for (const line of lines) {
    const link = line.match(LINK_LINE)
    if (!link) problems.add("`## Links` list has a line that is not a single link")
    else if (!isInternal(link[2])) problems.add("`## Links` list has a link outside the site")
  }
  return [...problems]
}

/** The rules a stub breaks, given its path, its text and the placeholder text; empty if none. */
export function checkStub(file: string, text: string, placeholder: string): string[] {
  if (!file.endsWith(".md")) return ["is not a .md file"]
  const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) return ["does not start with frontmatter"]
  return [...checkFrontmatter(match[1].split("\n")), ...checkBody(match[2], placeholder)]
}

/** The stubs on disk, by their paths from the repo's root. */
function onDisk(): Map<string, string> {
  const files = new Map<string, string>()
  const visit = (relative: string) => {
    for (const entry of fs.readdirSync(path.join(ROOT, relative), { withFileTypes: true })) {
      const child = `${relative}/${entry.name}`
      if (entry.isDirectory()) visit(child)
      else files.set(child, fs.readFileSync(path.join(ROOT, child), "utf8"))
    }
  }
  if (fs.existsSync(path.join(ROOT, STUBS))) visit(STUBS)
  return files
}

/** The given paths' contents in git's index, read in one `git cat-file --batch`. */
function fromIndex(paths: string[]): Map<string, string> {
  const files = new Map<string, string>()
  if (paths.length === 0) return files
  const output = execFileSync("git", ["cat-file", "--batch"], {
    cwd: ROOT,
    input: paths.map((p) => `:${p}\n`).join(""),
    maxBuffer: 1 << 30,
  })
  let offset = 0
  for (const p of paths) {
    const end = output.indexOf(10, offset)
    const header = output.subarray(offset, end).toString()
    const size = Number(header.split(" ")[2])
    if (header.endsWith(" missing") || Number.isNaN(size)) throw new Error(`${p} is not in the index`)
    files.set(p, output.subarray(end + 1, end + 1 + size).toString("utf8"))
    offset = end + 1 + size + 1
  }
  return files
}

function staged(): { stubs: Map<string, string>; placeholder: string } {
  const listed = execFileSync("git", ["ls-files", "-z", "--", STUBS], { cwd: ROOT, encoding: "utf8" })
  const stubs = fromIndex(listed.split("\0").filter(Boolean))
  const tracked = execFileSync("git", ["ls-files", "--", PLACEHOLDER], { cwd: ROOT, encoding: "utf8" }).trim()
  if (!tracked) fail(`${PLACEHOLDER} isn't staged; stage it with the stubs.`)
  const placeholder = fromIndex([PLACEHOLDER]).get(PLACEHOLDER) ?? ""
  return { stubs, placeholder }
}

function fail(message: string): never {
  console.error(`❌ ${message}`)
  process.exit(1)
}

function main() {
  const { stubs, placeholder } = process.argv.includes("--staged")
    ? staged()
    : { stubs: onDisk(), placeholder: fs.readFileSync(path.join(ROOT, PLACEHOLDER), "utf8") }
  if (!placeholder.trim()) fail(`${PLACEHOLDER} is empty.`)

  const failures = [...stubs].map(([file, text]) => ({ file, problems: checkStub(file, text, placeholder) }))
  const failed = failures.filter((f) => f.problems.length > 0)

  if (failed.length === 0) {
    console.log(`✅ ${stubs.size} private-note stub(s) publish only the placeholder.`)
    return
  }
  console.error(`❌ ${failed.length} of ${stubs.size} private-note stub(s) publish more than the placeholder:\n`)
  for (const { file, problems } of failed) {
    console.error(`  ${file}`)
    for (const problem of problems) console.error(`    - ${problem}`)
  }
  console.error("\nRegenerate them with `nx run vault:publish-private`; never edit a stub by hand.")
  process.exit(1)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
