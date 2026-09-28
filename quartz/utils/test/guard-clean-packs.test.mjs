// Repo guard `clean-packs` (#98): `pnpm pack --dry-run` of each publishable package (every plugin
// that is not repo-only) lists only its built `dist/`, its README, its LICENSE and `package.json`,
// and has each of them. A downstream site installs exactly that, and needs no build. A workspace
// publish leaves out every repo-only package: the site plugins, the site package and every library
// but widgets (#90).
//
// To reproduce a failure by hand: add "src" to `files` in quartz/plugins/quartz-seo/package.json,
// then `node quartz/utils/guards/clean-packs.guard.mjs` lists every file under src/ and exits 1.
// Undo with `git checkout -- quartz/plugins/quartz-seo/package.json`.
import { test } from "node:test"
import assert from "node:assert/strict"
import { listed, runGuard } from "./guard-helpers.mjs"
import { makePackageRepo, pluginFiles, pluginManifest } from "./fixtures/package-repo.mjs"

// pnpm pack rewrites each `workspace:*` spec to the version installed, and the scratch repo has no
// install, so its packages carry none here.
const packable = (dir, extra = {}) => ({ ...pluginManifest(dir), devDependencies: undefined, ...extra })
const packableRepo = (files = {}) =>
  makePackageRepo({ "quartz/plugins/quartz-good/package.json": packable("quartz-good"), ...files })

test("a repo whose publishable packages pack only dist/, README, LICENSE and package.json passes", () => {
  const { code, out } = runGuard("clean-packs", ["--repo", packableRepo()])
  assert.equal(code, 0, out)
  assert.match(out, /^PASS {2}clean-packs/)
})

test("a stray file in a pack, or a pack without its README or LICENSE, fails; a repo-only package is never packed", () => {
  const repo = packableRepo({
    // sources in the pack
    "quartz/plugins/quartz-good/package.json": packable("quartz-good", { files: ["dist", "src", "notes.txt"] }),
    "quartz/plugins/quartz-good/notes.txt": "scratch\n",
    // no README and no LICENSE
    ...pluginFiles("quartz-bare", { manifest: packable("quartz-bare") }),
    "quartz/plugins/quartz-bare/README.md": null,
    "quartz/plugins/quartz-bare/LICENSE": null,
    // a site plugin packs whatever it likes: it is never published
    "quartz/site-plugins/site-good/package.json": { ...pluginManifest("site-good", { site: true }), files: ["dist", "src"] },
  })
  const { code, out } = runGuard("clean-packs", ["--repo", repo])
  assert.equal(code, 1, out)
  listed(
    out,
    "quartz/plugins/quartz-good: its pack has src/index.ts, which is not dist/, README, LICENSE or package.json",
    "quartz/plugins/quartz-good: its pack has notes.txt, which is not dist/, README, LICENSE or package.json",
    "quartz/plugins/quartz-bare: its pack has no README.md",
    "quartz/plugins/quartz-bare: its pack has no LICENSE",
  )
  assert.ok(!out.includes("site-good"), out)
  assert.match(out, /4 violation\(s\)/)
})

test("a pack with no dist/ fails", () => {
  const repo = packableRepo({ "quartz/plugins/quartz-good/dist": null })
  const { code, out } = runGuard("clean-packs", ["--repo", repo])
  assert.equal(code, 1, out)
  listed(out, "quartz/plugins/quartz-good: its pack has no dist/ (build it)")
})

// pnpm refuses to publish a private package, so a workspace publish, the way every package would be
// published (#90), leaves each repo-only one out. A single-package `pnpm publish --dry-run` stops
// before that check, so the guard asks the workspace. A site plugin that is not repo-only would be
// published. pnpm then asks the registry whether that version exists; offline, the guard's
// no-retry lookup fails at once and the dry run still names it, so the case needs no network.
test("a site plugin a workspace publish would publish fails", () => {
  const repo = packableRepo({
    "quartz/site-plugins/site-good/package.json": { ...pluginManifest("site-good", { site: true }), private: undefined, devDependencies: undefined },
  })
  const { code, out } = runGuard("clean-packs", ["--repo", repo])
  assert.equal(code, 1, out)
  listed(out, "quartz/site-plugins/site-good: a workspace publish would publish @chaoticgoodcomputing/site-good: it must be repo-only")
  assert.match(out, /1 violation\(s\)/)
})

// #90 made the libraries repo-only, since every plugin inlines the ones it uses: one a workspace
// publish would publish fails, like a site plugin. `widgets` is meant to be published, so it is in
// neither check, and is never packed.
test("a library a workspace publish would publish fails, except widgets", () => {
  const repo = packableRepo({
    "quartz/libs/lib-good/package.json": { name: "@chaoticgoodcomputing/lib-good", version: "0.0.0", files: ["src"] },
    "quartz/libs/widgets/package.json": { name: "@chaoticgoodcomputing/widgets", version: "0.0.0", files: ["src"] },
  })
  const { code, out } = runGuard("clean-packs", ["--repo", repo])
  assert.equal(code, 1, out)
  listed(out, "quartz/libs/lib-good: a workspace publish would publish @chaoticgoodcomputing/lib-good: it must be repo-only")
  assert.ok(!out.includes("widgets"), out)
  assert.match(out, /1 violation\(s\)/)
})

test("the real repo's publishable packages pack cleanly", () => {
  const { code, out } = runGuard("clean-packs")
  assert.equal(code, 0, out)
})
