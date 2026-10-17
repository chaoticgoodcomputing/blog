#!/usr/bin/env node

// Drafts a Buttondown email from each public note tagged `writing/emails`. The note's title is the
// subject and its body the email, with its links written as full addresses on the site; the note
// stays an ordinary page, so the site is the newsletter's archive.
//
// Every email is created as a draft, and sent by hand from Buttondown. There is deliberately no way
// to send from here: direct sends wait until the drafts have proven the system.
//
//   node send-email.mjs --file <note> [--dry-run]           draft one note
//   node send-email.mjs --changed <before> <after> [--dry-run]
//       draft each note that became an email between two commits: tagged `writing/emails`, not a
//       draft and not private after, and not all of those before. The deploy workflow runs this on
//       each push, so editing a note that is already an email drafts nothing new.
//
// --dry-run writes each email's JSON to dist/emails/ instead of calling Buttondown.
// BUTTONDOWN_API_KEY is the Buttondown key (the repo secret BUTTONDOWN_POST_KEY in CI).

import { execFileSync } from "node:child_process"
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { mkdir, writeFile } from "node:fs/promises"
import { basename, dirname, join, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import matter from "gray-matter"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..")
const PUBLIC = "content/public"
const STUBS = "dist/vault-private/content"
const SITE = "https://blog.chaoticgood.computer"
const EMAIL_TAG = "writing/emails"
const DRY_RUN_DIR = "dist/emails"

const NOTE = /\.mdx?$/i
const IMAGE = /\.(png|jpe?g|gif|webp|svg|avif)$/i

/** A note's tags, as written, without a leading `#`. */
function tagsOf(frontmatter) {
  return [frontmatter.tags ?? []].flat().filter((tag) => typeof tag === "string").map((tag) => tag.replace(/^#/, ""))
}

const isDraft = (frontmatter) => String(frontmatter.draft).toLowerCase() === "true"

/** Whether a note's source makes it an email: tagged `writing/emails`, and neither a draft nor private. */
export function isEmail(source) {
  if (source === undefined) return false
  const { data } = matter(source)
  const tags = tagsOf(data)
  return tags.includes(EMAIL_TAG) && !tags.includes("private") && !isDraft(data)
}

// ─── Links ──────────────────────────────────────────────────────────────────────────────────────

/** A path from the vault's root as a page's address on the site, as astro/src/lib/vault.ts makes it. */
function pageAddress(vaultPath, heading) {
  let path = vaultPath.replace(/^\/+/, "").replace(/^(?:public|private)\//, "")
  if (NOTE.test(path) || !/\.[a-z0-9]+$/i.test(path)) {
    path = path
      .replace(NOTE, "")
      .split("/")
      .map((segment) => segment.replace(/\s/g, "-").replace(/&/g, "-and-").replace(/%/g, "-percent").replace(/[?#]/g, ""))
      .join("/")
      .replace(/(^|\/)index$/, "")
  }
  const anchor = heading ? `#${headingSlug(heading)}` : ""
  return `${SITE}/${encodeURI(path)}${anchor}`
}

/** A heading's anchor, as the site's Markdown makes it (GitHub's slugs). */
function headingSlug(heading) {
  return heading
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .replace(/\s/g, "-")
}

/** The vault's files by name, for links Obsidian resolves by name alone: `[[note]]`, `![[image.png]]`. */
function filesByName(root) {
  const byName = new Map()
  const visit = (folder) => {
    const absolute = join(root, folder)
    if (!existsSync(absolute)) return
    for (const entry of readdirSync(absolute, { withFileTypes: true })) {
      if (entry.name.startsWith(".")) continue
      const child = `${folder}/${entry.name}`
      if (entry.isDirectory()) visit(child)
      else {
        const path = child.replace(/^content\/public\//, "").replace(/^dist\/vault-private\//, "")
        for (const name of [entry.name, entry.name.replace(NOTE, "")]) {
          if (!byName.has(name.toLowerCase())) byName.set(name.toLowerCase(), path)
        }
      }
    }
  }
  visit(PUBLIC)
  visit(STUBS)
  return byName
}

/**
 * A link's target, as written in the note, resolved to a path from the vault's root: one written
 * from the root (`public/…`, `/content/…`) as it is, a bare name by the file of that name.
 * Undefined if no file has that name.
 */
function resolveTarget(target, byName) {
  const path = target.trim()
  if (path.includes("/")) return path
  return byName.get(path.toLowerCase())
}

/**
 * A note's body as an email's Markdown: wikilinks and embeds become Markdown links and images with
 * full addresses, as do Markdown links to the vault; Obsidian comments go. Code is left as it is.
 * `warn` hears of each link no file answers, which is left as its text.
 */
export function toEmailMarkdown(body, { byName = new Map(), warn = () => {} } = {}) {
  const convert = (text) =>
    text
      .replace(/%%[\s\S]*?%%/g, "")
      // A callout's `> [!note] Title` line becomes a bold label: its title, or its type.
      .replace(/^>\s*\[!([\w-]+)\][+-]?[ \t]*(.*)$/gm, (whole, type, title) => {
        const label = title.trim() || type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()
        return `> **${label}**`
      })
      .replace(/(!?)\[\[([^\]|#]*)(?:#([^\]|]*))?(?:\\?\|([^\]]*))?\]\]/g, (whole, embed, target, heading, alias) => {
        const label = (alias ?? (target ? basename(target).replace(NOTE, "") : heading) ?? "").trim()
        if (!target) return label
        const path = resolveTarget(target, byName)
        if (!path) {
          warn(target)
          return label
        }
        const address = pageAddress(path, heading)
        if (embed && IMAGE.test(path)) return `![${alias ?? ""}](${address})`
        return `[${label}](${address})`
      })
      .replace(/(!?)\[([^\]]*)\]\(<?([^)>\s]+)>?\)/g, (whole, embed, label, target) => {
        if (/^(?:[a-z][a-z0-9+.-]*:|#|\/\/)/i.test(target)) return whole
        let decoded = target
        try {
          decoded = decodeURI(target)
        } catch {}
        const [path, heading] = decoded.split("#")
        return `${embed}[${label}](${pageAddress(path, heading)})`
      })
      .replace(/\n{3,}/g, "\n\n")

  // Fenced code blocks, at odd indices, keep their text.
  return body
    .split(/(^```[\s\S]*?^```)/m)
    .map((part, index) => (index % 2 === 1 ? part : convert(part)))
    .join("")
    .trim()
}

// ─── Emails ─────────────────────────────────────────────────────────────────────────────────────

/** The email a note makes: its title as the subject, its body with a link back to its page. */
export function emailFor(file, source, byName, warn) {
  if (!NOTE.test(file) || /\.mdx$/i.test(file)) throw new Error(`${file}: only a .md note can be an email (an .mdx note's widgets don't render in email)`)
  const { data, content } = matter(source)
  if (tagsOf(data).includes("private")) throw new Error(`${file}: a private note can't be an email`)

  const page = pageAddress(relative(PUBLIC, file))
  const subject = (typeof data.title === "string" && data.title.trim()) || basename(file).replace(NOTE, "")
  const body = `${toEmailMarkdown(content, { byName, warn })}\n\n---\n\n[Read this on the site](${page})\n`
  return { subject, body, page }
}

/** Create the email in Buttondown, always as a draft. */
async function createDraft({ subject, body }) {
  const key = process.env.BUTTONDOWN_API_KEY
  if (!key) throw new Error("Missing BUTTONDOWN_API_KEY")
  const response = await fetch("https://api.buttondown.com/v1/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Token ${key}` },
    body: JSON.stringify({ subject, body, status: "draft", email_type: "public" }),
  })
  if (!response.ok) throw new Error(`Buttondown refused the draft: ${response.status} ${await response.text()}`)
  return response.json()
}

// ─── Which notes ────────────────────────────────────────────────────────────────────────────────

const git = (...args) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8", maxBuffer: 1 << 28 })

/** A file's text at a commit; undefined if it isn't there. */
function at(commit, file) {
  try {
    return git("show", `${commit}:${file}`)
  } catch {
    return undefined
  }
}

const isCommit = (sha) => {
  if (!sha || /^0+$/.test(sha)) return false
  try {
    git("cat-file", "-e", `${sha}^{commit}`)
    return true
  } catch {
    return false
  }
}

/** The public notes that became emails between two commits, each with its text after. */
function becameEmails(before, after) {
  // A push that opens the branch, or one forced past `before`, is measured from its last commit's parent.
  const from = isCommit(before) ? before : `${after}^`
  const changes = git("diff", "--name-status", "-M", "--diff-filter=AMR", from, after, "--", PUBLIC)
  return changes
    .split("\n")
    .filter(Boolean)
    .map((line) => line.split("\t"))
    // `M\tpath`, `A\tpath`, or a rename's `R100\told\tnew`.
    .map(([, was, renamed]) => ({ file: renamed ?? was, was }))
    .filter(({ file }) => NOTE.test(file))
    .map(({ file, was }) => ({ file, source: at(after, file), before: at(from, was) }))
    .filter(({ source, before }) => isEmail(source) && !isEmail(before))
    .map(({ file, source }) => ({ file, source }))
}

// ─── Main ───────────────────────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes("--dry-run")
  const option = (name, count = 1) => {
    const index = args.indexOf(name)
    return index === -1 ? undefined : args.slice(index + 1, index + 1 + count)
  }

  let notes
  const file = option("--file")?.[0]
  const changed = option("--changed", 2)
  if (file) {
    const note = relative(ROOT, resolve(file))
    notes = [{ file: note, source: readFileSync(join(ROOT, note), "utf8") }]
  }
  else if (changed?.length === 2) notes = becameEmails(...changed)
  else throw new Error("Usage: send-email.mjs --file <note> | --changed <before> <after> [--dry-run]")

  console.log(`📧 ${notes.length} note(s) to draft as email${notes.length === 1 ? "" : "s"} (${dryRun ? "dry run" : "Buttondown drafts"})`)
  if (notes.length === 0) return

  const byName = filesByName(ROOT)
  let failed = 0
  for (const { file: note, source } of notes) {
    try {
      const email = emailFor(note, source, byName, (target) => console.warn(`   ⚠️  ${note}: no file for the link "${target}"; left as text`))
      console.log(`\n   ${note}\n   Subject: ${email.subject}\n   Page: ${email.page}`)

      if (dryRun) {
        const out = join(ROOT, DRY_RUN_DIR, `${basename(note).replace(NOTE, "")}.json`)
        await mkdir(dirname(out), { recursive: true })
        await writeFile(out, `${JSON.stringify({ ...email, status: "draft", email_type: "public", source: note }, null, 2)}\n`)
        console.log(`   ✅ Written to ${relative(ROOT, out)}`)
      } else {
        const draft = await createDraft(email)
        console.log(`   ✅ Draft created: ${draft.id}. Review and send it from Buttondown.`)
      }
    } catch (error) {
      console.error(`   ❌ ${error instanceof Error ? error.message : error}`)
      failed++
    }
  }
  if (failed) process.exit(1)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error("💥", error instanceof Error ? error.message : error)
    process.exit(1)
  })
}
