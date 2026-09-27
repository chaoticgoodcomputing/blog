// Repo guard `plugin-index` (#89, #93-#96): Quartz's own plugin install step (Core's
// `install-plugins` script) regenerates the plugin index, `.quartz/plugins/index.ts`, from which a
// TypeScript layout override imports a plugin's exports. It reads a package's exports from its
// `dist/index.d.ts`, and skips, with a warning, a package it cannot resolve or that has none. Run
// against a config listing every plugin and site plugin of ours by package name, it skips none, and
// the index exports from every plugin.
//
// To reproduce a failure by hand: delete quartz-v5/plugins/quartz-seo/dist/index.d.ts, then
// `node quartz-v5/utils/guards/plugin-index.guard.mjs` lists quartz-seo as skipped and exits 1. Undo
// with `pnpm nx run quartz-seo:build`.
import { test } from "node:test"
import assert from "node:assert/strict"
import { listed, runGuard } from "./guard-helpers.mjs"
import { makePackageRepo, pluginFiles } from "./fixtures/package-repo.mjs"

// Quartz resolves each package from Core, as it would at a site, so a scratch repo's packages are
// ones Core cannot find: each is listed as skipped, and a plugin as missing from the index too.
test("a package Quartz cannot resolve from Core is skipped, and fails", () => {
  const repo = makePackageRepo({ ...pluginFiles("quartz-nowhere") })
  const { code, out } = runGuard("plugin-index", ["--repo", repo])
  assert.equal(code, 1, out)
  listed(
    out,
    "quartz-v5/plugins/quartz-nowhere: Quartz's plugin install skips @chaoticgoodcomputing/quartz-nowhere: not found",
    'quartz-v5/plugins/quartz-nowhere: the plugin index exports nothing from "@chaoticgoodcomputing/quartz-nowhere"',
    "quartz-v5/site-plugins/site-good: Quartz's plugin install skips @chaoticgoodcomputing/site-good: not found",
  )
})

test("a repo with no plugins cannot be checked: exit 2", () => {
  const repo = makePackageRepo({ "quartz-v5/plugins/quartz-good": null, "quartz-v5/site-plugins/site-good": null })
  const { code, out } = runGuard("plugin-index", ["--repo", repo])
  assert.equal(code, 2, out)
})

test("the real repo's plugin index takes in every plugin and site plugin of ours", () => {
  const { code, out } = runGuard("plugin-index")
  assert.equal(code, 0, out)
})
