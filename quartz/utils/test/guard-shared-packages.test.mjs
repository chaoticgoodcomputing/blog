// Repo guard `shared-packages` (#98): one copy of each of Quartz's shared packages (Preact,
// preact-render-to-string, vfile, unified, lightningcss, @quartz-community/*), Core's. From each
// plugin's and site plugin's real path, every one resolves to Core's copy; no plugin, site plugin or
// library declares one other than as a peer or has one installed beside it; and no plugin's `dist/`
// inlines one, directly or through a library it inlines. And no plugin or site plugin source imports
// picomatch or string-width, which Core's hoisted install places unlike npm.
//
// To reproduce a failure by hand: in quartz/libs/pipeline/package.json move `unified` from
// peerDependencies to dependencies, then `pnpm install && pnpm nx run quartz-annotator:build`, and
// `node quartz/utils/guards/shared-packages.guard.mjs` lists the library's declaration and copy
// and the annotator's bundled copy. Undo with `git checkout -- quartz/libs/pipeline/package.json`,
// then the same install and build.
import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { listed, runGuard, writeTree } from "./guard-helpers.mjs"
import { makePackageRepo, pluginManifest } from "./fixtures/package-repo.mjs"

test("a repo where every shared package is Core's passes", () => {
  const { code, out } = runGuard("shared-packages", ["--repo", makePackageRepo()])
  assert.equal(code, 0, out)
  assert.match(out, /^PASS {2}shared-packages/)
})

test("a devDependency on preact, and a library's dependency on unified, fail", () => {
  const good = pluginManifest("quartz-good")
  const repo = makePackageRepo({
    "quartz/plugins/quartz-good/package.json": { ...good, devDependencies: { ...good.devDependencies, preact: "^10.29.0" } },
    "quartz/libs/lib-good/package.json": {
      name: "@chaoticgoodcomputing/lib-good",
      dependencies: { unified: "^11.0.5", "@quartz-community/utils": "*" },
    },
  })
  const { code, out } = runGuard("shared-packages", ["--repo", repo])
  assert.equal(code, 1, out)
  listed(
    out,
    "quartz/plugins/quartz-good: declares preact in devDependencies: a shared package is a peer only",
    "quartz/libs/lib-good: declares unified in dependencies: a shared package is a peer only",
    "quartz/libs/lib-good: declares @quartz-community/utils in dependencies: a shared package is a peer only",
  )
  assert.match(out, /3 violation\(s\)/)
})

test("a copy installed beside a plugin or a library fails, and so does a peer that resolves elsewhere or nowhere", () => {
  const repo = makePackageRepo()
  const v5 = path.join(repo, "quartz")
  writeTree(v5, {
    // a plugin's own vfile, which shadows Core's
    "plugins/quartz-good/node_modules/vfile/package.json": "{}",
    // a library's own unified, which a plugin that inlines it would bundle
    "libs/lib-good/node_modules/unified/package.json": "{}",
    // a Preact at the repo root, where a site plugin without its host link walks to
    "../node_modules/preact/package.json": "{}",
  })
  fs.rmSync(path.join(v5, "site-plugins/node_modules"))
  const { code, out } = runGuard("shared-packages", ["--repo", repo])
  assert.equal(code, 1, out)
  listed(
    out,
    `quartz/plugins/quartz-good: vfile resolves to ${fs.realpathSync(path.join(v5, "plugins/quartz-good/node_modules/vfile"))}, not Core's copy`,
    `quartz/site-plugins/site-good: preact resolves to ${fs.realpathSync(path.join(repo, "node_modules/preact"))}, not Core's copy`,
    "quartz/site-plugins/site-good: its peer vfile resolves nowhere, not to Core's copy",
    "quartz/libs/lib-good: carries its own unified (quartz/libs/lib-good/node_modules/unified)",
  )
  assert.match(out, /4 violation\(s\)/)
})

test("a plugin whose dist/ inlines a shared package fails, naming each one once per file", () => {
  const repo = makePackageRepo({
    "quartz/plugins/quartz-good/dist/index.js": [
      "// ../../libs/lib-good/src/index.ts",
      "// ../../../node_modules/.pnpm/unified@11.0.5/node_modules/unified/lib/callable-instance.js",
      "// ../../../node_modules/.pnpm/unified@11.0.5/node_modules/unified/lib/index.js",
      "// ../../../node_modules/.pnpm/vfile-message@4.0.3/node_modules/vfile-message/lib/index.js",
      "// node_modules/@quartz-community/utils/dist/index.js",
      "export {}",
    ].join("\n"),
    "quartz/plugins/quartz-good/dist/components/index.js": "// ../../node_modules/preact/dist/preact.module.js\nexport {}\n",
  })
  const { code, out } = runGuard("shared-packages", ["--repo", repo])
  assert.equal(code, 1, out)
  listed(
    out,
    "quartz/plugins/quartz-good: dist/index.js inlines unified (../../../node_modules/.pnpm/unified@11.0.5/node_modules/unified/lib/callable-instance.js)",
    "quartz/plugins/quartz-good: dist/index.js inlines @quartz-community/utils",
    "quartz/plugins/quartz-good: dist/components/index.js inlines preact",
  )
  assert.ok(!out.includes("vfile-message"), "vfile-message is not vfile")
  assert.match(out, /3 violation\(s\)/)
})

// Core's hoisted pnpm install puts another version of these two at its top level than npm did
// (VENDORED.md, "Dependencies"), so a plugin resolving one through Core would get another major.
test("a plugin or site plugin source importing picomatch or string-width fails", () => {
  const repo = makePackageRepo({
    "quartz/plugins/quartz-good/src/match.ts": 'import picomatch from "picomatch"\nexport const m = picomatch\n',
    "quartz/plugins/quartz-good/build.mjs": 'const { default: width } = await import("string-width/index.js")\n',
    "quartz/site-plugins/site-good/src/width.tsx": 'const width = require("string-width")\nexport { width }\n',
    // Not an import of either: a longer name, and built output.
    "quartz/plugins/quartz-good/src/ok.ts": 'import x from "picomatch-extra"\nexport { x }\n',
    "quartz/plugins/quartz-good/dist/extra.js": 'import picomatch from "picomatch"\n',
  })
  const { code, out } = runGuard("shared-packages", ["--repo", repo])
  assert.equal(code, 1, out)
  listed(
    out,
    "quartz/plugins/quartz-good: src/match.ts imports picomatch",
    "quartz/plugins/quartz-good: build.mjs imports string-width",
    "quartz/site-plugins/site-good: src/width.tsx imports string-width",
  )
  assert.match(out, /3 violation\(s\)/)
})

test("a repo with no Core install cannot be checked: exit 2", () => {
  const repo = makePackageRepo()
  fs.rmSync(path.join(repo, "quartz/core/node_modules"), { recursive: true })
  const { code, out } = runGuard("shared-packages", ["--repo", repo])
  assert.equal(code, 2, out)
})

test("the real repo has one copy of each shared package, Core's", () => {
  const { code, out } = runGuard("shared-packages")
  assert.equal(code, 0, out)
})
