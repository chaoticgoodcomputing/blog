// `utils/prebuild.mjs`, run before the real site's build and serve: upstream's default config is
// pruned from Core, so a build with no site config (`core/quartz.config.yaml`) would have nothing to
// fall back on, and prebuild refuses, loudly, before Quartz runs (#89, Story 7). The site-config repo
// guard checks the config too, but build and serve don't depend on the guards: this is the refusal on
// the build path.
//
// Each case runs a copy of prebuild and the utils it imports in a scratch repo shaped as they expect,
// `quartz-v5/utils/` beside `quartz-v5/core/`, whose Core links the real Core's `node_modules` for
// its YAML parser. The refusal comes before
// prebuild installs or builds anything, so nothing else is needed.
import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import { scratch } from "./guard-helpers.mjs"

const utils = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const coreModules = path.resolve(utils, "..", "core", "node_modules")

/** Run a copy of prebuild whose Core holds `config` as its site config (none when undefined). */
function prebuild(config) {
  const root = path.join(scratch("prebuild-"), "quartz-v5")
  fs.mkdirSync(path.join(root, "utils"), { recursive: true })
  for (const file of ["prebuild.mjs", "plugin-packages.mjs", "packages.mjs", "core-tiers.mjs"]) {
    fs.copyFileSync(path.join(utils, file), path.join(root, "utils", file))
  }
  fs.mkdirSync(path.join(root, "core"))
  fs.writeFileSync(path.join(root, "core", "package.json"), "{}")
  fs.symlinkSync(coreModules, path.join(root, "core", "node_modules"))
  if (config !== undefined) fs.writeFileSync(path.join(root, "core", "quartz.config.yaml"), config)
  const { status, stdout, stderr } = spawnSync(process.execPath, [path.join(root, "utils", "prebuild.mjs")], { encoding: "utf-8" })
  return { code: status, out: `${stdout}${stderr}` }
}

for (const [what, config, reason] of [
  ["a missing site config", undefined, /is missing/],
  ["an empty site config", "", /not a config with a plugins list/],
  ["a site config with no plugins list", "configuration:\n  pageTitle: Site\n", /not a config with a plugins list/],
  ["a site config whose plugins is not a list", "plugins: {}\n", /not a config with a plugins list/],
]) {
  test(`prebuild refuses to build with ${what}`, () => {
    const { code, out } = prebuild(config)
    assert.equal(code, 1, out)
    assert.match(out, /No site config/)
    assert.match(out, reason)
    assert.match(out, /Refusing to build/)
  })
}
