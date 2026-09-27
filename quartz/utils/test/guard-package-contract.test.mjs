// Repo guard `package-contract` (#98): every plugin and site plugin meets the package contract. Its
// names agree (package, directory, Nx project and manifest name); its `exports` include
// `./package.json` and `.`, and give each entry `types` and `import`, with the `.d.ts` emitted; it
// has `files`, `license`, `publishConfig` and `repository`; it is repo-only exactly when it is a site
// plugin (and the site package is repo-only); and no manifest sets `requiresInstall`.
//
// To reproduce a failure by hand: add `"requiresInstall": true` to the `quartz` manifest in
// quartz/plugins/quartz-seo/package.json and delete quartz/plugins/quartz-seo/dist/index.d.ts,
// then `node quartz/utils/guards/package-contract.guard.mjs` lists both and exits 1. Undo with
// `git checkout -- quartz/plugins/quartz-seo/package.json && pnpm nx run quartz-seo:build`.
import { test } from "node:test"
import assert from "node:assert/strict"
import { listed, runGuard } from "./guard-helpers.mjs"
import { makePackageRepo, pluginFiles, pluginManifest } from "./fixtures/package-repo.mjs"

test("a repo whose packages all meet the contract passes", () => {
  const { code, out } = runGuard("package-contract", ["--repo", makePackageRepo()])
  assert.equal(code, 0, out)
  assert.match(out, /^PASS {2}package-contract/)
})

test("a plugin with requiresInstall, in either manifest key, fails", () => {
  const good = pluginManifest("quartz-good")
  const repo = makePackageRepo({
    "quartz/plugins/quartz-good/package.json": { ...good, quartz: { ...good.quartz, requiresInstall: true } },
    ...pluginFiles("quartz-other", { manifest: { ...pluginManifest("quartz-other"), manifest: { requiresInstall: false } } }),
  })
  const { code, out } = runGuard("package-contract", ["--repo", repo])
  assert.equal(code, 1, out)
  assert.match(out, /2 violation\(s\)/)
  listed(out, "quartz/plugins/quartz-good: its manifest sets requiresInstall", "quartz/plugins/quartz-other: its manifest sets requiresInstall")
})

test("names that disagree: every one is listed", () => {
  const repo = makePackageRepo({
    // package name, Nx project and manifest name all wrong, for a plugin
    "quartz/plugins/quartz-good/package.json": { ...pluginManifest("quartz-good"), name: "quartz-good", quartz: { name: "good" } },
    "quartz/plugins/quartz-good/project.json": { name: "cgc-good" },
    // a site plugin whose manifest name took the family's prefix
    "quartz/site-plugins/site-good/package.json": { ...pluginManifest("site-good", { site: true }), quartz: { name: "cgc-good" } },
    // a directory outside the naming scheme
    ...pluginFiles("cgc-legacy"),
  })
  const { code, out } = runGuard("package-contract", ["--repo", repo])
  assert.equal(code, 1, out)
  listed(
    out,
    'quartz/plugins/quartz-good: its package name is "quartz-good", not "@chaoticgoodcomputing/quartz-good"',
    'quartz/plugins/quartz-good: its Nx project is "cgc-good", not "quartz-good"',
    'quartz/plugins/quartz-good: its manifest name is "good", not "cgc-good"',
    'quartz/site-plugins/site-good: its manifest name is "cgc-good", not "site-good"',
    'quartz/plugins/cgc-legacy: a plugin\'s directory is named "quartz-<name>"',
  )
  assert.match(out, /5 violation\(s\)/)
})

