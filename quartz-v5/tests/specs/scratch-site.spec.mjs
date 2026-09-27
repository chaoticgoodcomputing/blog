// The harness's scratch sites (tests/CONTEXT.md), which every plugin's specs build on: a cold build
// and a serve run left up take their content the same way, a link among the files included, and
// each leaves nothing behind once the spec is done with it. And the build lock they queue on
// (ADR-0004): a serve run stopped once it is up holds it until its server has gone, and it holds up
// no build once whatever took it has gone.
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { spawnSync } from "node:child_process"
import { test, expect } from "../harness/test.mjs"
import { BUILD_LOCK, VARIANTS, buildScratchSite, fixtureRoot, serveScratchSite } from "../harness/site.mjs"

// A folder of content outside the site, reached through a link, as an .mdx page's `node_modules` is.
let elsewhere
test.beforeAll(() => {
  elsewhere = fs.mkdtempSync(path.join(os.tmpdir(), "cgc-scratch-linked-"))
  fs.writeFileSync(path.join(elsewhere, "note.md"), "---\ntitle: Linked\n---\nReached through a link.\n")
})
test.afterAll(() => elsewhere && fs.rmSync(elsewhere, { recursive: true, force: true }))

const files = () => ({ "index.md": "# Home\n", linked: { symlink: elsewhere } })
const linkedPage = (site) => fs.readFileSync(path.join(site.public, "linked/note.html"), "utf8")

test("a cold build takes a link among its files, and is gone once removed", async () => {
  const site = await buildScratchSite("linked-build", files(), { keep: true })
  try {
    expect(site.code, site.output).toBe(0)
    expect(linkedPage(site)).toContain("Reached through a link.")
  } finally {
    site.remove()
  }
  expect(fs.existsSync(site.public)).toBe(false)
  expect(fs.existsSync(path.join(elsewhere, "note.md")), "the link's target is left alone").toBe(true)
})

test("a serve run left up takes a link among its files, and is gone once stopped", async () => {
  test.setTimeout(180_000)
  const site = await serveScratchSite("linked-serve", files())
  try {
    expect(linkedPage(site)).toContain("Reached through a link.")
  } finally {
    await site.stop()
  }
  expect(fs.existsSync(site.public)).toBe(false)
  expect(fs.existsSync(path.join(elsewhere, "note.md")), "the link's target is left alone").toBe(true)
})

// A worker that times out mid-build is stopped before it can let the lock go. The next build must not
// wait out the lock's five-minute limit for it.
test("a build lock left by a process that has exited holds up no build", async () => {
  test.setTimeout(120_000)
  const { pid } = spawnSync(process.execPath, ["-e", ""])
  // Take the lock as a build does, once no build holds it, and leave it held by the exited process.
  for (;;) {
    try {
      fs.mkdirSync(BUILD_LOCK)
      break
    } catch (err) {
      if (err.code !== "EEXIST") throw err
      await new Promise((tick) => setTimeout(tick, 50))
    }
  }
  fs.writeFileSync(path.join(BUILD_LOCK, String(pid)), "")
  const { code, output } = await buildScratchSite("orphaned-lock", { "index.md": "# Home\n" })
  expect(code, output).toBe(0)
})

const running = (pid) => {
  try {
    process.kill(pid, 0)
    return true
  } catch (err) {
    return err.code === "EPERM"
  }
}

// Serve's source watcher lives as long as its server, and another worker's build re-transpiles the
// Quartz source it watches: a serve run that is only started to be stopped keeps the lock until its
// server has exited.
test("a serve run stopped once it is up holds the build lock until its server has gone", async () => {
  test.setTimeout(180_000)
  // Watch the lock while this worker holds it: the processes it names besides this one are the
  // server's, and each must have exited by the time the lock is let go, which is at the latest
  // when the build has returned.
  const server = new Set()
  let held = false
  let aliveAtRelease
  const look = () => {
    let named
    try {
      named = fs.readdirSync(BUILD_LOCK).map(Number)
    } catch {
      named = []
    }
    if (named.includes(process.pid)) {
      held = true
      for (const pid of named) if (pid !== process.pid) server.add(pid)
    } else if (held && aliveAtRelease === undefined) {
      aliveAtRelease = [...server].filter(running)
    }
  }
  const watch = setInterval(look, 5)
  try {
    const { code, output } = await buildScratchSite("serve-lock", { "index.md": "# Home\n" }, { serve: true })
    expect(code, output).toBe(0)
    look()
  } finally {
    clearInterval(watch)
  }
  expect(server.size, "the lock named the server").toBeGreaterThan(0)
  expect(aliveAtRelease, "server processes still up when the lock was let go").toEqual([])
})

// Quartz links a local plugin into `.quartz/plugins/<name>` and never prunes the directory, so a
// plugin renamed or turned into a package (#93-#96) leaves a link in every root built before. Every
// build first removes such links (`pruneGonePlugins`, whose own cases are in
// utils/test/plugin-packages.test.mjs): the fixture roots global setup built hold none.
test("the fixture roots, as global setup built them, hold no link to a plugin that has gone", () => {
  for (const variant of VARIANTS) {
    const plugins = path.join(fixtureRoot(variant), ".quartz", "plugins")
    // The baseline turns every plugin of ours off, so Quartz may have installed nothing there.
    if (!fs.existsSync(plugins)) continue
    const gone = fs
      .readdirSync(plugins)
      .filter((name) => fs.lstatSync(path.join(plugins, name)).isSymbolicLink() && !fs.existsSync(path.join(plugins, name)))
    expect(gone, `${variant}: links to nowhere`).toEqual([])
  }
})
