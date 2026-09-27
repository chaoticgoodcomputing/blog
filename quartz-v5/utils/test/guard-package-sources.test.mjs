// Repo guard `package-sources` (#98): sources and dependencies. Every source of ours in the site
// config and the fixture config is a package name, except the fixture's own plugins, which the
// fixture config lists by local path (tests/CONTEXT.md, "Fixture plugin", #96); every manifest
// dependency names a package in the workspace; every plugin of ours either config enables is a
// dependency of the site package, under the name Quartz imports it by, and one under its own name is
// `workspace:*`; and both configs list every plugin, and the site config every site plugin.
//
// To reproduce a failure by hand: in quartz-v5/core/quartz.config.yaml change
// `source: "@chaoticgoodcomputing/quartz-seo"` to `source: ../plugins/quartz-seo`, and remove
// `@chaoticgoodcomputing/quartz-graph` from quartz-v5/package.json's dependencies; then
// `node quartz-v5/utils/guards/package-sources.guard.mjs` lists both and exits 1. Undo with
// `git checkout -- quartz-v5/core/quartz.config.yaml quartz-v5/package.json`.
import { test } from "node:test"
import assert from "node:assert/strict"
import { listed, runGuard } from "./guard-helpers.mjs"
import { makePackageRepo, pluginFiles, pluginManifest } from "./fixtures/package-repo.mjs"

const config = (...entries) => ["plugins:", ...entries.flatMap((entry) => [`  - source: ${entry}`, "    enabled: true"]), ""].join("\n")

test("a repo whose sources are all package names, and all the site package's, passes", () => {
  const { code, out } = runGuard("package-sources", ["--repo", makePackageRepo()])
  assert.equal(code, 0, out)
  assert.match(out, /^PASS {2}package-sources/)
})

test("a local-path or git source of ours fails; only the fixture config's fixture plugins may be local", () => {
  const repo = makePackageRepo({
    "quartz-v5/core/quartz.config.yaml": config(
      '"@chaoticgoodcomputing/quartz-good"',
      "../plugins/quartz-good",
      "../fixture-plugins/fixture-good",
      "github:chaoticgoodcomputing/blog",
      '"@quartz-community/explorer"',
      "github:someone/their-plugin",
      '"@chaoticgoodcomputing/site-good"',
    ),
    "quartz-v5/tests/quartz.config.yaml": [
      config('"@chaoticgoodcomputing/quartz-good"', "../fixture-plugins/fixture-good", "../fixture-plugins/fixture-gone").trimEnd(),
      "  - source:",
      "      repo: ../../plugins/site-plugins/site-good",
      "      name: site-good",
      "    enabled: false",
      "",
    ].join("\n"),
  })
  const { code, out } = runGuard("package-sources", ["--repo", repo])
  assert.equal(code, 1, out)
  listed(
    out,
    'quartz-v5/core/quartz.config.yaml: plugins[1] lists a plugin of ours by the local path "../plugins/quartz-good": list it by its package name',
    'quartz-v5/core/quartz.config.yaml: plugins[2] lists a plugin of ours by the local path "../fixture-plugins/fixture-good": list it by its package name',
    'quartz-v5/core/quartz.config.yaml: plugins[3] lists a plugin of ours by "github:chaoticgoodcomputing/blog", not a package name',
    'quartz-v5/tests/quartz.config.yaml: plugins[2] lists "../fixture-plugins/fixture-gone", but there is no fixture plugin quartz-v5/tests/fixture-plugins/fixture-gone',
    'quartz-v5/tests/quartz.config.yaml: plugins[3] lists a plugin of ours by the local path "../../plugins/site-plugins/site-good": list it by its package name',
  )
  assert.match(out, /5 violation\(s\)/)
})

test("a source or manifest dependency naming no workspace package fails", () => {
  const good = pluginManifest("quartz-good")
  const repo = makePackageRepo({
    "quartz-v5/core/quartz.config.yaml": config(
      '"@chaoticgoodcomputing/quartz-good"',
      '"@chaoticgoodcomputing/quartz-gone"',
      '"@chaoticgoodcomputing/site-good"',
    ),
    "quartz-v5/plugins/quartz-good/package.json": {
      ...good,
      quartz: { ...good.quartz, dependencies: ["@chaoticgoodcomputing/site-good", "cgc-good", "@chaoticgoodcomputing/quartz-gone"] },
    },
    "quartz-v5/tests/fixture-plugins/fixture-good/package.json": { name: "fixture-good", quartz: { dependencies: ["cgc-styles"] } },
  })
  const { code, out } = runGuard("package-sources", ["--repo", repo])
  assert.equal(code, 1, out)
  listed(
    out,
    'quartz-v5/core/quartz.config.yaml: plugins[1] names "@chaoticgoodcomputing/quartz-gone", which is no package in the workspace',
    'quartz-v5/plugins/quartz-good: its manifest dependency "cgc-good" names no package in the workspace',
    'quartz-v5/plugins/quartz-good: its manifest dependency "@chaoticgoodcomputing/quartz-gone" names no package in the workspace',
    'quartz-v5/tests/fixture-plugins/fixture-good: its manifest dependency "cgc-styles" names no package in the workspace',
  )
  assert.match(out, /4 violation\(s\)/)
})

