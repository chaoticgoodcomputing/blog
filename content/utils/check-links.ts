// `nx run vault:check-links`: every link in both vaults starts from Obsidian's vault root, content/,
// and names a file there by its exact path. Read-only: it reports, and never rewrites a note.
//
// Obsidian's vault is content/, with the public vault at content/public and the private one at
// content/private, so a link written from the root is `[[public/content/notes/x]]` or
// `[[private/content/notes/x]]` (a leading `/` is the root too). One written any other way, such as
// `[[/content/notes/x]]`, resolves only by Obsidian matching the end of its path, against whichever
// file happens to match. This check fails on each of those, and on a link from the root to a file
// that isn't there, listing them by note.
//
// What it lets pass:
//   - a bare name, `[[note]]` or `![[image.png]]`, which Obsidian resolves by name;
//   - a link from the root to a note not yet written, `[[private/content/notes/periodic/daily/…]]`:
//     Obsidian makes the note there when the link is followed;
//   - a link to an Obsidian Copilot conversation, which is no note of the vault;
//   - an external address, and a link to a heading or block of the same note;
//   - a link listed in its vault's `.check-links-allow`: one per line, the note's path from
//     content/, a tab, and the link's path as written. `#` starts a comment. The private vault's
//     list stays in the private vault.
//
// It reads every note on disk, as Obsidian does, with the Annotator plugin's records (`>{"text":…}`
// lines), whose comments hold links too. The private vault is checked when it is checked out.

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { parseMetadata } from "../../packages/obsidian-markdown/src/index.ts"

const CONTENT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const NOTE = /\.(md|mdx)$/i

// The vaults: each one's folder, the notes' folder in it, and its allow list.
const VAULTS = [
  { name: "public", notes: "public", allow: "public/.check-links-allow" },
  { name: "private", notes: "private/content", allow: "private/.check-links-allow" },
].filter((vault) => fs.existsSync(path.join(CONTENT, vault.notes)))

/** Every file under `folder`, by its path from content/, but dotfiles and what is in a dot-folder. */
function filesUnder(folder: string): string[] {
  const found: string[] = []
  const visit = (relative: string) => {
    for (const entry of fs.readdirSync(path.join(CONTENT, relative), { withFileTypes: true })) {
      if (entry.name.startsWith(".") || entry.name === "node_modules") continue
      const child = `${relative}/${entry.name}`
      if (entry.isDirectory()) visit(child)
      else found.push(child)
    }
  }
  visit(folder)
  return found
}

const files = new Set(VAULTS.flatMap((vault) => filesUnder(vault.notes)))

/** The file a path from content/ names exactly, in its case: as written, or a note without its extension. */
const exactly = (linkpath: string): boolean => files.has(linkpath) || files.has(`${linkpath}.md`) || files.has(`${linkpath}.mdx`)

/** The allowed links: `<note>\t<linkpath>`. */
function allowed(): Set<string> {
  const allow = new Set<string>()
  for (const vault of VAULTS) {
    const file = path.join(CONTENT, vault.allow)
    if (!fs.existsSync(file)) continue
    for (const line of fs.readFileSync(file, "utf8").split("\n")) {
      const entry = line.replace(/#.*$/, "").trim()
      if (!entry) continue
      const [note, linkpath] = entry.split("\t").map((part) => part.trim())
      if (note && linkpath) allow.add(`${note}\t${linkpath}`)
    }
  }
  return allow
}

const decode = (raw: string) => {
  try {
    return decodeURI(raw)
  } catch {
    return raw
  }
}

/** A link's path as written, without its heading or block, its alias or its title. */
function linkpathOf(original: string): string {
  const wikilink = /^!?\[\[([^\]]*)\]\]$/.exec(original)
  if (wikilink) return wikilink[1]!.split(/[\\|#]/)[0]!.trim()
  const markdown = /\]\(\s*(?:<([^>]*)>|([^\s)]*))/.exec(original.slice(original.lastIndexOf("](")))
  return decode((markdown?.[1] ?? markdown?.[2] ?? "").split("#")[0]!).trim()
}

/** Each link a note writes, as written: in its body, its frontmatter and its Annotator records. */
async function linksOf(note: string, text: string): Promise<string[]> {
  const cache = await parseMetadata(text, { format: note.endsWith(".mdx") ? "mdx" : "md", features: { gfm: true, smartPunctuation: true } })
  const links = [...(cache.links ?? []), ...(cache.embeds ?? []), ...(cache.frontmatterLinks ?? [])].map((link) => link.original)
  for (const line of text.matchAll(/^>\s?\{.*$/gm)) {
    for (const link of line[0].matchAll(/!?\[\[[^\]\n]*\]\]|!?\[[^\]\n]*\]\([^)\n]*\)/g)) links.push(link[0])
  }
  return links
}

type Problem = "not from content/" | "names no file"
const problems = new Map<string, { linkpath: string; problem: Problem }[]>()
const allow = allowed()
let checked = 0
let unwritten = 0
let allowedCount = 0

for (const note of [...files].filter((file) => NOTE.test(file)).sort()) {
  const text = fs.readFileSync(path.join(CONTENT, note), "utf8")
  for (const original of await linksOf(note, text)) {
    const linkpath = linkpathOf(original)
    if (!linkpath || /^[a-z][a-z0-9+.-]*:/i.test(linkpath)) continue
    if (!linkpath.includes("/")) continue
    if (/(^|\/)copilot\/copilot-conversations\//.test(linkpath)) continue
    checked++
    if (allow.has(`${note}\t${linkpath}`)) {
      allowedCount++
      continue
    }
    let problem: Problem | undefined
    const fromRoot = linkpath.replace(/^\//, "")
    if (!/^(public|private)\//.test(fromRoot)) problem = "not from content/"
    else if (!exactly(fromRoot)) {
      // A note not yet written is where following the link will make it.
      if (!path.posix.extname(fromRoot) || NOTE.test(fromRoot)) unwritten++
      else problem = "names no file"
    }
    if (problem) {
      const list = problems.get(note) ?? []
      list.push({ linkpath, problem })
      problems.set(note, list)
    }
  }
}

const failures = [...problems.values()].reduce((n, list) => n + list.length, 0)
for (const [note, list] of problems) {
  console.log(note)
  for (const { linkpath, problem } of list) console.log(`  ${problem}: ${linkpath}`)
}
console.log(
  `\n${VAULTS.map((vault) => vault.name).join(" and ")} vault: ${checked} links by path, ${failures} failing in ${problems.size} notes; ` +
    `${unwritten} to notes not yet written and ${allowedCount} allowed pass.`,
)
if (failures > 0) process.exitCode = 1
