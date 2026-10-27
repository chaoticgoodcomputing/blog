// A note's date: what its frontmatter says, then the last commit to touch its file, then the
// file's modification time. Git is asked once for each of the vault's sources, not once per note.
//
// Every date is an instant, read and printed in UTC, so a note shows the same day wherever the
// site is built. Nothing here reads the build machine's time zone.

import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { readManifest } from "./assembly.ts"

// An ISO 8601 date, then optionally a time, then optionally a zone: `2026-01-04`,
// `2026-01-04T12:30`, `2026-01-04 12:30:00.5`, `2026-01-04T12:30:00Z`, `2026-01-04T12:30:00-05:00`.
const ISO_DATE = /^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?)(?:(Z)|([+-]\d{2}):?(\d{2}))?)?$/i

/**
 * A frontmatter date, written as ISO 8601. One with no time (`2026-01-04`) is midnight UTC on that
 * day, and one with a time and no zone (`2026-01-04T23:30:00`, as Obsidian's date and time property
 * writes it) is that time in UTC. Anything else gives undefined: `new Date()` would read the build
 * machine's time zone into it.
 */
export function parseFrontmatterDate(value: unknown): Date | undefined {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? undefined : value
  if (typeof value !== "string") return undefined
  const match = ISO_DATE.exec(value.trim())
  if (!match) return undefined
  const [, day, time = "00:00", , hours, minutes] = match
  const parsed = new Date(`${day}T${time}${hours ? `${hours}:${minutes}` : "Z"}`)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

// `%x01` opens each commit, so a commit's record is its time and then what it did to each path: its
// status, then the path, or for a move the path it had and the path it has, each ended by the NUL
// that `-z` writes. `-z` also keeps a path as it is, unquoted. Only a move that leaves the file as
// it was is read as a move (`--find-renames=100%`); any other is a deletion and an addition.
const GIT_LOG = ["log", "--format=%x01%ct", "--name-status", "--find-renames=100%", "-z"]

/**
 * Reads the output of that `git log`, of the whole repository: for each path under `folder` (a
 * path from the repository's root, ending in `/`, or empty for all of it), by its path from
 * `folder`, the time of the newest commit to touch it.
 *
 * A file moved into `folder` from outside it, and not changed by the move, keeps the history it
 * had there: the move is no change to it. The private notes' stubs came into `dist/vault-private`
 * from `content/public` that way, and each keeps its date. A move within `folder` is a change, as
 * it always was.
 */
export function parseGitLog(output: string, folder = ""): Map<string, Date> {
  const dates = new Map<string, Date>()
  const inside = (written: string) => written.startsWith(folder)
  // A path outside `folder` that a file moved in from, by the path from `folder` that it has now.
  // The log is newest first, so it is read for each commit older than the move.
  const movedIn = new Map<string, string>()
  const touch = (written: string, date: Date) => {
    const file = movedIn.get(written) ?? (inside(written) ? written.slice(folder.length) : undefined)
    // The first time a path is seen is its last change.
    if (file && !dates.has(file)) dates.set(file, date)
  }
  for (const commit of output.split("\x01")) {
    const [time, ...fields] = commit.split("\0")
    const seconds = Number(time)
    if (!time || !Number.isFinite(seconds)) continue
    const date = new Date(seconds * 1000)
    for (let i = 0; i < fields.length; ) {
      const status = fields[i++]!.replace(/^\n/, "")
      if (!status) continue
      if (!/^[RC]/.test(status)) {
        touch(fields[i++] ?? "", date)
        continue
      }
      const from = fields[i++] ?? ""
      const to = fields[i++] ?? ""
      if (status.startsWith("R") && inside(to) && !inside(from)) {
        const file = to.slice(folder.length)
        if (!dates.has(file)) movedIn.set(from, file)
        continue
      }
      touch(from, date)
      touch(to, date)
    }
  }
  return dates
}

/**
 * The time of the last commit to touch each file under `root`, by the file's path from `root`,
 * from one `git log`. Empty when `root` is in no repository, or there is no git.
 */
export function gitDates(root: string): Map<string, Date> {
  const git = (args: string[]) =>
    execFileSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 256 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] })
  try {
    // The whole repository's log, not `root`'s alone, so a file moved into `root` is seen to come
    // from where it was.
    return parseGitLog(git(GIT_LOG), git(["rev-parse", "--show-prefix"]).trim())
  } catch {
    return new Map()
  }
}

/** A file's modification time. */
export const modifiedTime = (absolutePath: string): Date => fs.statSync(absolutePath).mtime

/** Where the dates of a vault's files are asked for. */
export interface VaultDates {
  /** The time of the last commit to touch each file, by its path in the vault. */
  git: Map<string, Date>
  /** The file on disk a file of the vault is, by its path in the vault, for its modification time. */
  sourceOf: (file: string) => string
}

/**
 * Where to ask for the dates of the files of the vault at `root`. A vault `astro:vault` assembled
 * (./assembly.ts) is in no repository's history, and its notes are copies: git is asked once for
 * each of its sources, and each file's dates are its source file's, as its manifest names it. Any
 * other vault is its own source.
 */
export function vaultDates(root: string): VaultDates {
  const manifest = readManifest(root)
  if (!manifest) return { git: gitDates(root), sourceOf: (file) => path.join(root, file) }

  // Each source is mounted at the vault's root, so a path from a source's root is the path in the
  // vault. A date is taken only for a file that came from that source, not from one beside it.
  const git = new Map<string, Date>()
  for (const source of manifest.sources) {
    for (const [file, date] of gitDates(source)) {
      if (manifest.files.get(file) === path.join(source, file)) git.set(file, date)
    }
  }
  return { git, sourceOf: (file) => manifest.files.get(file) ?? path.join(root, file) }
}

export interface NoteDates {
  /** The note's date: frontmatter's, and none where frontmatter gives none it can read. */
  date: Date | undefined
  /** When the note last changed: git's, then the file system's, and never before its date. */
  modified: Date
}

/** A note's dates from its three sources. The file system is asked only when it is needed. */
export function resolveDates(sources: { frontmatter: unknown; git: Date | undefined; filesystem: () => Date }): NoteDates {
  const changed = sources.git ?? sources.filesystem()
  const date = parseFrontmatterDate(sources.frontmatter)
  return { date, modified: date !== undefined && changed < date ? date : changed }
}

/** A date as the site prints it: `Mar 01, 2024`, in UTC. */
export function formatDate(date: Date, locale = "en-US"): string {
  return date.toLocaleDateString(locale, { year: "numeric", month: "short", day: "2-digit", timeZone: "UTC" })
}
