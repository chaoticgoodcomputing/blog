// Repo guard `core-drift` (#97): Quartz Core matches its pinned ref, with no drift beyond the
// recorded vendored changes: the files in VENDORED.md's "Current vendored changes" table. Today's
// `diff-upstream`, as a guard. Tested on a synthetic upstream tree and a synthetic Core.
//
// To reproduce a failure by hand: append a line to quartz-v5/core/quartz/build.ts and to
// quartz-v5/core/tsconfig.json, then `node quartz-v5/utils/guards/core-drift.guard.mjs` lists both and
// exits 1. `git checkout -- quartz-v5/core` undoes it.
import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { commitTree, runGuard, scratch, writeTree } from "./guard-helpers.mjs"

const record = (...files) => `# Quartz Core

Current vendored changes:

| Files | Why | Upstream proposal |
| ----- | --- | ----------------- |
${files.map((f) => `| ${[f].flat().map((x) => `\`${x}\``).join(", ")} | [#1](https://example.com): why | #2 |`).join("\n")}

## Upgrading
`

const upstreamFiles = {
  "quartz/a.ts": "a\n",
  "quartz/b.ts": "b\n",
  "quartz/c.ts": "c\n",
  "quartz/d.ts": "d\n",
  "quartz/nested/README.md": "source, though its name is pruned at the root\n",
  "package.json": '{ "name": "quartz" }\n',
  "quartz.ts": "upstream template\n",
  "README.md": "pruned\n",
  "docs/index.md": "pruned\n",
  "package-lock.json": "{}\n",
}

function fixture({ core: coreEdits, recorded }) {
  const upstream = commitTree(writeTree(scratch("upstream-"), upstreamFiles))
  const coreFiles = { ...upstreamFiles }
  for (const pruned of ["README.md", "docs/index.md", "package-lock.json"]) delete coreFiles[pruned]
  const core = writeTree(scratch("core-"), { ...coreFiles, ".gitignore": "node_modules\npublic\n", "pnpm-lock.yaml": "lockfileVersion: '9.0'\n" })
  // Upstream's tree has the same .gitignore, so it is no drift.
  fs.writeFileSync(path.join(upstream, ".gitignore"), "node_modules\npublic\n")
  commitTree(upstream)
  commitTree(core)
  for (const [rel, contents] of Object.entries(coreEdits)) {
    if (contents === null) fs.rmSync(path.join(core, rel))
    else writeTree(core, { [rel]: contents })
  }
  const recordFile = path.join(scratch("record-"), "VENDORED.md")
  fs.writeFileSync(recordFile, recorded)
  return ["--core", core, "--upstream", upstream, "--record", recordFile]
}

test("a Core with only its recorded vendored changes, and edits that are not drift, passes", () => {
  const args = fixture({
    core: {
      "quartz/a.ts": "a, changed\n", // recorded
      "quartz.ts": "our layout\n", // steering
      "pnpm-lock.yaml": "lockfileVersion: '9.0'\n# ours\n", // Core's pnpm file
      "node_modules/x/index.js": "", // gitignored: installed, never compared
    },
    recorded: record("quartz/a.ts"),
  })
  const { code, out } = runGuard("core-drift", args)
  assert.equal(code, 0, out)
})

test("drift beyond the record: every file is listed, with how it differs, and the guard fails", () => {
  const args = fixture({
    core: {
      "quartz/a.ts": "a, changed\n", // recorded: fine
      "quartz/b.ts": "b, changed\n", // changed, unrecorded
      "quartz/c.ts": null, // deleted: only upstream has it
      "quartz/new.ts": "ours\n", // untracked, and only Core has it
      "quartz/nested/README.md": "edited\n", // source, whatever its name
      "package.json": '{ "name": "quartz", "private": false }\n', // scaffolding
      "Dockerfile.local": "", // at Core's root, in no tier
    },
    // quartz/d.ts is recorded but matches upstream: absorbed, or never made.
    recorded: record(["quartz/a.ts", "quartz/d.ts"]),
  })
  const { code, out } = runGuard("core-drift", args)
  assert.equal(code, 1, out)
  const expected = [
    [/changed +quartz\/b\.ts/],
    [/only upstream +quartz\/c\.ts/],
    [/only Core +quartz\/new\.ts/],
    [/changed +quartz\/nested\/README\.md/],
    [/changed +package\.json/],
    [/only Core +Dockerfile\.local/],
    [/quartz\/d\.ts.*recorded.*matches upstream/],
  ]
  for (const [pattern] of expected) assert.match(out, pattern)
  assert.match(out, /7 violation\(s\)/)
  assert.ok(!/quartz\/a\.ts/.test(out), `the recorded change is not listed:\n${out}`)
})

test("a record with no vendored-changes table cannot be checked: exit 2", () => {
  const args = fixture({ core: {}, recorded: "# Quartz Core\n\nNo table here.\n" })
  const { code, out } = runGuard("core-drift", args)
  assert.equal(code, 2, out)
  assert.match(out, /Current vendored changes/)
})

test("the real Quartz Core passes against its pinned ref", () => {
  const { code, out } = runGuard("core-drift")
  assert.equal(code, 0, out)
})
