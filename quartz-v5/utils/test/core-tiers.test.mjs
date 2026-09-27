// Quartz Core's tiers (#89, #91): which tier a path in Core falls in, and whether a difference there
// is drift.
import { test } from "node:test"
import assert from "node:assert/strict"
import { countsAsDrift, tierOf } from "../core-tiers.mjs"

test("each path falls in its tier", () => {
  const cases = {
    "quartz/plugins/types.ts": "source",
    "quartz/static/icon.png": "source",
    "quartz.ts": "steering",
    "quartz.config.yaml": "steering",
    "package.json": "scaffolding",
    "LICENSE.txt": "scaffolding",
    ".prettierrc": "scaffolding",
    "docs/index.md": "pruned",
    ".github/workflows/ci.yaml": "pruned",
    "content/.gitkeep": "pruned",
    "quartz.config.default.yaml": "pruned",
    "package-lock.json": "pruned",
    "pnpm-lock.yaml": "pnpm",
    "pnpm-workspace.yaml": "pnpm",
    "new-upstream-file.md": null,
  }
  for (const [rel, tier] of Object.entries(cases)) assert.equal(tierOf(rel), tier, rel)
})

test("a pruned name deeper in Core source is still source", () => {
  assert.equal(tierOf("quartz/components/README.md"), "source")
  assert.equal(tierOf("quartz/docs/x.md"), "source")
})

test("only Core source, scaffolding and unknown files are drift", () => {
  assert.deepEqual(
    ["quartz/cfg.ts", "package.json", "Dockerfile", "quartz.ts", "pnpm-lock.yaml", "new.md"].filter(countsAsDrift),
    ["quartz/cfg.ts", "package.json", "new.md"],
  )
})
