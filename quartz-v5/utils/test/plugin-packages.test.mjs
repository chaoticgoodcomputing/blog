// `pruneGonePlugins` (utils/plugin-packages.mjs): Quartz links a local plugin into
// `<root>/.quartz/plugins/<name>` and never prunes the directory, so the real site's prebuild and the
// e2e harness remove, before every build, each link whose plugin has gone and each link into
// `plugins/` or `site-plugins/`, left from a root built while that plugin was local (#94, #96).
// These cases call it on a temp root; that prebuild and the harness call it is theirs to say.
import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { pruneGonePlugins } from "../plugin-packages.mjs"

const v5 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..")

function tempRoot(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "cgc-prune-"))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const plugins = path.join(root, ".quartz", "plugins")
  fs.mkdirSync(plugins, { recursive: true })
  return { root, plugins }
}

test("pruneGonePlugins removes the links in .quartz/plugins/ whose plugin has gone, and leaves the rest", (t) => {
  const { root, plugins } = tempRoot(t)
  const live = fs.mkdtempSync(path.join(os.tmpdir(), "cgc-prune-live-"))
  t.after(() => fs.rmSync(live, { recursive: true, force: true }))
  fs.writeFileSync(path.join(live, "package.json"), "{}")
  fs.mkdirSync(path.join(plugins, "git-installed"))
  fs.symlinkSync(path.join(root, "gone"), path.join(plugins, "cgc-gone"))
  fs.symlinkSync(live, path.join(plugins, "cgc-live"))

  pruneGonePlugins(root)

  assert.deepEqual(fs.readdirSync(plugins).sort(), ["cgc-live", "git-installed"])
  assert.ok(fs.existsSync(path.join(live, "package.json")), "a live link's target is left alone")
})

test("pruneGonePlugins removes links to a plugin of ours, now a package, and keeps a fixture plugin's", (t) => {
  const { root, plugins } = tempRoot(t)
  fs.symlinkSync(path.join(v5, "site-plugins", "site-styles"), path.join(plugins, "site-styles"))
  fs.symlinkSync(path.relative(plugins, path.join(v5, "plugins", "quartz-graph")), path.join(plugins, "cgc-graph"))
  fs.symlinkSync(path.join(v5, "tests", "fixture-plugins", "fixture-consumer"), path.join(plugins, "fixture-consumer"))

  pruneGonePlugins(root)

  assert.deepEqual(fs.readdirSync(plugins), ["fixture-consumer"])
  assert.ok(fs.existsSync(path.join(v5, "site-plugins", "site-styles", "package.json")), "a link's target is left alone")
})

test("pruneGonePlugins leaves a root with no plugins installed yet alone", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "cgc-prune-"))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  assert.doesNotThrow(() => pruneGonePlugins(root))
  assert.deepEqual(fs.readdirSync(root), [])
})
