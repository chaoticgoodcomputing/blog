// The lock check (#91): Core's pnpm lock holds exactly the packages of the npm lock it was imported
// from, every one at the same version, and neither side has one the other lacks. Tested at the
// command line, on small synthetic locks written to a temp dir.
import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { execFileSync } from "node:child_process"
import { fileURLToPath } from "node:url"

const CLI = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "core-lock.mjs")

const npmLock = (packages) =>
  JSON.stringify({
    name: "quartz",
    lockfileVersion: 3,
    packages: { "": { name: "quartz", dependencies: { a: "^1.0.0" } }, ...packages },
  })

// A pnpm v9 lock's shape: importers, then `packages:` keyed by name@version, then snapshots.
const pnpmLock = (keys) =>
  [
    "lockfileVersion: '9.0'",
    "",
    "importers:",
    "",
    "  .:",
    "    dependencies:",
    "      a:",
    "        specifier: ^1.0.0",
    "        version: 1.0.0",
    "",
    "packages:",
    "",
    ...keys.flatMap((key) => [`  ${key}:`, "    resolution: {integrity: sha512-x}", ""]),
    "snapshots:",
    "",
    ...keys.flatMap((key) => [`  ${key}: {}`, ""]),
  ].join("\n")

function check(npm, pnpm) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "core-lock-"))
  try {
    fs.writeFileSync(path.join(dir, "package-lock.json"), npm)
    fs.writeFileSync(path.join(dir, "pnpm-lock.yaml"), pnpm)
    const args = [CLI, "--npm-lock", path.join(dir, "package-lock.json"), "--pnpm-lock", path.join(dir, "pnpm-lock.yaml")]
    try {
      return { code: 0, out: execFileSync("node", args, { encoding: "utf8", stdio: "pipe" }) }
    } catch (err) {
      return { code: err.status, out: `${err.stdout}${err.stderr}` }
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
}

const NPM = npmLock({
  "node_modules/a": { version: "1.0.0" },
  "node_modules/@s/b": { version: "2.1.0" },
  // The same package at the same version in two places is one package.
  "node_modules/a/node_modules/@s/b": { version: "2.1.0" },
  "node_modules/c": { version: "3.0.0" },
  "node_modules/a/node_modules/c": { version: "3.1.0" },
})

test("a pnpm lock with exactly the npm lock's packages passes", () => {
  const { code, out } = check(NPM, pnpmLock(["a@1.0.0", "'@s/b@2.1.0'", "c@3.0.0", "c@3.1.0"]))
  assert.equal(code, 0, out)
  assert.match(out, /4 of 4 packages match/)
})

test("a package at another version fails, naming both versions", () => {
  const { code, out } = check(NPM, pnpmLock(["a@1.0.0", "'@s/b@2.2.0'", "c@3.0.0", "c@3.1.0"]))
  assert.equal(code, 1)
  assert.match(out, /@s\/b: npm 2\.1\.0, pnpm 2\.2\.0/)
})

test("every package only one side has is listed, and fails", () => {
  const { code, out } = check(NPM, pnpmLock(["a@1.0.0", "'@s/b@2.1.0'", "c@3.0.0", "d@1.0.0"]))
  assert.equal(code, 1)
  assert.match(out, /only in the npm lock:\s+c@3\.1\.0/)
  assert.match(out, /only in the pnpm lock:\s+d@1\.0\.0/)
})

test("an npm alias counts by the package it installs", () => {
  const npm = npmLock({ "node_modules/a": { version: "1.0.0" }, "node_modules/alias": { name: "e", version: "5.0.0" } })
  const { code, out } = check(npm, pnpmLock(["a@1.0.0", "e@5.0.0"]))
  assert.equal(code, 0, out)
})