test("exports without ./package.json, types or an emitted .d.ts fail", () => {
  const good = pluginManifest("quartz-good")
  const repo = makePackageRepo({
    "quartz/plugins/quartz-good/package.json": {
      ...good,
      exports: {
        ".": { types: "./dist/index.d.ts", import: "./dist/index.js" },
        "./components": "./dist/components/index.js",
        "./frames": { types: "./dist/frames/index.d.ts", import: "./dist/frames/index.js" },
      },
    },
    "quartz/plugins/quartz-good/dist/index.d.ts": null,
    "quartz/site-plugins/site-good/package.json": { ...pluginManifest("site-good", { site: true }), exports: undefined },
  })
  const { code, out } = runGuard("package-contract", ["--repo", repo])
  assert.equal(code, 1, out)
  listed(
    out,
    'quartz/plugins/quartz-good: exports has no "./package.json": "./package.json"',
    'quartz/plugins/quartz-good: exports "./components" is not { types, import }',
    'quartz/plugins/quartz-good: exports "." has no emitted ./dist/index.d.ts (build it)',
    'quartz/plugins/quartz-good: exports "./frames" has no emitted ./dist/frames/index.js (build it)',
    'quartz/plugins/quartz-good: exports "./frames" has no emitted ./dist/frames/index.d.ts (build it)',
    "quartz/site-plugins/site-good: it has no exports",
  )
  assert.match(out, /6 violation\(s\)/)
})

// Quartz imports a package source by its name, the "." entry, and its plugin index reads that entry's
// dist/index.d.ts: an exports map without ".", or whose types are not a declaration file, fails.
test('exports with no "." entry, or types that are no .d.ts, fail', () => {
  const good = pluginManifest("quartz-good")
  const repo = makePackageRepo({
    "quartz/plugins/quartz-good/package.json": {
      ...good,
      exports: {
        "./components": { types: "./dist/components/index.js", import: "./dist/components/index.js" },
        "./package.json": "./package.json",
      },
    },
  })
  const { code, out } = runGuard("package-contract", ["--repo", repo])
  assert.equal(code, 1, out)
  listed(
    out,
    'quartz/plugins/quartz-good: exports has no "." entry { types, import }',
    'quartz/plugins/quartz-good: exports "./components" types ./dist/components/index.js is not a .d.ts',
  )
  assert.match(out, /2 violation\(s\)/)
})

test("missing files, license, publishConfig or repository fail", () => {
  const { files, license, publishConfig, ...bare } = pluginManifest("quartz-good")
  const repo = makePackageRepo({
    "quartz/plugins/quartz-good/package.json": { ...bare, repository: { type: "git", url: "git+https://example.com/x.git" } },
  })
  const { code, out } = runGuard("package-contract", ["--repo", repo])
  assert.equal(code, 1, out)
  listed(
    out,
    'quartz/plugins/quartz-good: its files is not ["dist"]',
    'quartz/plugins/quartz-good: its license is not "MIT"',
    'quartz/plugins/quartz-good: its publishConfig is not { access: "public" }',
    'quartz/plugins/quartz-good: its repository is not { type: "git", url: "git+https://github.com/chaoticgoodcomputing/blog.git", directory: "quartz/plugins/quartz-good" }',
  )
  assert.match(out, /4 violation\(s\)/)
})

test("repo-only anywhere but the site plugins and the site package fails, and so does its absence there", () => {
  const repo = makePackageRepo({
    "quartz/plugins/quartz-good/package.json": { ...pluginManifest("quartz-good"), private: true },
    "quartz/site-plugins/site-good/package.json": { ...pluginManifest("site-good", { site: true }), private: undefined },
    "quartz/package.json": { name: "site", version: "0.0.0", dependencies: {} },
  })
  const { code, out } = runGuard("package-contract", ["--repo", repo])
  assert.equal(code, 1, out)
  listed(
    out,
    "quartz/plugins/quartz-good: it is repo-only (private), but only site plugins and the site package are",
    'quartz/site-plugins/site-good: a site plugin is repo-only: set "private": true',
    'quartz/package.json: the site package is repo-only: set "private": true',
  )
  assert.match(out, /3 violation\(s\)/)
})

test("the real repo's plugins and site plugins meet the contract", () => {
  const { code, out } = runGuard("package-contract")
  assert.equal(code, 0, out)
})