test("an enabled plugin of ours that the site package doesn't depend on, under the name Quartz imports, fails", () => {
  const repo = makePackageRepo({
    ...pluginFiles("quartz-other"),
    "quartz-v5/package.json": {
      name: "site-v5",
      private: true,
      dependencies: {
        "@chaoticgoodcomputing/quartz-good": "workspace:*",
        "good-sidebar": "workspace:@chaoticgoodcomputing/site-good@*",
      },
    },
    "quartz-v5/core/quartz.config.yaml": [
      config('"@chaoticgoodcomputing/quartz-good"', '"@chaoticgoodcomputing/site-good"').trimEnd(),
      "  - source:",
      '      repo: "@chaoticgoodcomputing/quartz-good"',
      "      name: good-sidebar",
      "    enabled: true",
      "  - source:",
      '      repo: "@chaoticgoodcomputing/quartz-good"',
      "      name: good-footer",
      "    enabled: true",
      '  - source: "@chaoticgoodcomputing/quartz-other"',
      "    enabled: false",
      "",
    ].join("\n"),
    "quartz-v5/tests/quartz.config.yaml": config('"@chaoticgoodcomputing/quartz-other"', '"@chaoticgoodcomputing/quartz-good"'),
  })
  const { code, out } = runGuard("package-sources", ["--repo", repo])
  assert.equal(code, 1, out)
  listed(
    out,
    'quartz-v5/core/quartz.config.yaml: plugins[1] enables "@chaoticgoodcomputing/site-good", which the site package (quartz-v5/package.json) does not depend on',
    'quartz-v5/core/quartz.config.yaml: plugins[2] enables "good-sidebar", but the site package depends on it as "workspace:@chaoticgoodcomputing/site-good@*", not "workspace:@chaoticgoodcomputing/quartz-good@*"',
    'quartz-v5/core/quartz.config.yaml: plugins[3] enables "good-footer", which the site package (quartz-v5/package.json) does not depend on',
    'quartz-v5/tests/quartz.config.yaml: plugins[0] enables "@chaoticgoodcomputing/quartz-other", which the site package (quartz-v5/package.json) does not depend on',
  )
  assert.match(out, /4 violation\(s\)/, "a disabled plugin need not be a dependency")
})

// The fixture exercises every plugin, and the site is built with every plugin and site plugin of ours.
test("a plugin either config leaves out, or a site plugin the site config leaves out, fails", () => {
  const repo = makePackageRepo({
    ...pluginFiles("quartz-other"),
    ...pluginFiles("site-other", { site: true }),
  })
  const { code, out } = runGuard("package-sources", ["--repo", repo])
  assert.equal(code, 1, out)
  listed(
    out,
    'quartz-v5/core/quartz.config.yaml: lists no "@chaoticgoodcomputing/quartz-other" (quartz-v5/plugins/quartz-other)',
    'quartz-v5/tests/quartz.config.yaml: lists no "@chaoticgoodcomputing/quartz-other" (quartz-v5/plugins/quartz-other)',
    'quartz-v5/core/quartz.config.yaml: lists no "@chaoticgoodcomputing/site-other" (quartz-v5/site-plugins/site-other)',
  )
  assert.match(out, /3 violation\(s\)/, "the fixture config lists no site plugin")
})

test("the site package depending on a package of ours by its own name as anything but workspace:* fails", () => {
  const repo = makePackageRepo({
    "quartz-v5/package.json": {
      name: "site-v5",
      private: true,
      dependencies: {
        "@chaoticgoodcomputing/quartz-good": "^0.0.0",
        "@chaoticgoodcomputing/site-good": "workspace:^",
        "good-sidebar": "workspace:@chaoticgoodcomputing/quartz-good@*",
      },
    },
  })
  const { code, out } = runGuard("package-sources", ["--repo", repo])
  assert.equal(code, 1, out)
  listed(
    out,
    'quartz-v5/package.json: depends on "@chaoticgoodcomputing/quartz-good" as "^0.0.0", not "workspace:*"',
    'quartz-v5/package.json: depends on "@chaoticgoodcomputing/site-good" as "workspace:^", not "workspace:*"',
  )
  assert.match(out, /2 violation\(s\)/)
})

test("a missing config cannot be checked: exit 2", () => {
  const repo = makePackageRepo({ "quartz-v5/tests/quartz.config.yaml": null })
  const { code, out } = runGuard("package-sources", ["--repo", repo])
  assert.equal(code, 2, out)
})

test("the real repo's sources and dependencies pass", () => {
  const { code, out } = runGuard("package-sources")
  assert.equal(code, 0, out)
})
