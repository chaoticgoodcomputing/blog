import { execFileSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import type { Vault } from "@chaoticgoodcomputing/obsidian-markdown"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { assembleVault, MANIFEST, readManifest } from "../src/lib/assembly.ts"
import { backlinksOf } from "../src/lib/backlinks.ts"
import { vaultDates } from "../src/lib/dates.ts"
import { sourcePath } from "../src/lib/source-link.ts"
import { indexNotes } from "../src/lib/notes.ts"
import { openVault } from "../src/lib/vault.ts"

// A repository of its own with two sources, as the site has content/public and dist/vault-private,
// each committed at a known time, and the vault assembled into a folder git ignores, as dist is.
const PUBLIC: Record<string, string> = {
  "index.md": "Read [[Private note]], and see ![[photo.png]].\n",
  "assets/photo.png": "png",
  "notes/uncommitted.md": "Not yet committed.\n",
  ".obsidian/app.json": "{}",
  "notes/.hidden.md": "A dotfile.\n",
  ".gitignore": "scratch.md\n",
  "scratch.md": "Git ignores this.\n",
}
const PRIVATE: Record<string, string> = {
  "content/Private note.md": "Back to [[index]].\n",
}

let repo: string
let sources: string[]
let root: string
let vault: Vault

const write = (folder: string, files: Record<string, string>) => {
  for (const [file, contents] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(folder, file)), { recursive: true })
    fs.writeFileSync(path.join(folder, file), contents)
  }
}
const git = (args: string[], time: string) =>
  execFileSync("git", ["-c", "user.name=Test", "-c", "user.email=test@example.com", "-c", "commit.gpgsign=false", ...args], {
    cwd: repo,
    stdio: "pipe",
    env: { ...process.env, GIT_AUTHOR_DATE: time, GIT_COMMITTER_DATE: time },
  })

beforeAll(async () => {
  repo = fs.mkdtempSync(path.join(os.tmpdir(), "astro-assembly-"))
  sources = [path.join(repo, "public"), path.join(repo, "private")]
  root = path.join(repo, "site")
  write(sources[0]!, PUBLIC)
  write(sources[1]!, PRIVATE)
  fs.writeFileSync(path.join(repo, ".gitignore"), "/site\n")
  git(["init", "--quiet"], "2026-01-01T00:00:00Z")
  git(["add", ".gitignore", "public/index.md", "public/assets", "public/.gitignore"], "2026-01-01T00:00:00Z")
  git(["commit", "--quiet", "-m", "public"], "2026-02-03T04:05:06Z")
  git(["add", "private"], "2026-01-01T00:00:00Z")
  git(["commit", "--quiet", "-m", "private"], "2026-06-07T08:09:10Z")
  fs.utimesSync(path.join(sources[0]!, "notes/uncommitted.md"), new Date("2026-08-09T10:11:12Z"), new Date("2026-08-09T10:11:12Z"))
  assembleVault(sources, root)
  vault = await openVault(root)
})

afterAll(() => fs.rmSync(repo, { recursive: true, force: true }))

test("each source's files are at their own paths in the vault: a note copied, an attachment linked", () => {
  expect(fs.readFileSync(path.join(root, "index.md"), "utf8")).toBe(PUBLIC["index.md"])
  expect(fs.readFileSync(path.join(root, "content/Private note.md"), "utf8")).toBe(PRIVATE["content/Private note.md"])
  expect(fs.lstatSync(path.join(root, "index.md")).isFile()).toBe(true)
  expect(fs.lstatSync(path.join(root, "assets/photo.png")).isSymbolicLink()).toBe(true)
  expect(fs.realpathSync(path.join(root, "assets/photo.png"))).toBe(fs.realpathSync(path.join(sources[0]!, "assets/photo.png")))
  expect(vault.getFileByPath("assets/photo.png")).not.toBeNull()
})

test("a dotfile, a file in a dot-folder, and a file git ignores are left out", () => {
  for (const file of [".obsidian/app.json", "notes/.hidden.md", ".gitignore", "scratch.md"]) {
    expect(fs.existsSync(path.join(root, file)), file).toBe(false)
  }
})

test("the manifest names each file's source, and is no file of the vault", () => {
  const manifest = readManifest(root)!
  expect(manifest.sources).toEqual(sources)
  expect([...manifest.files.keys()].sort()).toEqual(["assets/photo.png", "content/Private note.md", "index.md", "notes/uncommitted.md"])
  expect(manifest.files.get("content/Private note.md")).toBe(path.join(sources[1]!, "content/Private note.md"))
  expect(vault.getFileByPath(MANIFEST)).toBeNull()
})

