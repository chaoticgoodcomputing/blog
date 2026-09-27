// The upgrade (#99): `site-v5:upgrade --ref=<ref>` moves Quartz Core to another upstream commit and
// keeps what's ours: vendored changes, steering files, the pruning and Core's pnpm settings. Tested
// at its command line, against a synthetic Quartz-shaped upstream and site repo in a temp dir
// (fixtures/quartz-repo.mjs). Offline apart from the pnpm store: the fixture's one package,
// is-number, is converted and installed from it.
import { after, before, describe, test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import { lines, makeFixture, PINNED, PNPM_WORKSPACE, SITE_CONFIG } from "./fixtures/quartz-repo.mjs"

const CORE = "quartz-v5/core"
const MANIFEST = "quartz-v5/upstream.json"
const pinnedCommit = (fx) => JSON.parse(fx.read(MANIFEST)).commit

describe("a dirty working tree", () => {
  let fx
  before(() => (fx = makeFixture()))
  after(() => fx.cleanup())

  test("is refused, naming what is uncommitted, and nothing changes", () => {
    fs.writeFileSync(`${fx.root}/${CORE}/quartz/build.ts`, "// edited, not committed\n")
    const before = fx.status()

    const res = fx.upgrade([`--ref=${fx.target}`])

    assert.notEqual(res.code, 0)
    assert.match(res.output, /uncommitted/i)
    assert.match(res.output, /quartz-v5\/core\/quartz\/build\.ts/)
    assert.equal(fx.status(), before)
    assert.equal(pinnedCommit(fx), fx.pinned)
  })
})

// Our vendored change: PageType.generate is awaitable (as #19's is), on the pinned tree's types.ts.
const VENDORED_TYPES = PINNED["quartz/plugins/types.ts"].replace(
  "  generate(): string",
  "  generate(): Promise<string>",
)

describe("an upgrade to a target that changes every tier", () => {
  let fx, res
  const target = {
    // Core source: upstream changes a file we don't touch, and another part of the file we do.
    "quartz/build.ts": lines("// build", "export function build() {", "  return 2", "}"),
    "quartz/plugins/types.ts": PINNED["quartz/plugins/types.ts"].replace(
      "export interface Frame {\n  name: string",
      "export interface Frame {\n  name: string\n  priority: number",
    ),
    // Scaffolding: package.json and .gitignore change upstream.
    "package.json": PINNED["package.json"].replace('"version": "5.0.0"', '"version": "5.1.0"'),
    "package-lock.json": PINNED["package-lock.json"].replaceAll(
      '"version": "5.0.0"',
      '"version": "5.1.0"',
    ),
    ".gitignore": lines(".quartz-cache", "node_modules", "public", ".upstream-added"),
    // Steering file: upstream's template changes.
    "quartz.ts": lines(
      'import { loadQuartzLayout } from "./quartz/plugins/loader"',
      "export default loadQuartzLayout({ defaults: true })",
    ),
    // Pruned files: one changes upstream, one is new under a pruned directory.
    "README.md": lines("# Quartz 5.1"),
    "docs/new-feature.md": lines("# New"),
  }
  before(() => {
    fx = makeFixture({
      targetChanges: target,
      coreChanges: {
        "quartz/plugins/types.ts": VENDORED_TYPES,
        "quartz/util/ours.ts": lines("export const ours = true"),
        ".gitignore": lines(".ours-added", ".quartz-cache", "node_modules", "public"),
        "quartz.ts": lines(
          'import { loadQuartzLayout } from "./quartz/plugins/loader"',
          "export default loadQuartzLayout({ ours: true })",
        ),
      },
    })
    res = fx.upgrade(["--ref=v5"])
  })
  after(() => fx.cleanup())

  test("succeeds", () => {
    assert.equal(res.code, 0, res.output)
  })

  test("takes the target's Core source", () => {
    assert.equal(fx.read(`${CORE}/quartz/build.ts`), target["quartz/build.ts"])
  })

  test("re-applies our vendored change on top of upstream's", () => {
    const types = fx.read(`${CORE}/quartz/plugins/types.ts`)
    assert.match(types, /generate\(\): Promise<string>/)
    assert.match(types, /priority: number/)
    assert.match(res.output, /2 hunk\(s\) re-applied, 0 absorbed/)
  })

  test("keeps a file our vendored changes add to Core source", () => {
    assert.equal(fx.read(`${CORE}/quartz/util/ours.ts`), lines("export const ours = true"))
  })

  test("takes package.json verbatim", () => {
    assert.equal(fx.read(`${CORE}/package.json`), target["package.json"])
  })

  test("three-way merges the other scaffolding", () => {
    assert.equal(
      fx.read(`${CORE}/.gitignore`),
      lines(".ours-added", ".quartz-cache", "node_modules", "public", ".upstream-added"),
    )
  })

  test("leaves a steering file alone, and shows upstream's template change to it", () => {
    assert.equal(
      fx.read(`${CORE}/quartz.ts`),
      lines(
        'import { loadQuartzLayout } from "./quartz/plugins/loader"',
        "export default loadQuartzLayout({ ours: true })",
      ),
    )
    assert.equal(fx.read(`${CORE}/quartz.config.yaml`), SITE_CONFIG)
    assert.match(res.output, /-export default loadQuartzLayout\(\)\n/)
    assert.match(res.output, /\+export default loadQuartzLayout\(\{ defaults: true \}\)/)
  })

  test("keeps pruned files pruned, even one upstream changed or added", () => {
    for (const rel of [
      "README.md",
      "docs/new-feature.md",
      "docs/index.md",
      "package-lock.json",
      "quartz.config.default.yaml",
      "Dockerfile",
    ])
      assert.equal(fx.exists(`${CORE}/${rel}`), false, rel)
  })

  test("converts the target's lock and installs it", () => {
    assert.match(fx.read(`${CORE}/pnpm-lock.yaml`), /is-number@7\.0\.0/)
    assert.equal(fx.read(`${CORE}/pnpm-workspace.yaml`), PNPM_WORKSPACE)
    assert.match(res.output, /1 of 1 packages match/)
    assert.equal(fx.exists(`${CORE}/node_modules/is-number/package.json`), true)
  })

  test("records the target as the pinned ref", () => {
    const manifest = JSON.parse(fx.read(MANIFEST))
    assert.equal(manifest.commit, fx.target)
    assert.equal(manifest.version, "5.1.0")
    assert.equal(manifest.repo, fx.upstream)
  })
})

// Upgrades that must stop change nothing: not Core, not its lock, not the pinned ref.
function assertUnchanged(fx) {
  assert.equal(fx.status(), "")
  assert.equal(pinnedCommit(fx), fx.pinned)
  assert.equal(fx.exists(`${CORE}/node_modules`), false)
}

describe("a vendored change that conflicts with upstream's", () => {
  let fx, res
  before(() => {
    fx = makeFixture({
      targetChanges: {
        "quartz/plugins/types.ts": PINNED["quartz/plugins/types.ts"].replace(
          "  generate(): string",
          "  generate(ctx: Ctx): string",
        ),
      },
      coreChanges: { "quartz/plugins/types.ts": VENDORED_TYPES },
    })
    res = fx.upgrade([`--ref=${fx.target}`])
  })
  after(() => fx.cleanup())

  test("stops the upgrade, naming the file and the hunk", () => {
    assert.equal(res.code, 1)
    assert.match(res.output, /conflict/)
    assert.match(res.output, /quartz\/plugins\/types\.ts {2}@@ -\d+,\d+ \+\d+,\d+ @@/)
    assert.match(res.output, /\+ {2}generate\(\): Promise<string>/)
  })

  test("leaves Core, its lock and the pinned ref as they were", () => {
    assertUnchanged(fx)
  })
})

describe("a vendored change upstream has absorbed", () => {
  let fx, res
  before(() => {
    fx = makeFixture({
      targetChanges: {
        "quartz/plugins/types.ts": VENDORED_TYPES,
        "quartz/build.ts": lines("// build", "export function build() {", "  return 2", "}"),
      },
      coreChanges: {
        "quartz/plugins/types.ts": VENDORED_TYPES.replace(
          "  name: string\n}\n",
          "  name: string\n  ours: true\n}\n",
        ),
      },
    })
    res = fx.upgrade([`--ref=${fx.target}`])
  })
  after(() => fx.cleanup())

  test("is reported, hunk by hunk, while the rest is re-applied", () => {
    assert.equal(res.code, 0, res.output)
    assert.match(res.output, /1 hunk\(s\) re-applied, 1 absorbed by upstream/)
    assert.match(
      res.output,
      /absorbed these[^\n]*\n\s+quartz\/plugins\/types\.ts {2}@@ -\d+,\d+ \+\d+,\d+ @@/,
    )
    const types = fx.read(`${CORE}/quartz/plugins/types.ts`)
    assert.match(types, /generate\(\): Promise<string>/)
    assert.match(types, /ours: true/)
  })
})

describe("scaffolding that does not merge", () => {
  let fx, res
  before(() => {
    fx = makeFixture({
      targetChanges: {
        "tsconfig.json": lines("{", '  "compilerOptions": { "strict": false }', "}"),
      },
      coreChanges: {
        "tsconfig.json": lines("{", '  "compilerOptions": { "strict": true, "noEmit": true }', "}"),
      },
    })
    res = fx.upgrade([`--ref=${fx.target}`])
  })
  after(() => fx.cleanup())

  test("stops the upgrade, naming the file, and changes nothing", () => {
    assert.equal(res.code, 1)
    assert.match(res.output, /tsconfig\.json: 1 conflicting region/)
    assertUnchanged(fx)
  })
})

describe("the lock conversion", () => {
  let fx, res
  // Core's pnpm settings override is-number with another package, so pnpm import resolves a lock
  // that no longer holds what upstream's npm lock does.
  before(() => {
    fx = makeFixture({
      targetChanges: {
        "quartz/build.ts": lines("// build", "export function build() {", "  return 2", "}"),
      },
      coreChanges: {
        "pnpm-workspace.yaml": PNPM_WORKSPACE + lines("overrides:", '  is-number: "npm:ms@2.1.3"'),
      },
    })
    res = fx.upgrade([`--ref=${fx.target}`])
  })
  after(() => fx.cleanup())

  test("fails when the converted lock does not match upstream's", () => {
    assert.equal(res.code, 1)
    assert.match(res.output, /does not match upstream's npm lock/)
    assert.match(res.output, /only in the npm lock:\n\s+is-number@7\.0\.0/)
    assert.match(res.output, /only in the pnpm lock:\n\s+ms@2\.1\.3/)
  })

  test("leaves Core, its lock and the pinned ref as they were", () => {
    assertUnchanged(fx)
  })
})

describe("an upgrade to the pinned ref", () => {
  let fx, res
  before(() => {
    fx = makeFixture({ coreChanges: { "quartz/plugins/types.ts": VENDORED_TYPES } })
    res = fx.upgrade([`--ref=${fx.pinned}`])
  })
  after(() => fx.cleanup())

  test("changes nothing: Core, its lock and the pinned ref stay as they are", () => {
    assert.equal(res.code, 0, res.output)
    assert.match(res.output, /1 hunk\(s\) re-applied, 0 absorbed/)
    assert.match(res.output, /Core: 0 file\(s\) written, 0 removed/)
    assert.equal(fx.status(), "")
    assert.equal(fx.read(MANIFEST), fx.git("show", `HEAD:${MANIFEST}`) + "\n")
  })
})

describe("a frozen install into Core that fails", () => {
  let fx, res, lock
  // Core's node_modules is a regular file (gitignored, so the tree is clean), so the install after
  // `write Core` cannot create it.
  before(() => {
    fx = makeFixture({
      targetChanges: {
        "quartz/build.ts": lines("// build", "export function build() {", "  return 2", "}"),
        "package.json": PINNED["package.json"].replace('"version": "5.0.0"', '"version": "5.1.0"'),
        "package-lock.json": PINNED["package-lock.json"].replaceAll(
          '"version": "5.0.0"',
          '"version": "5.1.0"',
        ),
      },
    })
    fs.writeFileSync(`${fx.root}/${CORE}/node_modules`, "not a directory\n")
    lock = fx.read(`${CORE}/pnpm-lock.yaml`)
    res = fx.upgrade([`--ref=${fx.target}`])
  })
  after(() => fx.cleanup())

  test("stops the upgrade, saying Core is restored", () => {
    assert.equal(res.code, 1)
    assert.match(res.output, /frozen install into Core failed\. Core's files are restored/)
  })

  test("leaves Core, its lock and the pinned ref as they were", () => {
    assert.equal(fx.status(), "")
    assert.equal(fx.read(`${CORE}/quartz/build.ts`), PINNED["quartz/build.ts"])
    assert.equal(fx.read(`${CORE}/package.json`), PINNED["package.json"])
    assert.equal(fx.read(`${CORE}/pnpm-lock.yaml`), lock)
    assert.equal(pinnedCommit(fx), fx.pinned)
  })
})

describe("a symbolic link upstream", () => {
  let fx, res
  before(() => {
    fx = makeFixture({
      targetChanges: {
        "quartz/static/icon.svg": lines("<svg/>"),
        "quartz/static/favicon.svg": { symlink: "icon.svg" },
      },
    })
    res = fx.upgrade([`--ref=${fx.target}`])
  })
  after(() => fx.cleanup())

  test("is recreated in Core as a link, not written as a file holding its target", () => {
    assert.equal(res.code, 0, res.output)
    const at = `${fx.root}/${CORE}/quartz/static/favicon.svg`
    assert.equal(fs.lstatSync(at).isSymbolicLink(), true)
    assert.equal(fs.readlinkSync(at), "icon.svg")
    assert.equal(fx.read(`${CORE}/quartz/static/favicon.svg`), lines("<svg/>"))
  })

  test("and an upgrade to the same ref leaves it alone", () => {
    fx.git("add", "-A")
    fx.git("-c", "user.name=t", "-c", "user.email=t@t", "commit", "--quiet", "-m", "upgrade")
    const again = fx.upgrade([`--ref=${fx.target}`])
    assert.equal(again.code, 0, again.output)
    assert.match(again.output, /Core: 0 file\(s\) written, 0 removed/)
  })
})
