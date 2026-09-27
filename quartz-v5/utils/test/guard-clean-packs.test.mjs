// Repo guard `clean-packs` (#98): `pnpm pack --dry-run` of each publishable package (every plugin
// that is not repo-only) lists only its built `dist/`, its README, its LICENSE and `package.json`,
// and has each of them. A downstream site installs exactly that, and needs no build.
//
// To reproduce a failure by hand: add "src" to `files` in quartz-v5/plugins/quartz-seo/package.json,
// then `node quartz-v5/utils/guards/clean-packs.guard.mjs` lists every file under src/ and exits 1.
// Undo with `git checkout -- quartz-v5/plugins/quartz-seo/package.json`.
import { test } from "node:test"
import assert from "node:assert/strict"
import { runGuard } from "./guard-helpers.mjs"
import { makePackageRepo, pluginFiles, pluginManifest } from "./fixtures/package-repo.mjs"

// pnpm pack rewrites each `workspace:*` spec to the version installed, and the scratch repo has no
// install, so its packages carry none here.
const packable = (dir, extra = {}) => ({ ...pluginManifest(dir), devDependencies: undefined, ...extra })
const packableRepo = (files = {}) =>
  makePackageRepo({ "quartz-v5/plugins/quartz-good/package.json": packable("quartz-good"), ...files })

const listed = (out, ...fragments) => {
  for (const fragment of fragments) assert.ok(out.includes(fragment), `lists "${fragment}":\n${out}`)
}

test("a repo whose publishable packages pack only dist/, README, LICENSE and package.json passes", () => {
  const { code, out } = runGuard("clean-packs", ["--repo", packableRepo()])
  assert.equal(code, 0, out)
  assert.match(out, /^PASS {2}clean-packs/)
})

test("a stray file in a pack, or a pack without its README or LICENSE, fails; a repo-only package is never packed", () => {
  const repo = packableRepo({
    // sources in the pack
    "quartz-v5/plugins/quartz-good/package.json": packable("quartz-good", { files: ["dist", "src", "notes.txt"] }),
    "quartz-v5/plugins/quartz-good/notes.txt": "scratch\n",
    // no README and no LICENSE
    ...pluginFiles("quartz-bare", { manifest: packable("quartz-bare") }),
    "quartz-v5/plugins/quartz-bare/README.md": null,
    "quartz-v5/plugins/quartz-bare/LICENSE": null,
    // a site plugin packs whatever it likes: it is never published
    "quartz-v5/site-plugins/site-good/package.json": { ...pluginManifest("site-good", { site: true }), files: ["dist", "src"] },
  })
  const { code, out } = runGuard("clean-packs", ["--repo", repo])
  assert.equal(code, 1, out)
  listed(
    out,
    "quartz-v5/plugins/quartz-good: its pack has src/index.ts, which is not dist/, README, LICENSE or package.json",
    "quartz-v5/plugins/quartz-good: its pack has notes.txt, which is not dist/, README, LICENSE or package.json",
    "quartz-v5/plugins/quartz-bare: its pack has no README.md",
    "quartz-v5/plugins/quartz-bare: its pack has no LICENSE",
  )
  assert.ok(!out.includes("site-good"), out)
  assert.match(out, /4 violation\(s\)/)
})

test("a pack with no dist/ fails", () => {
  const repo = packableRepo({ "quartz-v5/plugins/quartz-good/dist": null })
  const { code, out } = runGuard("clean-packs", ["--repo", repo])
  assert.equal(code, 1, out)
  listed(out, "quartz-v5/plugins/quartz-good: its pack has no dist/ (build it)")
})

test("the real repo's publishable packages pack cleanly", () => {
  const { code, out } = runGuard("clean-packs")
  assert.equal(code, 0, out)
})
