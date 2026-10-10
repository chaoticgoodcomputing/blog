import { execFileSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import type { Vault } from "@chaoticgoodcomputing/obsidian-markdown"
import { afterAll, beforeAll, expect, test } from "vitest"
import { attachmentAddresses } from "../src/lib/attachments.ts"
import { isDraft, openVault } from "../src/lib/vault.ts"

// A vault of this file's own: a note that links to a draft, drafts written each way Quartz read
// one, and notes that are no draft.
const FILES: Record<string, string> = {
  "notes/published.md": "See [[draft]] and [[quoted draft]].\n",
  "notes/draft.md": "---\ntitle: A draft\ndraft: true\n---\n\nSee [the photo](../assets/only-in-a-draft.png).\n",
  "notes/quoted draft.md": '---\ndraft: "true"\n---\n\nNot yet.\n',
  "notes/finished.md": "---\ndraft: false\n---\n\nDone.\n",
  "notes/mentions.md": "A note may say draft: true in its body, and be no draft.\n",
  "assets/only-in-a-draft.png": "png",
}

let repo: string
let vault: Vault

beforeAll(async () => {
  repo = fs.mkdtempSync(path.join(os.tmpdir(), "astro-drafts-"))
  for (const [file, contents] of Object.entries(FILES)) {
    fs.mkdirSync(path.dirname(path.join(repo, "vault", file)), { recursive: true })
    fs.writeFileSync(path.join(repo, "vault", file), contents)
  }
  execFileSync("git", ["init", "--quiet"], { cwd: repo, stdio: "pipe" })
  vault = await openVault(path.join(repo, "vault"))
})

afterAll(() => fs.rmSync(repo, { recursive: true, force: true }))

test("a note is a draft when its frontmatter says `draft: true`, quoted or not, and only then", () => {
  expect(isDraft(FILES["notes/draft.md"]!)).toBe(true)
  expect(isDraft(FILES["notes/quoted draft.md"]!)).toBe(true)
  expect(isDraft(FILES["notes/finished.md"]!)).toBe(false)
  expect(isDraft(FILES["notes/mentions.md"]!)).toBe(false)
  expect(isDraft(FILES["notes/published.md"]!)).toBe(false)
})

test("a draft is no file of the site's vault: it has no page, and a link to it goes nowhere", () => {
  expect(vault.getFileByPath("notes/draft.md")).toBeNull()
  expect(vault.getFileByPath("notes/quoted draft.md")).toBeNull()
  expect(vault.getFileByPath("notes/finished.md")).not.toBeNull()
  expect(vault.getFileByPath("notes/mentions.md")).not.toBeNull()
  expect(vault.metadataCache.resolvedLinks["notes/published.md"] ?? {}).toEqual({})
})

test("what only a draft links to is not published", () => {
  expect(attachmentAddresses(vault).has("/assets/only-in-a-draft.png")).toBe(false)
})
