// A synthetic, Quartz-shaped pair of repositories for testing the upgrade (#99) at its command line:
//
// - `upstream`: a git repo shaped like upstream Quartz, with two commits on branch `v5`, the pinned
//   commit and the target commit (the pinned tree with `targetChanges` applied);
// - `root`: a git repo shaped like this one, with Quartz Core at `quartz-v5/core/` vendored from the
//   pinned commit (its pruned files deleted, its pnpm files and site config added, `coreChanges`
//   applied) and `quartz-v5/upstream.json` pinning it, all committed.
//
// Everything lives in one temp dir the caller removes with `cleanup()`. The dependency set is one
// small package, `is-number@7.0.0`, so a lock conversion and an install take about a second from
// the pnpm store.
//
// Extension points (#100): `targetChanges` can change any upstream file at the target commit (the
// default config, the schema, the `quartz.ts` template, `package.json`); `siteChanges` adds or
// replaces files in the site repo outside Core, such as a plugin's `package.json` with a peer range.
import { execFileSync, spawnSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const UTILS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..")
export const UPGRADE_CLI = path.join(UTILS, "upgrade.mjs")

const CORE_REL = "quartz-v5/core"

/** Lines of text as a file, so a test can change one line and leave the rest as context. */
export const lines = (...ls) => ls.join("\n") + "\n"

const PACKAGE_JSON = (version) =>
  JSON.stringify(
    {
      name: "@fixture/quartz",
      private: true,
      version,
      type: "module",
      bin: { quartz: "./quartz/bootstrap-cli.mjs" },
      engines: { node: ">=22" },
      dependencies: { "is-number": "^7.0.0" },
    },
    null,
    2,
  ) + "\n"

const PACKAGE_LOCK = (version) =>
  JSON.stringify(
    {
      name: "@fixture/quartz",
      version,
      lockfileVersion: 3,
      requires: true,
      packages: {
        "": { name: "@fixture/quartz", version, dependencies: { "is-number": "^7.0.0" } },
        "node_modules/is-number": {
          version: "7.0.0",
          resolved: "https://registry.npmjs.org/is-number/-/is-number-7.0.0.tgz",
          integrity:
            "sha512-41Cifkg6e8TylSpdtTpeLVMqvSBEVzTttHvERD741+pnZ8ANv0004MRL43QKPDlK9cGvNp6NZWZUBlbGXYxxng==",
          license: "MIT",
          engines: { node: ">=0.12.0" },
        },
      },
    },
    null,
    2,
  ) + "\n"

/** `pnpm import` of `PACKAGE_LOCK`, under `PNPM_WORKSPACE`, byte for byte. */
export const PNPM_LOCK = `lockfileVersion: '9.0'

settings:
  autoInstallPeers: false
  excludeLinksFromLockfile: false

importers:

  .:
    dependencies:
      is-number:
        specifier: ^7.0.0
        version: 7.0.0

packages:

  is-number@7.0.0:
    resolution: {integrity: sha512-41Cifkg6e8TylSpdtTpeLVMqvSBEVzTttHvERD741+pnZ8ANv0004MRL43QKPDlK9cGvNp6NZWZUBlbGXYxxng==}
    engines: {node: '>=0.12.0'}

snapshots:

  is-number@7.0.0: {}
`

/** Core's pnpm settings, as the real Core has them (no build scripts to allow here). */
export const PNPM_WORKSPACE = lines(
  "packages:",
  '  - "."',
  "nodeLinker: hoisted",
  "autoInstallPeers: false",
)

/** Upstream's tree at the pinned commit, by path. Every tier is represented. */
export const PINNED = {
  // Core source
  "quartz/bootstrap-cli.mjs": lines("#!/usr/bin/env node", 'console.log("quartz")'),
  "quartz/build.ts": lines("// build", "export function build() {", "  return 1", "}"),
  "quartz/plugins/types.ts": lines(
    "// plugin types",
    "export interface PageType {",
    "  name: string",
    "  generate(): string",
    "}",
    "",
    "export interface Emitter {",
    "  name: string",
    "  emit(): void",
    "}",
    "",
    "export interface Frame {",
    "  name: string",
    "}",
  ),
  "quartz/util/path.ts": lines(
    "export const slug = (s: string) => s",
    "export const join = (a: string, b: string) => a + b",
  ),
  // Scaffolding
  "package.json": PACKAGE_JSON("5.0.0"),
  "tsconfig.json": lines("{", '  "compilerOptions": { "strict": true }', "}"),
  "globals.d.ts": lines("export {}"),
  "index.d.ts": lines("export {}"),
  ".gitignore": lines(".quartz-cache", "node_modules", "public"),
  ".prettierignore": lines("public"),
  ".prettierrc": lines("{}"),
  "LICENSE.txt": lines("MIT License"),
  // Steering file: upstream's template
  "quartz.ts": lines(
    'import { loadQuartzLayout } from "./quartz/plugins/loader"',
    "export default loadQuartzLayout()",
  ),
  // Pruned files
  "package-lock.json": PACKAGE_LOCK("5.0.0"),
  "quartz.config.default.yaml": lines("configuration:", "  pageTitle: Quartz", "plugins: []"),
  "README.md": lines("# Quartz"),
  "docs/index.md": lines("# Docs"),
  ".github/workflows/ci.yaml": lines("on: push"),
  Dockerfile: lines("FROM node:22"),
  ".node-version": lines("22"),
  ".npmrc": lines("engine-strict=true"),
  "content/.gitkeep": "",
}

const PRUNED_IN_FIXTURE = [
  "package-lock.json",
  "quartz.config.default.yaml",
  "README.md",
  "docs/index.md",
  ".github/workflows/ci.yaml",
  "Dockerfile",
  ".node-version",
  ".npmrc",
  "content/.gitkeep",
]

/** The site config: a steering file of ours, which upstream does not ship. */
export const SITE_CONFIG = lines(
  "configuration:",
  "  pageTitle: Fixture Site",
  "plugins:",
  "  - source: github:quartz-community/explorer",
)

const GIT_ID = [
  "-c",
  "user.name=Fixture",
  "-c",
  "user.email=fixture@example.com",
  "-c",
  "commit.gpgsign=false",
  "-c",
  "init.defaultBranch=main",
]

const git = (cwd, ...args) =>
  execFileSync("git", [...GIT_ID, "-C", cwd, ...args], { encoding: "utf-8", stdio: "pipe" }).trim()

/** Write `files` (path → content, or null to delete) under `dir`. */
export function writeFiles(dir, files) {
  for (const [rel, content] of Object.entries(files)) {
    const at = path.join(dir, rel)
    if (content === null) {
      fs.rmSync(at, { force: true })
      continue
    }
    fs.mkdirSync(path.dirname(at), { recursive: true })
    fs.writeFileSync(at, content)
    if (rel.endsWith(".mjs") && content.startsWith("#!")) fs.chmodSync(at, 0o755)
  }
}

const commitAll = (dir, message) => {
  git(dir, "add", "-A")
  git(dir, "commit", "--quiet", "--allow-empty", "-m", message)
  return git(dir, "rev-parse", "HEAD")
}

/**
 * Make the pair of repos. Returns `{ dir, root, upstream, pinned, target, upgrade, read, exists,
 * status, cleanup }`, where `upgrade(args, env)` runs the upgrade's command line against them.
 *
 * - `targetChanges`: upstream files at the target commit, by path (null deletes one);
 * - `coreChanges`: Core's files, by path relative to Core's root (null deletes one), committed;
 * - `siteChanges`: other files of the site repo, by path relative to its root, committed.
 */
export function makeFixture({ targetChanges = {}, coreChanges = {}, siteChanges = {} } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "quartz-upgrade-fixture-"))
  const upstream = path.join(dir, "upstream")
  const root = path.join(dir, "site")

  fs.mkdirSync(upstream)
  git(upstream, "init", "--quiet", "--initial-branch=v5")
  writeFiles(upstream, PINNED)
  const pinned = commitAll(upstream, "pinned")
  writeFiles(upstream, targetChanges)
  const target = commitAll(upstream, "target")

  fs.mkdirSync(root)
  git(root, "init", "--quiet")
  const core = path.join(root, CORE_REL)
  writeFiles(core, PINNED)
  writeFiles(core, Object.fromEntries(PRUNED_IN_FIXTURE.map((rel) => [rel, null])))
  writeFiles(core, {
    "pnpm-workspace.yaml": PNPM_WORKSPACE,
    "pnpm-lock.yaml": PNPM_LOCK,
    "quartz.config.yaml": SITE_CONFIG,
    ...coreChanges,
  })
  writeFiles(root, {
    ".gitignore": lines("node_modules/", "quartz-v5/.upstream-cache/"),
    "quartz-v5/upstream.json":
      JSON.stringify(
        {
          repo: upstream,
          branch: "v5",
          commit: pinned,
          version: "5.0.0",
          vendoredOn: "2026-01-01",
        },
        null,
        2,
      ) + "\n",
    ...siteChanges,
  })
  commitAll(root, "vendor Quartz Core at the pinned commit")

  return {
    dir,
    root,
    upstream,
    pinned,
    target,
    /** Run the upgrade's command line against this fixture: `{ code, stdout, stderr, output }`. */
    upgrade(args = [], env = {}) {
      const res = spawnSync(
        "node",
        [UPGRADE_CLI, `--root=${root}`, `--upstream=${upstream}`, ...args],
        {
          encoding: "utf-8",
          env: { ...process.env, npm_config_offline: "true", ...env },
        },
      )
      return {
        code: res.status,
        stdout: res.stdout,
        stderr: res.stderr,
        output: res.stdout + res.stderr,
      }
    },
    /** A file of the site repo, by path relative to its root. */
    read: (rel) => fs.readFileSync(path.join(root, rel), "utf-8"),
    exists: (rel) => fs.existsSync(path.join(root, rel)),
    /** `git status --porcelain` of the site repo. */
    status: () => git(root, "status", "--porcelain"),
    git: (...args) => git(root, ...args),
    cleanup: () => fs.rmSync(dir, { recursive: true, force: true }),
  }
}