test("a link from a note of one source to a note of the other resolves, both ways", () => {
  expect(vault.metadataCache.getFirstLinkpathDest("Private note", "index.md")?.path).toBe("content/Private note.md")
  expect(vault.metadataCache.resolvedLinks["index.md"]).toHaveProperty("content/Private note.md")
  expect(vault.metadataCache.resolvedLinks["content/Private note.md"]).toHaveProperty("index.md")
})

test("a note's dates are its source file's: git's, through the manifest, then its file's", () => {
  const { git, sourceOf } = vaultDates(root)
  expect(git.get("index.md")?.toISOString()).toBe("2026-02-03T04:05:06.000Z")
  expect(git.get("content/Private note.md")?.toISOString()).toBe("2026-06-07T08:09:10.000Z")
  expect(git.has("notes/uncommitted.md")).toBe(false)
  expect(sourceOf("notes/uncommitted.md")).toBe(path.join(sources[0]!, "notes/uncommitted.md"))

  const index = indexNotes(vault)
  expect(index.byPath.get("content/Private note.md")?.modified.toISOString()).toBe("2026-06-07T08:09:10.000Z")
  expect(index.byPath.get("notes/uncommitted.md")?.modified.toISOString()).toBe("2026-08-09T10:11:12.000Z")
})

test("a note's source is its source file in the repository, whichever source it came from", () => {
  expect(sourcePath({ path: "index.md" }, "public", root)).toBe("public/index.md")
  expect(sourcePath({ path: "content/Private note.md" }, "public", root)).toBe("private/content/Private note.md")
})

test("a source that isn't there is empty", () => {
  const elsewhere = fs.mkdtempSync(path.join(os.tmpdir(), "astro-assembly-missing-"))
  try {
    const { files } = assembleVault([sources[0]!, path.join(repo, "nowhere")], elsewhere)
    expect([...files.keys()].sort()).toEqual(["assets/photo.png", "index.md", "notes/uncommitted.md"])
  } finally {
    fs.rmSync(elsewhere, { recursive: true, force: true })
  }
})

test("the same path in two sources fails the assembly, naming both files, and leaves the vault as it was", () => {
  const clashing = path.join(repo, "clashing")
  write(clashing, { "Index.md": "Another home page.\n" })
  try {
    expect(() => assembleVault([...sources, clashing], root)).toThrow(
      `${path.join(sources[0]!, "index.md")} and ${path.join(clashing, "Index.md")}`,
    )
    expect(fs.readFileSync(path.join(root, "index.md"), "utf8")).toBe(PUBLIC["index.md"])
  } finally {
    fs.rmSync(clashing, { recursive: true, force: true })
  }
})

test("assembling again follows an edit, an addition and a deletion in a source", () => {
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "astro-assembly-again-"))
  try {
    const source = path.join(scratch, "source")
    const again = path.join(scratch, "vault")
    write(source, { "kept.md": "one\n", "gone.md": "gone\n", "assets/gone.png": "png" })
    assembleVault([source], again)
    write(source, { "kept.md": "two\n", "added.md": "added\n" })
    fs.rmSync(path.join(source, "gone.md"))
    fs.rmSync(path.join(source, "assets"), { recursive: true })
    assembleVault([source], again)
    expect(fs.readFileSync(path.join(again, "kept.md"), "utf8")).toBe("two\n")
    expect(fs.readFileSync(path.join(again, "added.md"), "utf8")).toBe("added\n")
    expect(fs.readdirSync(again).sort()).toEqual([MANIFEST, "added.md", "kept.md"])
    // Removing what is gone never reaches into a source.
    expect(fs.readFileSync(path.join(source, "kept.md"), "utf8")).toBe("two\n")
  } finally {
    fs.rmSync(scratch, { recursive: true, force: true })
  }
})

test("assembling into dist/vault removes only from dist/vault: the mirrors beside it, in dist/mirrors, are kept", () => {
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "astro-assembly-dist-"))
  try {
    const source = path.join(scratch, "source")
    const dist = path.join(scratch, "dist")
    write(source, { "note.md": "note\n" })
    write(dist, { "mirrors/Paper.pdf": "%PDF-1.4", "vault/stale.md": "stale\n" })
    assembleVault([source], path.join(dist, "vault"))
    expect(fs.existsSync(path.join(dist, "vault/stale.md"))).toBe(false)
    expect(fs.readFileSync(path.join(dist, "mirrors/Paper.pdf"), "utf8")).toBe("%PDF-1.4")
  } finally {
    fs.rmSync(scratch, { recursive: true, force: true })
  }
})

