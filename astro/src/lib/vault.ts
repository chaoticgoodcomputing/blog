// The site's vault: content/public. The Markdown pipeline resolves links against it
// (astro.config.ts), and the notes query (./notes.ts) reads from it what every note knows.
//
// One vault per process. Astro loads its config, its content config and its pages as separate
// module graphs, each with a copy of this module, so the vault is kept on `globalThis`, where every
// copy finds the same one. The dev server reads the vault again when a file in it changes
// (src/content.config.ts), and every copy sees the new one.

import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { Vault } from "@chaoticgoodcomputing/obsidian-markdown"

/** The vault's root. Astro runs from astro/, so the default is the repo's content/public. */
export const VAULT_ROOT = path.resolve(process.env.VAULT_ROOT ?? "../content/public")

/** The extensions the site renders as pages. */
export const NOTE_EXTENSIONS = ["md", "mdx"]

/**
 * A note's slug, from its path in the vault: Quartz's rule, so a note keeps the address it has
 * today. The extension goes, a space becomes `-`, `&` becomes `-and-`, `%` becomes `-percent`, and
 * `?` and `#` go.
 */
export function slugFor(notePath: string): string {
  return notePath
    .replace(/\.mdx?$/i, "")
    .split("/")
    .map((segment) =>
      segment.replace(/\s/g, "-").replace(/&/g, "-and-").replace(/%/g, "-percent").replace(/[?#]/g, ""),
    )
    .join("/")
}

/** A note's page path under the site's root: its slug, with a folder's `index` as the folder. */
export function pagePath(slug: string): string {
  return slug === "index" ? "" : slug.replace(/\/index$/, "")
}

/**
 * The files under `root` that git ignores, by their paths from it: one `git ls-files`, so a
 * `.gitignore` anywhere in the repository counts. None when `root` is in no repository.
 */
export function gitIgnored(root: string): Set<string> {
  try {
    const output = execFileSync("git", ["ls-files", "--others", "--ignored", "--exclude-standard", "-z", "--", "."], {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      stdio: ["ignore", "pipe", "ignore"],
    })
    return new Set(output.split("\0").filter(Boolean))
  } catch {
    return new Set()
  }
}

// A note's frontmatter: the block between the `---` lines that open it.
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/
// `draft: true` in it, YAML's `true` in any case, or the string `"true"` as Quartz read it.
const DRAFT = /^draft:[ \t]*(?:true|"true"|'true')[ \t]*(?:#.*)?$/im

/** Whether a note's source is a draft: its frontmatter says `draft: true`. */
export function isDraft(source: string): boolean {
  const frontmatter = FRONTMATTER.exec(source)?.[1]
  return frontmatter !== undefined && DRAFT.test(frontmatter)
}

/** The notes under `root` that are drafts, by their paths from it, of those `ignored` leaves in. */
function drafts(root: string, ignored: Set<string>): Set<string> {
  const notes = fs.readdirSync(root, { recursive: true, encoding: "utf8" }).filter((file) => {
    const extension = path.extname(file).slice(1).toLowerCase()
    return NOTE_EXTENSIONS.includes(extension) && !ignored.has(file) && !file.split(path.sep).some((part) => part.startsWith("."))
  })
  return new Set(notes.filter((file) => isDraft(fs.readFileSync(path.join(root, file), "utf8"))).map((file) => file.split(path.sep).join("/")))
}

/**
 * Open a vault as the site reads one. The site's own is `getVault()`. A file git ignores is no
 * file of the site's vault, as a dotfile is none of any, and neither is a draft (`isDraft`): a note
 * can't link to it, and the site never publishes it, nor what only it links to.
 */
export const openVault = (root: string = VAULT_ROOT): Promise<Vault> => {
  const ignored = gitIgnored(root)
  const drafted = drafts(root, ignored)
  return Vault.open(root, {
    ignore: (file) => ignored.has(file) || drafted.has(file),
    noteExtensions: NOTE_EXTENSIONS,
    // The site reads an inline `#word` as text, not as a tag: its tags are frontmatter's.
    tags: false,
    // Astro's defaults, so the cache reads a heading as the page renders it.
    features: { gfm: true, smartPunctuation: true },
    // Each alias is an address of its note (./aliases.ts), so a link written to one goes there too.
    resolveAliases: true,
  })
}

interface Holder {
  vault: Vault
}

// The promise is stored before it settles, so copies of this module loading at once share one read.
const KEY = Symbol.for("chaoticgoodcomputing.astro.vault")
const scope = globalThis as { [KEY]?: Promise<Holder> }
const holder = await (scope[KEY] ??= openVault().then((vault) => ({ vault })))

/** The vault as it was last read. */
export const getVault = (): Vault => holder.vault

/** Read the vault from disk again, for every copy of this module. */
export async function refreshVault(): Promise<Vault> {
  holder.vault = await openVault()
  return holder.vault
}
