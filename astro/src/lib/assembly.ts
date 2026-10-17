// The assembled vault: the one folder the site reads (./vault.ts), put together by `astro:vault`
// (scripts/assemble-vault.ts) from the vault's sources, `content/public` and then
// `dist/vault-private`. Each source is mounted at the vault's root, so a note has the same path,
// slug and address whichever source it comes from, and a link from one source to a note of the
// other resolves as if they were one vault.
//
// A note is copied, with its links written from the assembled vault's root (./link-prefixes.ts):
// Obsidian writes them from its own vault's root, where each source is a folder. An attachment
// is linked to its source rather than copied: the vault's attachments run to hundreds of megabytes,
// and every reader of the vault follows a link. The assembled vault is in no repository's history,
// so a manifest beside its files, `.sources.json`, names each one's source file, for the dates git
// gives a note (./dates.ts).
//
// Nothing here opens the vault, so the script can assemble it before anything reads it.

import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { mapLinkPrefixes } from "./link-prefixes.ts"

/** The manifest's name in the assembled vault: a dotfile, so it is no file of the vault. */
export const MANIFEST = ".sources.json"

/** The extensions of the files the assembly copies rather than links: the vault's notes. */
const COPIED = new Set(["md", "mdx"])

/** What the manifest says, with its paths as absolute paths. */
export interface Manifest {
  /** The vault's sources, in the order they are mounted. */
  sources: string[]
  /** Each file of the assembled vault, by its path in it, with the source file it came from. */
  files: Map<string, string>
}

// On disk, the manifest's paths are from the assembled vault's root and written with `/`, so a
// checkout keeps a vault that names its sources wherever it is.
interface ManifestFile {
  sources: string[]
  files: Record<string, string>
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

/**
 * The files of one source, by their paths from its root, written with `/`: each but a dotfile, a
 * file in a dot-folder, and a file git ignores. A source that isn't there has none.
 */
function sourceFiles(source: string): string[] {
  if (!fs.existsSync(source)) return []
  const ignored = gitIgnored(source)
  const found: string[] = []
  const visit = (relative: string) => {
    for (const entry of fs.readdirSync(path.join(source, relative), { withFileTypes: true })) {
      if (entry.name.startsWith(".")) continue
      const child = relative ? `${relative}/${entry.name}` : entry.name
      if (ignored.has(child)) continue
      const stats = fs.statSync(path.join(source, child), { throwIfNoEntry: false })
      if (stats?.isDirectory()) visit(child)
      else if (stats?.isFile()) found.push(child)
    }
  }
  visit("")
  return found
}

/**
 * What the assembled vault holds: each file's path in it, with its source file. The same path in
 * two sources is an error naming both files, since one would hide the other. Paths from two
 * sources are compared without case, as a file system that ignores case would put both in one place.
 */
export function planVault(sources: string[]): Map<string, string> {
  const plan = new Map<string, string>()
  const earlier = new Map<string, string>()
  for (const source of sources) {
    const own = sourceFiles(source).map((file): [string, string] => [file, path.join(source, file)])
    for (const [file, from] of own) {
      const other = earlier.get(file.toLowerCase())
      if (other !== undefined) throw new Error(`${other} and ${from} are both ${file} in the vault; rename or remove one`)
    }
    // Two paths in one source that differ only in case are its own, as the source has them.
    for (const [file, from] of own) {
      plan.set(file, from)
      earlier.set(file.toLowerCase(), from)
    }
  }
  return plan
}

// A note in the assembled vault: its source's contents with their links mapped, written only when
// they differ from what is there, with its source's modification time, so that whatever reads a
// file's time reads the source's, however its links were written.
function copyNote(from: string, to: string): void {
  const contents = Buffer.from(mapLinkPrefixes(fs.readFileSync(from, "utf8")), "utf8")
  const there = fs.lstatSync(to, { throwIfNoEntry: false })
  if (there?.isFile() && fs.readFileSync(to).equals(contents)) return
  if (there) fs.rmSync(to, { recursive: true, force: true })
  fs.writeFileSync(to, contents)
  const { atime, mtime } = fs.statSync(from)
  fs.utimesSync(to, atime, mtime)
}

// An attachment in the assembled vault: a link to its source, from the link's own folder, so the
// vault still finds its sources if the checkout moves.
function linkAttachment(from: string, to: string): void {
  const target = path.relative(path.dirname(to), from)
  const there = fs.lstatSync(to, { throwIfNoEntry: false })
  if (there?.isSymbolicLink() && fs.readlinkSync(to) === target) return
  if (there) fs.rmSync(to, { recursive: true, force: true })
  fs.symlinkSync(target, to)
}

// Removes from `root` what the plan doesn't hold, and every folder left empty. A link is removed
// as a link: nothing is ever followed out of the assembled vault, into a source.
function prune(root: string, plan: Map<string, string>, relative = ""): void {
  for (const entry of fs.readdirSync(path.join(root, relative), { withFileTypes: true })) {
    const child = relative ? `${relative}/${entry.name}` : entry.name
    const absolute = path.join(root, child)
    if (!relative && entry.name === MANIFEST) continue
    if (entry.isDirectory()) {
      prune(root, plan, child)
      if (fs.readdirSync(absolute).length === 0) fs.rmdirSync(absolute)
    } else if (!plan.has(child)) {
      fs.rmSync(absolute, { force: true })
    }
  }
}

/**
 * Assemble `sources` into the vault at `root`: a note copied, an attachment linked, and what is no
 * longer in a source removed, so the vault is its sources' files and nothing else. A file already
 * as it should be is left alone, so assembling again after a change rewrites only what changed.
 * Throws, leaving the vault as it was, when two sources have a file at the same path.
 */
export function assembleVault(sources: string[], root: string): Manifest {
  const plan = planVault(sources)
  fs.mkdirSync(root, { recursive: true })
  prune(root, plan)
  for (const [file, from] of plan) {
    const to = path.join(root, file)
    fs.mkdirSync(path.dirname(to), { recursive: true })
    if (COPIED.has(path.extname(file).slice(1).toLowerCase())) copyNote(from, to)
    else linkAttachment(from, to)
  }

  const fromRoot = (absolute: string) => path.relative(root, absolute).split(path.sep).join("/")
  const written: ManifestFile = {
    sources: sources.map(fromRoot),
    files: Object.fromEntries([...plan].map(([file, from]) => [file, fromRoot(from)])),
  }
  // Written beside it and renamed into place, so a reader never finds half a manifest.
  const manifest = path.join(root, MANIFEST)
  fs.writeFileSync(`${manifest}.${process.pid}.partial`, `${JSON.stringify(written, null, 2)}\n`)
  fs.renameSync(`${manifest}.${process.pid}.partial`, manifest)
  return { sources, files: plan }
}

/** The manifest of the vault at `root`, when `astro:vault` assembled it. Undefined for any other vault. */
export function readManifest(root: string): Manifest | undefined {
  let text: string
  try {
    text = fs.readFileSync(path.join(root, MANIFEST), "utf8")
  } catch {
    return undefined
  }
  const written = JSON.parse(text) as ManifestFile
  const absolute = (fromRoot: string) => path.resolve(root, fromRoot)
  return {
    sources: written.sources.map(absolute),
    files: new Map(Object.entries(written.files).map(([file, from]) => [file, absolute(from)])),
  }
}
