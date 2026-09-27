// The last upgrade, from which vendored-log lists our changes to Core (#81): the last commit that
// changed the ref upstream.json pins, not the last that touched the file. The cutover renamed the
// file and rewrote a path in its comment, which is not an upgrade.
import { test } from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { lastUpgrade } from "../upstream-git.mjs"

const git = (dir, ...args) => execFileSync("git", ["-C", dir, ...args], { encoding: "utf-8" }).trim()
const manifest = (commit, note) => JSON.stringify({ "//": note, commit }, null, 2) + "\n"

function repo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "last-upgrade-"))
  git(dir, "init", "--quiet")
  git(dir, "config", "user.email", "test@example.com")
  git(dir, "config", "user.name", "test")
  const commit = (files, message) => {
    for (const [rel, text] of Object.entries(files)) {
      const file = path.join(dir, rel)
      if (text === null) fs.rmSync(file)
      else fs.mkdirSync(path.dirname(file), { recursive: true }), fs.writeFileSync(file, text)
    }
    git(dir, "add", "-A")
    git(dir, "commit", "--quiet", "-m", message)
    return git(dir, "rev-parse", "HEAD")
  }
  return { dir, commit, cleanup: () => fs.rmSync(dir, { recursive: true, force: true }) }
}

test("a rename of upstream.json that only edits its comment is not an upgrade", (t) => {
  const r = repo()
  t.after(r.cleanup)
  const vendored = r.commit({ "quartz-v5/upstream.json": manifest("aaaa", "read by quartz-v5/utils") }, "vendor")
  r.commit({ "quartz-v5/upstream.json": manifest("aaaa", "read by quartz-v5/utils/upstream.mjs") }, "comment")
  r.commit({ "quartz-v5/upstream.json": null, "quartz/upstream.json": manifest("aaaa", "read by quartz/utils/upstream.mjs") }, "rename")
  assert.equal(lastUpgrade(r.dir, "quartz/upstream.json"), vendored)
})

test("a commit that changes the pinned ref is the last upgrade, under either name", (t) => {
  const r = repo()
  t.after(r.cleanup)
  r.commit({ "quartz-v5/upstream.json": manifest("aaaa", "note") }, "vendor")
  const upgraded = r.commit({ "quartz-v5/upstream.json": manifest("bbbb", "note") }, "upgrade")
  r.commit({ "quartz-v5/upstream.json": null, "quartz/upstream.json": manifest("bbbb", "note") }, "rename")
  assert.equal(lastUpgrade(r.dir, "quartz/upstream.json"), upgraded)
  const again = r.commit({ "quartz/upstream.json": manifest("cccc", "note") }, "upgrade again")
  assert.equal(lastUpgrade(r.dir, "quartz/upstream.json"), again)
})

test("no manifest in history, no last upgrade", (t) => {
  const r = repo()
  t.after(r.cleanup)
  r.commit({ "README.md": "hi\n" }, "init")
  assert.equal(lastUpgrade(r.dir, "quartz/upstream.json"), "")
})
