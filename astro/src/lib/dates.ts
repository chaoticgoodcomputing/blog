// A note's date: what its frontmatter says, then the last commit to touch its file, then the
// file's modification time. Git is asked once for the whole vault, not once per note.
//
// Every date is an instant, read and printed in UTC, so a note shows the same day wherever the
// site is built. Nothing here reads the build machine's time zone.

import { execFileSync } from "node:child_process"
import fs from "node:fs"

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

// `%x01` opens each commit, so a commit's record is its time and then the paths it touched, each
// ended by the NUL that `-z` writes. `-z` also keeps a path as it is, unquoted.
const GIT_LOG = ["log", "--format=%x01%ct", "--name-only", "-z"]

/** Reads the output of that `git log`: for each path, the time of the newest commit to touch it. */
export function parseGitLog(output: string): Map<string, Date> {
  const dates = new Map<string, Date>()
  for (const commit of output.split("\x01")) {
    const [time, ...paths] = commit.split("\0")
    const seconds = Number(time)
    if (!time || !Number.isFinite(seconds)) continue
    for (const written of paths) {
      const file = written.replace(/^\n/, "")
      // The log is newest first, so the first time a path is seen is its last change.
      if (file && !dates.has(file)) dates.set(file, new Date(seconds * 1000))
    }
  }
  return dates
}

/**
 * The time of the last commit to touch each file under `root`, by the file's path from `root`,
 * from one `git log`. Empty when `root` is in no repository, or there is no git.
 */
export function gitDates(root: string): Map<string, Date> {
  try {
    const output = execFileSync("git", [...GIT_LOG, "--relative", "--", "."], {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 256 * 1024 * 1024,
      stdio: ["ignore", "pipe", "ignore"],
    })
    return parseGitLog(output)
  } catch {
    return new Map()
  }
}

/** A file's modification time. */
export const modifiedTime = (absolutePath: string): Date => fs.statSync(absolutePath).mtime

export interface NoteDates {
  /** The note's date: frontmatter's, then git's, then the file system's. */
  date: Date
  /** When the note last changed: git's, then the file system's, and never before its date. */
  modified: Date
}

/** A note's dates from its three sources. The file system is asked only when it is needed. */
export function resolveDates(sources: { frontmatter: unknown; git: Date | undefined; filesystem: () => Date }): NoteDates {
  const changed = sources.git ?? sources.filesystem()
  const date = parseFrontmatterDate(sources.frontmatter) ?? changed
  return { date, modified: changed < date ? date : changed }
}

/** A date as the site prints it: `Mar 01, 2024`, in UTC. */
export function formatDate(date: Date, locale = "en-US"): string {
  return date.toLocaleDateString(locale, { year: "numeric", month: "short", day: "2-digit", timeZone: "UTC" })
}
