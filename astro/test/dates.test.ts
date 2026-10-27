import { execFileSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterAll, beforeAll, expect, test } from "vitest"
import { formatDate, gitDates, modifiedTime, parseFrontmatterDate, parseGitLog, resolveDates } from "../src/lib/dates.ts"

// A repository of its own, with a vault in a folder of it and two commits at known times.
let repo: string
const git = (args: string[], time?: string) =>
  execFileSync("git", ["-c", "user.name=Test", "-c", "user.email=test@example.com", "-c", "commit.gpgsign=false", ...args], {
    cwd: repo,
    stdio: "pipe",
    env: { ...process.env, ...(time ? { GIT_AUTHOR_DATE: time, GIT_COMMITTER_DATE: time } : {}) },
  })

beforeAll(() => {
  repo = fs.mkdtempSync(path.join(os.tmpdir(), "astro-dates-"))
  fs.mkdirSync(path.join(repo, "vault/notes"), { recursive: true })
  git(["init", "--quiet"])
  fs.writeFileSync(path.join(repo, "vault/notes/first.md"), "one\n")
  fs.writeFileSync(path.join(repo, "vault/notes/a note é.md"), "one\n")
  fs.writeFileSync(path.join(repo, "outside.md"), "one\n")
  git(["add", "."])
  git(["commit", "--quiet", "-m", "first"], "2026-02-03T04:05:06Z")
  fs.writeFileSync(path.join(repo, "vault/notes/first.md"), "two\n")
  git(["commit", "--quiet", "-am", "second"], "2026-06-07T08:09:10Z")
  fs.writeFileSync(path.join(repo, "vault/notes/uncommitted.md"), "one\n")
})

afterAll(() => fs.rmSync(repo, { recursive: true, force: true }))

test("a date with no time is midnight UTC on that day, whatever the build machine's time zone", () => {
  expect(parseFrontmatterDate("2026-01-04")?.toISOString()).toBe("2026-01-04T00:00:00.000Z")
  expect(parseFrontmatterDate(" 2026-01-04 ")?.toISOString()).toBe("2026-01-04T00:00:00.000Z")
})

test("a date with a time is that instant, and a date YAML has already read is kept", () => {
  expect(parseFrontmatterDate("1970-01-02T00:00:00.000Z")?.toISOString()).toBe("1970-01-02T00:00:00.000Z")
  expect(parseFrontmatterDate("2026-03-01T12:00:00-05:00")?.toISOString()).toBe("2026-03-01T17:00:00.000Z")
  expect(parseFrontmatterDate(new Date("2026-03-01T12:00:00Z"))?.toISOString()).toBe("2026-03-01T12:00:00.000Z")
})

test("the tests run in a time zone that is not UTC, so a date read in the machine's zone shows", () => {
  expect(new Date(2026, 2, 1).getTimezoneOffset()).not.toBe(0)
})

test("a date and time with no zone is that time in UTC, as Obsidian's date and time property writes it", () => {
  expect(parseFrontmatterDate("2026-03-01T23:30:00")?.toISOString()).toBe("2026-03-01T23:30:00.000Z")
  expect(parseFrontmatterDate("2026-03-01 23:30")?.toISOString()).toBe("2026-03-01T23:30:00.000Z")
  expect(parseFrontmatterDate("2026-03-01T00:00:00.250")?.toISOString()).toBe("2026-03-01T00:00:00.250Z")
  expect(formatDate(parseFrontmatterDate("2026-03-01T23:30:00")!)).toBe("Mar 01, 2026")
  expect(formatDate(parseFrontmatterDate("2026-03-01T00:00:00")!)).toBe("Mar 01, 2026")
})

test("a zone is read however ISO 8601 writes it", () => {
  expect(parseFrontmatterDate("2026-03-01T12:00:00z")?.toISOString()).toBe("2026-03-01T12:00:00.000Z")
  expect(parseFrontmatterDate("2026-03-01T12:00-0500")?.toISOString()).toBe("2026-03-01T17:00:00.000Z")
  expect(parseFrontmatterDate("2026-03-01 12:00:00+09:00")?.toISOString()).toBe("2026-03-01T03:00:00.000Z")
})

test("what is no date is no date", () => {
  for (const value of ["soon", "", null, undefined, 20260104, new Date("soon")]) {
    expect(parseFrontmatterDate(value)).toBeUndefined()
  }
})

test("a date that is not written as ISO 8601 is no date, since the machine's time zone would be read into it", () => {
  for (const value of ["2026-3-1", "March 1, 2026", "03/01/2026", "2026-03-01T25:00:00", "2026-13-01"]) {
    expect(parseFrontmatterDate(value)).toBeUndefined()
  }
  const git = new Date("2026-05-05T00:00:00Z")
  expect(resolveDates({ frontmatter: "2026-3-1", git, filesystem: () => git }).date).toBeUndefined()
})

