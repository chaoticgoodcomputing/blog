// Helpers for the repo guards' tests: run a guard at its command line, and build scratch trees.
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"

export const GUARDS = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "guards")

/** Run guard `name` (`guards/<name>.guard.mjs`) with `args`: its exit code and what it printed. */
export function runGuard(name, args = []) {
  const { status, stdout, stderr } = spawnSync(process.execPath, [path.join(GUARDS, `${name}.guard.mjs`), ...args], {
    encoding: "utf-8",
  })
  return { code: status, out: stdout, err: stderr }
}

/** A fresh temp dir, removed when the process exits. */
export function scratch(prefix = "guard-") {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix))
  process.on("exit", () => fs.rmSync(dir, { recursive: true, force: true }))
  return dir
}

/** Write `files` ({ relPath: contents }) under `dir`, making directories as needed. */
export function writeTree(dir, files) {
  for (const [rel, contents] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true })
    fs.writeFileSync(path.join(dir, rel), contents)
  }
  return dir
}

/** Make `dir` a git repo and commit everything in it: a tree whose files git tracks. */
export function commitTree(dir) {
  const git = (...args) => spawnSync("git", ["-C", dir, ...args], { encoding: "utf-8" })
  git("init", "--quiet")
  git("add", "-A")
  git("-c", "user.name=t", "-c", "user.email=t@t", "commit", "--quiet", "--no-gpg-sign", "-m", "fixture")
  return dir
}
