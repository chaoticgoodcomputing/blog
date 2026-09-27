// Repo guard `core-lock` (#97): Core's package.json is upstream's at the pinned ref, byte for byte,
// and Core's pnpm lock is exactly what a fresh `pnpm import` of that ref's package-lock.json writes,
// holding every package at upstream's version (#91's lock check). Tested on a one-package project,
// so the fresh import takes a second or two (it needs the registry, or pnpm's metadata cache).
//
// To reproduce a failure by hand: in quartz/core/pnpm-lock.yaml change one `packages:` key's
// version (`yaml@2.9.1:` to `yaml@2.9.0:`, both places), and add a key to quartz/core/package.json, then
// `node quartz/utils/guards/core-lock.guard.mjs` lists them and exits 1.
// `git checkout -- quartz/core` undoes it.
import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { execFileSync } from "node:child_process"
import { CORE_DIR, CORE_PNPM } from "../core-tiers.mjs"
import { runGuard, scratch, writeTree } from "./guard-helpers.mjs"

const packageJson = `{
  "name": "quartz",
  "version": "5.0.0",
  "dependencies": {
    "ms": "2.1.3"
  }
}
`
const packageLock = JSON.stringify(
  {
    name: "quartz",
    version: "5.0.0",
    lockfileVersion: 3,
    requires: true,
    packages: {
      "": { name: "quartz", version: "5.0.0", dependencies: { ms: "2.1.3" } },
      "node_modules/ms": {
        version: "2.1.3",
        resolved: "https://registry.npmjs.org/ms/-/ms-2.1.3.tgz",
        integrity: "sha512-6FlzubTLZG3J2a/NVCAleEhjzq5oxgHyaCU9yYXvcLsvoVaHJq/s5xXI6/XXP6tz7R9xAOtHnSO/tXtF3WRTlA==",
        license: "MIT",
      },
    },
  },
  null,
  2,
)

// Upstream's tree, and a Core whose lock is a fresh import of upstream's npm lock: the passing pair.
function fixture() {
  const upstream = writeTree(scratch("upstream-"), { "package.json": packageJson, "package-lock.json": packageLock })
  const core = writeTree(scratch("core-"), {
    "package.json": packageJson,
    "pnpm-workspace.yaml": fs.readFileSync(path.join(CORE_DIR, "pnpm-workspace.yaml"), "utf-8"),
  })
  const work = writeTree(scratch("import-"), {
    "package.json": packageJson,
    "package-lock.json": packageLock,
    "pnpm-workspace.yaml": fs.readFileSync(path.join(CORE_DIR, "pnpm-workspace.yaml"), "utf-8"),
  })
  execFileSync("npx", ["--yes", CORE_PNPM, "import"], { cwd: work, stdio: "pipe" })
  fs.copyFileSync(path.join(work, "pnpm-lock.yaml"), path.join(core, "pnpm-lock.yaml"))
  return { upstream, core, args: ["--core", core, "--upstream", upstream] }
}

test("a Core whose package.json is upstream's and whose lock is a fresh import passes", () => {
  const { args } = fixture()
  const { code, out } = runGuard("core-lock", args)
  assert.equal(code, 0, out)
})

test("a Core that has moved off upstream's: every difference is listed, and the guard fails", () => {
  const { core, args } = fixture()
  // package.json: a changed field and one of ours.
  fs.writeFileSync(path.join(core, "package.json"), packageJson.replace('"5.0.0"', '"5.0.1"').replace('"name": "quartz",', '"name": "quartz",\n  "private": true,'))
  // The lock: ms moved to another version, as a fresh resolve would move it.
  const lock = path.join(core, "pnpm-lock.yaml")
  fs.writeFileSync(lock, fs.readFileSync(lock, "utf-8").replaceAll("2.1.3", "2.1.2"))
  const { code, out } = runGuard("core-lock", args)
  assert.equal(code, 1, out)
  assert.match(out, /package\.json "version" differs from upstream's/)
  assert.match(out, /package\.json "private" is ours only/)
  assert.match(out, /ms: 2\.1\.3 in upstream's package-lock\.json, 2\.1\.2 in pnpm-lock\.yaml/)
  assert.match(out, /not what a fresh `pnpm import`/)
  assert.match(out, /4 violation\(s\)/)
})

test("a package upstream's lock has and Core's lacks, and the reverse, are each listed", () => {
  const { core, args } = fixture()
  const lock = path.join(core, "pnpm-lock.yaml")
  fs.writeFileSync(lock, fs.readFileSync(lock, "utf-8").replaceAll("ms@2.1.3", "left-pad@1.3.0"))
  const { code, out } = runGuard("core-lock", args)
  assert.equal(code, 1, out)
  assert.match(out, /pnpm-lock\.yaml lacks ms@2\.1\.3/)
  assert.match(out, /pnpm-lock\.yaml has left-pad@1\.3\.0, which upstream's package-lock\.json lacks/)
})

test("a Core with no pnpm lock fails it", () => {
  const { core, args } = fixture()
  fs.rmSync(path.join(core, "pnpm-lock.yaml"))
  const { code, out } = runGuard("core-lock", args)
  assert.equal(code, 1, out)
  assert.match(out, /no pnpm-lock\.yaml/i)
})

test("the real Quartz Core passes against its pinned ref", () => {
  const { code, out } = runGuard("core-lock")
  assert.equal(code, 0, out)
})
