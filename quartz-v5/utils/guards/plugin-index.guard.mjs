// Repo guard: Quartz's generated plugin index takes in every plugin of ours (#89, #93-#96).
//
// Quartz's own plugin install step, Core's `install-plugins` script, regenerates the plugin index,
// `.quartz/plugins/index.ts`, from which a TypeScript layout override imports a plugin's exports: what
// a downstream TypeScript site reads. For a package source it resolves the package from Core, as a
// site does, and reads its exports from `dist/index.d.ts`, skipping with only a warning a package it
// cannot resolve or that has none. So the guard runs that script, from Core as installed, in a scratch
// root whose config lists every plugin and site plugin of ours by package name, and then:
//   - it skips none of them;
//   - the index exports from every plugin (`export { … } from "<package>"`, or `export type`). It
//     checks that some export line is there, not which names it lists; the TypeScript-site spec
//     (tests/specs/package-plugins.spec.mjs) reads the graph's types through it. A site plugin need
//     only not be skipped: Core leaves out of the index any value name two packages export, and
//     site-styles' `emitter` and `transformer` share their names with quartz-tags', so on the full
//     list site-styles has no export line. Only the site imports a site plugin, by its package.
// This reads built output: an unbuilt package is skipped.
//
//   node quartz-v5/utils/guards/plugin-index.guard.mjs [--repo <dir>]
//
// The packages are read from `--repo`, and Core is always the real repo's, as it must be installed.
// Test and how to break it by hand: utils/test/guard-plugin-index.test.mjs.
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { spawnSync } from "node:child_process"
import { CORE_REL, REPO_ROOT } from "../core-tiers.mjs"
import { ourPackages } from "../packages.mjs"
import { CannotCheck, guard, option } from "./guard.mjs"

const core = path.join(REPO_ROOT, CORE_REL)
const INSTALL = path.join(core, "quartz", "plugins", "loader", "install-plugins.ts")
const tsx = path.join(core, "node_modules", ".bin", "tsx")
const escape = (text) => text.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")

await guard(import.meta, "Quartz's generated plugin index takes in every plugin of ours", (argv) => {
  const repo = path.resolve(option(argv, "repo", REPO_ROOT))
  if (!fs.existsSync(tsx)) throw new CannotCheck(`Quartz Core is not installed (${tsx}): pnpm nx run site-v5:install`)
  const packages = ourPackages(repo, ["plugin", "site-plugin"])
  if (packages.length === 0) throw new CannotCheck(`no plugins under ${repo}`)

  const root = fs.mkdtempSync(path.join(os.tmpdir(), "plugin-index-"))
  try {
    const config = ["plugins:", ...packages.flatMap(({ pkg }) => [`  - source: "${pkg.name}"`, "    enabled: true"]), ""]
    fs.writeFileSync(path.join(root, "quartz.config.yaml"), config.join("\n"))
    const { status, stdout, stderr } = spawnSync(tsx, [INSTALL], { cwd: root, encoding: "utf-8" })
    const printed = `${stdout}${stderr}`
    if (status !== 0) throw new CannotCheck(`Core's install-plugins exited ${status}:\n${printed.trim()}`)
    const index = fs.readFileSync(path.join(root, ".quartz", "plugins", "index.ts"), "utf-8")

    const violations = []
    for (const { kind, rel, pkg } of packages) {
      const skipped = printed.match(new RegExp(`Skipping npm package ${escape(pkg.name)}: (.*)`))
      if (skipped) violations.push(`${rel}: Quartz's plugin install skips ${pkg.name}: ${skipped[1].trim()}`)
      const exported = new RegExp(`^export (type )?\\{ [^}]+ \\} from "${escape(pkg.name)}"$`, "m")
      if (kind === "plugin" && !exported.test(index)) violations.push(`${rel}: the plugin index exports nothing from "${pkg.name}"`)
    }
    return violations
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})
