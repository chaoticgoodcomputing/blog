// Repo guard `core-pruned` (#97): every pruned file (utils/core-tiers.mjs) is absent from Quartz Core.
//
// To reproduce a failure by hand: `touch quartz/core/README.md && mkdir -p quartz/core/docs`,
// then `node quartz/utils/guards/core-pruned.guard.mjs` lists both and exits 1. Remove them again.
import { test } from "node:test"
import assert from "node:assert/strict"
import { runGuard, scratch, writeTree } from "./guard-helpers.mjs"

test("a Core with pruned files back in it: every one is listed, and the guard fails", () => {
  const core = writeTree(scratch(), {
    "quartz/build.ts": "",
    "package.json": "{}",
    "docs/index.md": "",
    ".github/workflows/ci.yaml": "",
    "README.md": "",
    "content/.gitkeep": "",
    "package-lock.json": "{}",
    "quartz.config.default.yaml": "",
  })
  const { code, out } = runGuard("core-pruned", ["--core", core])
  assert.equal(code, 1, out)
  assert.match(out, /6 violation\(s\)/)
  for (const pruned of ["docs/", ".github/", "README.md", "content/.gitkeep", "package-lock.json", "quartz.config.default.yaml"]) {
    assert.ok(out.includes(`${pruned} `), `${pruned} is listed:\n${out}`)
  }
  assert.ok(!out.includes("Dockerfile"), "a pruned file that is absent is not listed")
})

test("a Core with none of them passes", () => {
  const core = writeTree(scratch(), { "quartz/build.ts": "", "package.json": "{}", "content/index.md": "" })
  const { code, out } = runGuard("core-pruned", ["--core", core])
  assert.equal(code, 0, out)
  assert.match(out, /^PASS {2}core-pruned/)
})

test("a missing Core cannot be checked: exit 2", () => {
  const { code, out } = runGuard("core-pruned", ["--core", "/nonexistent/core"])
  assert.equal(code, 2, out)
})

test("the real Quartz Core passes", () => {
  const { code, out } = runGuard("core-pruned")
  assert.equal(code, 0, out)
})
