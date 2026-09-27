// Repo guard `package-contract` (#98): every plugin and site plugin meets the package contract. Its
// names agree (package, directory, Nx project and manifest name); its `exports` include
// `./package.json` and give each entry `types` and `import`, with the `.d.ts` emitted beside it; it
// has `files`, `license`, `publishConfig` and `repository`; it is repo-only exactly when it is a site
// plugin (and the site package is repo-only); and no manifest sets `requiresInstall`.
//
// To reproduce a failure by hand: add `"requiresInstall": true` to the `quartz` manifest in
// quartz-v5/plugins/quartz-seo/package.json and delete quartz-v5/plugins/quartz-seo/dist/index.d.ts,
// then `node quartz-v5/utils/guards/package-contract.guard.mjs` lists both and exits 1. Undo with
// `git checkout -- quartz-v5/plugins/quartz-seo/package.json && pnpm nx run quartz-seo:build`.
import { test } from "node:test"
import assert from "node:assert/strict"
import { runGuard } from "./guard-helpers.mjs"
import { makePackageRepo, pluginFiles, pluginManifest } from "./fixtures/package-repo.mjs"

const listed = (out, ...fragments) => {
  for (const fragment of fragments) assert.ok(out.includes(fragment), `lists "${fragment}":\n${out}`)
}

test("a repo whose packages all meet the contract passes", () => {
  const { code, out } = runGuard("package-contract", ["--repo", makePackageRepo()])
  assert.equal(code, 0, out)
  assert.match(out, /^PASS {2}package-contract/)
})

test("a plugin with requiresInstall, in either manifest key, fails", () => {
  const good = pluginManifest("quartz-good")
  const repo = makePackageRepo({
    "quartz-v5/plugins/quartz-good/package.json": { ...good, quartz: { ...good.quartz, requiresInstall: true } },
    ...pluginFiles("quartz-other", { manifest: { ...pluginManifest("quartz-other"), manifest: { requiresInstall: false } } }),
  })
  const { code, out } = runGuard("package-contract", ["--repo", repo])
  assert.equal(code, 1, out)
  assert.match(out, /2 violation\(s\)/)
  listed(out, "quartz-v5/plugins/quartz-good: its manifest sets requiresInstall", "quartz-v5/plugins/quartz-other: its manifest sets requiresInstall")
})

test("names that disagree: every one is listed", () => {
  const repo = makePackageRepo({
    // package name, Nx project and manifest name all wrong, for a plugin
    "quartz-v5/plugins/quartz-good/package.json": { ...pluginManifest("quartz-good"), name: "quartz-good", quartz: { name: "good" } },
    "quartz-v5/plugins/quartz-good/project.json": { name: "cgc-good" },
    // a site plugin whose manifest name took the family's prefix
    "quartz-v5/site-plugins/site-good/package.json": { ...pluginManifest("site-good", { site: true }), quartz: { name: "cgc-good" } },
    // a directory outside the naming scheme
    ...pluginFiles("cgc-legacy"),
  })
  const { code, out } = runGuard("package-contract", ["--repo", repo])
  assert.equal(code, 1, out)
  listed(
    out,
    'quartz-v5/plugins/quartz-good: its package name is "quartz-good", not "@chaoticgoodcomputing/quartz-good"',
    'quartz-v5/plugins/quartz-good: its Nx project is "cgc-good", not "quartz-good"',
    'quartz-v5/plugins/quartz-good: its manifest name is "good", not "cgc-good"',
    'quartz-v5/site-plugins/site-good: its manifest name is "cgc-good", not "site-good"',
    'quartz-v5/plugins/cgc-legacy: a plugin\'s directory is named "quartz-<name>"',
  )
  assert.match(out, /5 violation\(s\)/)
})

test("exports without ./package.json, types or an emitted .d.ts fail", () => {
  const good = pluginManifest("quartz-good")
  const repo = makePackageRepo({
    "quartz-v5/plugins/quartz-good/package.json": {
      ...good,
      exports: {
        ".": { types: "./dist/index.d.ts", import: "./dist/index.js" },
        "./components": "./dist/components/index.js",
        "./frames": { types: "./dist/frames/index.d.ts", import: "./dist/frames/index.js" },
      },
    },
    "quartz-v5/plugins/quartz-good/dist/index.d.ts": null,
    "quartz-v5/site-plugins/site-good/package.json": { ...pluginManifest("site-good", { site: true }), exports: undefined },
  })
  const { code, out } = runGuard("package-contract", ["--repo", repo])
  assert.equal(code, 1, out)
  listed(
    out,
    'quartz-v5/plugins/quartz-good: exports has no "./package.json": "./package.json"',
    'quartz-v5/plugins/quartz-good: exports "./components" is not { types, import }',
    'quartz-v5/plugins/quartz-good: exports "." has no emitted ./dist/index.d.ts (build it)',
    'quartz-v5/plugins/quartz-good: exports "./frames" has no emitted ./dist/frames/index.js (build it)',
    'quartz-v5/plugins/quartz-good: exports "./frames" has no emitted ./dist/frames/index.d.ts (build it)',
    "quartz-v5/site-plugins/site-good: it has no exports",
  )
  assert.match(out, /6 violation\(s\)/)
})

test("missing files, license, publishConfig or repository fail", () => {
  const { files, license, publishConfig, ...bare } = pluginManifest("quartz-good")
  const repo = makePackageRepo({
    "quartz-v5/plugins/quartz-good/package.json": { ...bare, repository: { type: "git", url: "git+https://example.com/x.git" } },
  })
  const { code, out } = runGuard("package-contract", ["--repo", repo])
  assert.equal(code, 1, out)
  listed(
    out,
    'quartz-v5/plugins/quartz-good: its files is not ["dist"]',
    'quartz-v5/plugins/quartz-good: its license is not "MIT"',
    'quartz-v5/plugins/quartz-good: its publishConfig is not { access: "public" }',
    'quartz-v5/plugins/quartz-good: its repository is not { type: "git", url: "git+https://github.com/chaoticgoodcomputing/blog.git", directory: "quartz-v5/plugins/quartz-good" }',
  )
  assert.match(out, /4 violation\(s\)/)
})

test("repo-only anywhere but the site plugins and the site package fails, and so does its absence there", () => {
  const repo = makePackageRepo({
    "quartz-v5/plugins/quartz-good/package.json": { ...pluginManifest("quartz-good"), private: true },
    "quartz-v5/site-plugins/site-good/package.json": { ...pluginManifest("site-good", { site: true }), private: undefined },
    "quartz-v5/package.json": { name: "site-v5", version: "0.0.0", dependencies: {} },
  })
  const { code, out } = runGuard("package-contract", ["--repo", repo])
  assert.equal(code, 1, out)
  listed(
    out,
    "quartz-v5/plugins/quartz-good: it is repo-only (private), but only site plugins and the site package are",
    'quartz-v5/site-plugins/site-good: a site plugin is repo-only: set "private": true',
    'quartz-v5/package.json: the site package is repo-only: set "private": true',
  )
  assert.match(out, /3 violation\(s\)/)
})

test("the real repo's plugins and site plugins meet the contract", () => {
  const { code, out } = runGuard("package-contract")
  assert.equal(code, 0, out)
})
