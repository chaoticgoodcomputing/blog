// The resume: a PDF that Typst compiles from resume/resume.typ (`resume:build`, which `astro:build`
// depends on) into dist/resume, and the vault's note that shows it, resume.mdx. Neither the PDF nor
// the note's date is written into the vault: the build reads content/ and never writes to it. The
// resume integration (src/integrations/resume.ts) serves the PDF in dev and copies it into the build,
// at the address the vault's copy of it had, and the notes query dates the note by the resume.

import { execFileSync } from "node:child_process"
import path from "node:path"
import { parseFrontmatterDate } from "./dates.ts"
import { getVault } from "./vault.ts"

/** The compiled resume. Astro runs from astro/, so the default is the repo's dist/resume. */
export const RESUME_PDF = path.resolve(process.env.RESUME_PDF ?? "../dist/resume/resume.pdf")

/** The resume's Typst source, whose last commit is the resume note's date. */
export const RESUME_SOURCE = path.resolve(process.env.RESUME_SOURCE ?? "../resume/resume.typ")

/** Where the site publishes the resume: where the vault had it, so a link to it keeps working. */
export const RESUME_ADDRESS = "/assets/Elkington_Resume.pdf"

/** The note that shows the resume, by its path in the vault. */
export const RESUME_NOTE = "resume.mdx"

/**
 * Whether the site publishes the resume: only beside the note that shows it, so a vault without that
 * note, as the fixture vault is, has no resume.
 */
export const publishesResume = (): boolean => getVault().getFileByPath(RESUME_NOTE) !== null

/** The resume's address, when the site publishes it, for what lists the files the site publishes. */
export const resumeAddresses = (): string[] => (publishesResume() ? [RESUME_ADDRESS] : [])

/**
 * The day of the last commit to touch `file`, as `git log --format=%cs` writes it, read as a
 * frontmatter date is: midnight UTC on that day, as `date: 2026-08-14` was when the publish step
 * wrote it into the note. Undefined when the file has no commit, or there is no git.
 */
export function lastCommitDay(file: string): Date | undefined {
  try {
    const day = execFileSync("git", ["log", "-1", "--format=%cs", "--", path.basename(file)], {
      cwd: path.dirname(file),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
    return parseFrontmatterDate(day)
  } catch {
    return undefined
  }
}

// Asked once per process: the source's history doesn't change while the site builds.
let resumeDay: { date: Date | undefined } | undefined

/**
 * The date a note has in place of its frontmatter's: the resume note's is its source's last commit
 * day, when the note writes no date of its own. Undefined for every other note.
 */
export function sourceDate(notePath: string): Date | undefined {
  if (notePath !== RESUME_NOTE) return undefined
  resumeDay ??= { date: lastCommitDay(RESUME_SOURCE) }
  return resumeDay.date
}