test("a path's git date is the time of the newest commit to touch it", () => {
  const log = "\x011780819750\0\nM\0vault/notes/first.md\0\x011770091506\0\nA\0vault/notes/a note é.md\0A\0vault/notes/first.md\0A\0outside.md\0"
  const dates = parseGitLog(log, "vault/")
  expect(dates.get("notes/first.md")?.toISOString()).toBe("2026-06-07T08:09:10.000Z")
  expect(dates.get("notes/a note é.md")?.toISOString()).toBe("2026-02-03T04:05:06.000Z")
  expect(dates.size).toBe(2)
})

test("a file moved into the folder unchanged keeps the date it had outside it; a move within it is a change", () => {
  const commit = (seconds: number, ...changes: string[][]) => `\x01${seconds}\0\n${changes.map((c) => c.join("\0")).join("\0")}\0`
  const log = [
    // Newest first: two stubs moved in from content/public, one moved within the folder, and one
    // stub moved in and then changed.
    commit(400, ["M", "stubs/changed.md"]),
    commit(300, ["R100", "public/kept.md", "stubs/kept.md"], ["R100", "public/changed.md", "stubs/changed.md"], ["R100", "stubs/old.md", "stubs/renamed.md"]),
    commit(200, ["M", "public/kept.md"], ["M", "public/changed.md"]),
    commit(100, ["A", "public/kept.md"], ["A", "public/changed.md"], ["A", "stubs/old.md"]),
  ].join("")
  const dates = parseGitLog(log, "stubs/")
  const seconds = (file: string) => (dates.get(file)?.getTime() ?? 0) / 1000
  expect(seconds("kept.md")).toBe(200)
  expect(seconds("changed.md")).toBe(400)
  expect(seconds("renamed.md")).toBe(300)
  expect(dates.has("public/kept.md")).toBe(false)
})

test("git is asked once for every file under a folder, by its path from that folder", () => {
  const dates = gitDates(path.join(repo, "vault"))
  expect(dates.get("notes/first.md")?.toISOString()).toBe("2026-06-07T08:09:10.000Z")
  expect(dates.get("notes/a note é.md")?.toISOString()).toBe("2026-02-03T04:05:06.000Z")
  expect([...dates.keys()].sort()).toEqual(["notes/a note é.md", "notes/first.md"])
})

test("a folder in no repository has no git dates", () => {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), "astro-dates-none-"))
  try {
    expect(gitDates(folder).size).toBe(0)
  } finally {
    fs.rmSync(folder, { recursive: true, force: true })
  }
})

test("a file's modification time is the file system's", () => {
  const file = path.join(repo, "vault/notes/uncommitted.md")
  fs.utimesSync(file, new Date("2026-08-09T10:11:12Z"), new Date("2026-08-09T10:11:12Z"))
  expect(modifiedTime(file).toISOString()).toBe("2026-08-09T10:11:12.000Z")
})

const git1 = new Date("2026-05-05T00:00:00Z")
const filesystem = () => new Date("2026-06-06T00:00:00Z")

test("a note's date is frontmatter's, and with none it can read, the note is undated", () => {
  expect(resolveDates({ frontmatter: "2026-01-04", git: git1, filesystem }).date?.toISOString()).toBe("2026-01-04T00:00:00.000Z")
  expect(resolveDates({ frontmatter: undefined, git: git1, filesystem }).date).toBeUndefined()
  expect(resolveDates({ frontmatter: "soon", git: undefined, filesystem }).date).toBeUndefined()
})

test("a note was last modified when git says, else when the file system says, and never before its date", () => {
  expect(resolveDates({ frontmatter: "2026-01-04", git: git1, filesystem }).modified.toISOString()).toBe("2026-05-05T00:00:00.000Z")
  expect(resolveDates({ frontmatter: "2026-01-04", git: undefined, filesystem }).modified.toISOString()).toBe("2026-06-06T00:00:00.000Z")
  expect(resolveDates({ frontmatter: "2026-09-30", git: git1, filesystem }).modified.toISOString()).toBe("2026-09-30T00:00:00.000Z")
})

test("the file system is not asked when git has the answer", () => {
  const never = () => {
    throw new Error("asked the file system")
  }
  expect(() => resolveDates({ frontmatter: "2026-01-04", git: git1, filesystem: never })).not.toThrow()
})

test("a date is printed as the site prints one, in UTC", () => {
  expect(formatDate(new Date("2024-03-01T00:00:00Z"))).toBe("Mar 01, 2024")
  expect(formatDate(new Date("1970-01-02T00:00:00.000Z"))).toBe("Jan 02, 1970")
  expect(formatDate(new Date("2026-01-04T23:30:00-05:00"))).toBe("Jan 05, 2026")
})