// Obsidian writes a link from its own vault's root, where the public vault is `public/` and the
// private one `private/`; the assembly writes it from the assembled vault's, in its copy alone.
describe("a link written with a public/ or private/ prefix", () => {
  const LINKING: Record<string, string> = {
    "content/notes/linking.md": [
      "---",
      "title: Linking",
      "---",
      "",
      "A day: [[private/content/notes/periodic/2024-03-15#Morning Block|that morning]].",
      "A post: [[public/content/articles/post]], and again [[/content/articles/post|already mapped]].",
      "In a table: | [[/public/content/articles/post\\|post]] |",
      "A Markdown link: [day](/private/content/notes/periodic/2024-03-15.md).",
      "",
    ].join("\n"),
    "content/articles/post.md": "---\ntitle: Post\n---\n\nA post.\n",
  }
  const DAY: Record<string, string> = {
    "content/notes/periodic/2024-03-15.md": "---\ntitle: Day\n---\n\n## Morning Block\n\nA stub.\n",
  }
  const SOURCE_TIME = new Date("2026-03-04T05:06:07Z")

  let scratch: string
  let linkingSources: string[]
  let assembled: string
  let linked: Vault

  beforeAll(async () => {
    scratch = fs.mkdtempSync(path.join(os.tmpdir(), "astro-assembly-prefixes-"))
    linkingSources = [path.join(scratch, "public"), path.join(scratch, "private")]
    assembled = path.join(scratch, "vault")
    write(linkingSources[0]!, LINKING)
    write(linkingSources[1]!, DAY)
    fs.utimesSync(path.join(linkingSources[0]!, "content/notes/linking.md"), SOURCE_TIME, SOURCE_TIME)
    assembleVault(linkingSources, assembled)
    linked = await openVault(assembled)
  })

  afterAll(() => fs.rmSync(scratch, { recursive: true, force: true }))

  test("loses the prefix in the assembled note, and the source keeps it", () => {
    const copy = fs.readFileSync(path.join(assembled, "content/notes/linking.md"), "utf8")
    expect(copy).toContain("[[/content/notes/periodic/2024-03-15#Morning Block|that morning]]")
    expect(copy).toContain("[[/content/articles/post]], and again [[/content/articles/post|already mapped]]")
    expect(copy).toContain("| [[/content/articles/post\\|post]] |")
    expect(copy).toContain("[day](/content/notes/periodic/2024-03-15.md)")
    expect(copy).not.toMatch(/public\/|private\//)
    const source = fs.readFileSync(path.join(linkingSources[0]!, "content/notes/linking.md"), "utf8")
    expect(source).toBe(LINKING["content/notes/linking.md"])
  })

  test("resolves, to a note of either source, and the note is among its target's backlinks", () => {
    const resolved = linked.metadataCache.resolvedLinks["content/notes/linking.md"]
    expect(resolved).toHaveProperty("content/notes/periodic/2024-03-15.md")
    expect(resolved).toHaveProperty("content/articles/post.md")
    expect(linked.metadataCache.unresolvedLinks["content/notes/linking.md"] ?? {}).toEqual({})

    const index = indexNotes(linked)
    for (const target of ["content/notes/periodic/2024-03-15.md", "content/articles/post.md"]) {
      const note = index.byPath.get(target)!
      const titles = backlinksOf(note, { vault: linked, index, treatment: "mark" }).map(({ title }) => title)
      expect(titles, target).toEqual(["Linking"])
    }
  })

  test("leaves the note's modification time, and so when it last changed, its source's", () => {
    const copy = path.join(assembled, "content/notes/linking.md")
    expect(fs.statSync(copy).mtime.toISOString()).toBe(SOURCE_TIME.toISOString())
    expect(indexNotes(linked).byPath.get("content/notes/linking.md")?.modified.toISOString()).toBe(SOURCE_TIME.toISOString())
  })

  test("is written again only when its mapped contents change, and follows an edit in its source", () => {
    const copy = path.join(assembled, "content/notes/linking.md")
    const untouched = new Date("2000-01-01T00:00:00Z")
    fs.utimesSync(copy, untouched, untouched)
    assembleVault(linkingSources, assembled)
    expect(fs.statSync(copy).mtime.toISOString()).toBe(untouched.toISOString())

    const edited = `${LINKING["content/notes/linking.md"]}And now [[private/content/notes/periodic/2024-03-15]].\n`
    write(linkingSources[0]!, { "content/notes/linking.md": edited })
    assembleVault(linkingSources, assembled)
    expect(fs.readFileSync(copy, "utf8")).toContain("And now [[/content/notes/periodic/2024-03-15]].")
    const source = path.join(linkingSources[0]!, "content/notes/linking.md")
    expect(fs.statSync(copy).mtime.getTime()).toBe(fs.statSync(source).mtime.getTime())
  })
})
