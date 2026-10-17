import { execFileSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterAll, beforeAll, expect, test } from "vitest"
import { indexNotes } from "../src/lib/notes.ts"
import { lastCommitDay, publishesResume, RESUME_NOTE, RESUME_SOURCE, resumeAddresses, sourceDate } from "../src/lib/resume.ts"
import { openVault } from "../src/lib/vault.ts"

// A repository of its own, with a resume source committed late in the evening of its committer's
// day, which is already the next day in UTC.
let repo: string
const git = (args: string[], time?: string) =>
  execFileSync("git", ["-c", "user.name=Test", "-c", "user.email=test@example.com", "-c", "commit.gpgsign=false", ...args], {
    cwd: repo,
    stdio: "pipe",
    env: { ...process.env, ...(time ? { GIT_AUTHOR_DATE: time, GIT_COMMITTER_DATE: time } : {}) },
  })

beforeAll(() => {
  repo = fs.mkdtempSync(path.join(os.tmpdir(), "astro-resume-"))
  fs.mkdirSync(path.join(repo, "resume"))
  git(["init", "--quiet"])
  fs.writeFileSync(path.join(repo, "resume/resume.typ"), "one\n")
  git(["add", "."])
  git(["commit", "--quiet", "-m", "first"], "2026-01-15T09:00:00-07:00")
  fs.writeFileSync(path.join(repo, "resume/resume.typ"), "two\n")
  git(["commit", "--quiet", "-am", "second"], "2026-08-14T23:30:00-04:00")
  fs.writeFileSync(path.join(repo, "resume/uncommitted.typ"), "one\n")
})

afterAll(() => fs.rmSync(repo, { recursive: true, force: true }))

test("a file's last commit day is its committer's day, at midnight UTC, as a frontmatter date with no time is", () => {
  expect(lastCommitDay(path.join(repo, "resume/resume.typ"))?.toISOString()).toBe("2026-08-14T00:00:00.000Z")
})

test("a file with no commit, or in no repository, has no last commit day", () => {
  expect(lastCommitDay(path.join(repo, "resume/uncommitted.typ"))).toBeUndefined()
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), "astro-resume-none-"))
  try {
    fs.writeFileSync(path.join(folder, "resume.typ"), "one\n")
    expect(lastCommitDay(path.join(folder, "resume.typ"))).toBeUndefined()
  } finally {
    fs.rmSync(folder, { recursive: true, force: true })
  }
})

test("only the resume's note is dated by a source outside the vault", () => {
  expect(sourceDate("content/notes/alpha.md")).toBeUndefined()
  expect(sourceDate(RESUME_NOTE)).toEqual(lastCommitDay(RESUME_SOURCE))
})

test("the resume's note is dated by the resume's source, unless it writes a date of its own", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "astro-resume-vault-"))
  try {
    fs.writeFileSync(path.join(root, RESUME_NOTE), "---\ntitle: Resume\n---\nThe resume.\n")
    fs.writeFileSync(path.join(root, "dated.mdx"), "---\ndate: 2026-01-04\n---\nDated.\n")
    const index = indexNotes(await openVault(root))
    // The repository's own resume source, resume/resume.typ, which has commits.
    const day = lastCommitDay(RESUME_SOURCE)
    expect(day).toBeDefined()
    expect(index.byPath.get(RESUME_NOTE)?.date).toEqual(day)
    expect(index.byPath.get("dated.mdx")?.date.toISOString()).toBe("2026-01-04T00:00:00.000Z")
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

test("a vault without the resume's note publishes no resume", () => {
  expect(publishesResume()).toBe(false)
  expect(resumeAddresses()).toEqual([])
})
