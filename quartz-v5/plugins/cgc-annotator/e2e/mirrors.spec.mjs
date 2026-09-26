// ADR 0001: each annotation page's source document is fetched once, pinned in a cache and emitted
// as a mirror named by a hash of its URL. A document that can't be fetched costs a warning, never
// the build. The source documents come from a local host each test starts, and every test pins
// into a cache of its own.
import fs from "node:fs"
import path from "node:path"
import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import { test, expect } from "../../../tests/harness/test.mjs"
import { editConfig, fixtureConfig, fixtureRoot, pluginEntries, testsRoot, vendored } from "../../../tests/harness/site.mjs"
import { HANG, closedPort, pdf, sourceHost } from "../../../tests/harness/source-host.mjs"

const ANNOTATOR = "../../plugins/cgc-annotator"

// The mirror name a URL must get, written out independently of the plugin's own rule.
const expectedName = (url) => createHash("sha256").update(new URL(url).href).digest("hex").slice(0, 16)

const annotationPage = (target) => `---\ntitle: Annotated\nannotation-target: ${target}\n---\n\nNotes on the source document.\n`

// The fixture config, with the plugin's options set for one test.
const config = (options) => editConfig(fixtureConfig(), (doc, entry) => entry(ANNOTATOR).set("options", doc.createNode(options)))

// A scratch site with the plugin's options set, removed when the test that built it ends.
async function build(scratch, name, files, options) {
  const site = await scratch.site(name, { "index.md": "# home\n", ...files }, { config: config(options) })
  expect(site.code, site.output).toBe(0)
  const dir = path.join(site.public, options.mirrorDir)
  const mirrors = fs.existsSync(dir) ? fs.readdirSync(dir) : []
  return { ...site, mirrors, read: (name) => fs.readFileSync(path.join(dir, name), "utf8") }
}

test("each source document is emitted once, as a mirror named by a hash of its URL", async ({ scratch }) => {
  // Three URLs serving the same bytes, so a name taken from the content would collide. One of them
  // redirects to a path no page names, so its mirror must be named after the URL the page gave.
  const host = await sourceHost({
    "/a/paper.pdf": pdf("paper"),
    "/b/paper.pdf": pdf("paper"),
    "/c/paper.pdf": pdf("paper"),
    "/moved.pdf": { redirect: "/c/paper.pdf" },
  })
  try {
    const options = { mirrorDir: "mirrors", cacheDir: scratch.dir("annotator-cache") }
    const site = await build(scratch, "mirror", {
      "one.md": annotationPage(host.url("/a/paper.pdf")),
      // The same URL, spelled another way: one URL, so one mirror.
      "same-source.md": annotationPage(host.url("/a/./paper.pdf").replace("http:", "HTTP:")),
      "other-source.md": annotationPage(host.url("/b/paper.pdf")),
      "moved.md": annotationPage(host.url("/moved.pdf")),
      // Obsidian's Annotator leaves the key empty on a note it hasn't been pointed at yet.
      "empty.md": "---\ntitle: Empty\nannotation-target:\n---\n\nAn ordinary note.\n",
    }, options)
    expect(site.output).not.toContain("cgc-annotator")

    // The name is the contract the Viewer finds its mirror by (docs/adr/0001): the first 16 hex
    // digits of the SHA-256 of the URL's normal form. No extension, and nothing of the URL itself.
    expect(site.mirrors.sort()).toEqual(
      ["/a/paper.pdf", "/b/paper.pdf", "/moved.pdf"].map((route) => expectedName(host.url(route))).sort(),
    )
    // One mirror per URL a page names, however many pages name it: fetched once, and a
    // byte-for-byte copy of what the URL leads to.
    expect(["/a/paper.pdf", "/b/paper.pdf", "/moved.pdf", "/c/paper.pdf"].map(host.hits)).toEqual([1, 1, 1, 1])
    for (const name of site.mirrors) expect(site.read(name)).toBe(pdf("paper"))

    // The name depends on the URL alone: another site, with a cache of its own, names it the same.
    const again = await build(scratch, "mirror-again", { "other-source.md": annotationPage(host.url("/b/paper.pdf")) }, { ...options, cacheDir: scratch.dir("annotator-cache") })
    expect(again.mirrors).toEqual([expectedName(host.url("/b/paper.pdf"))])
  } finally {
    await host.close()
  }
})

test("a second build reuses the pinned mirror without fetching the source again", async ({ scratch }) => {
  // The document changes at its source after the first fetch. The annotations were written against
  // the first copy, so that's the one to keep serving.
  let served = 0
  const host = await sourceHost({ "/paper.pdf": () => ({ body: pdf(`edition ${++served}`) }) })
  try {
    const options = { mirrorDir: "mirrors", cacheDir: scratch.dir("annotator-cache") }
    const files = { "paper.md": annotationPage(host.url("/paper.pdf")) }
    const first = await build(scratch, "pin", files, options)
    expect(first.mirrors).toHaveLength(1)
    expect(first.read(first.mirrors[0])).toBe(pdf("edition 1"))

    const second = await build(scratch, "pin-again", files, options)
    expect(host.hits("/paper.pdf")).toBe(1)
    expect(second.mirrors).toEqual(first.mirrors)
    expect(second.read(second.mirrors[0])).toBe(pdf("edition 1"))
    expect(second.output).not.toContain("cgc-annotator")
  } finally {
    await host.close()
  }
})

test("a source document that can't be fetched logs a warning, and the build succeeds", async ({ scratch }) => {
  const host = await sourceHost({
    "/paper.pdf": pdf("paper"),
    "/bot-check.pdf": () => ({ body: "<!doctype html><title>Just a moment...</title>", type: "text/html" }),
    "/slow.pdf": HANG,
  })
  try {
    const unreachable = {
      "gone.md": host.url("/gone.pdf"),
      "refused.md": `http://127.0.0.1:${await closedPort()}/paper.pdf`,
      "not-a-pdf.md": host.url("/bot-check.pdf"),
      "hangs.md": host.url("/slow.pdf"),
      "not-a-url.md": "papers/paper.pdf",
    }
    const site = await build(
      scratch,
      "unreachable",
      {
        "paper.md": annotationPage(host.url("/paper.pdf")),
        ...Object.fromEntries(Object.entries(unreachable).map(([page, target]) => [page, annotationPage(target)])),
      },
      { mirrorDir: "mirrors", cacheDir: scratch.dir("annotator-cache"), fetchTimeout: 1000 },
    )
    // Each one is named in a warning, with the page that wanted it.
    const warnings = site.output.split("\n").filter((line) => line.includes("cgc-annotator"))
    for (const [page, target] of Object.entries(unreachable)) {
      expect(warnings.find((line) => line.includes(target) && line.includes(page)), `${page}: ${target}`).toBeDefined()
    }
    // The one that could be fetched still is.
    expect(site.mirrors).toHaveLength(1)
    expect(site.read(site.mirrors[0])).toBe(pdf("paper"))
  } finally {
    await host.close()
  }
})

test("a failed fetch pins nothing: the next build tries again", async ({ scratch }) => {
  const routes = {}
  const host = await sourceHost(routes)
  try {
    const options = { mirrorDir: "mirrors", cacheDir: scratch.dir("annotator-cache") }
    const files = { "paper.md": annotationPage(host.url("/paper.pdf")) }
    expect((await build(scratch, "retry", files, options)).mirrors).toEqual([])

    routes["/paper.pdf"] = pdf("back")
    const site = await build(scratch, "retry-again", files, options)
    expect(site.mirrors).toHaveLength(1)
    expect(site.read(site.mirrors[0])).toBe(pdf("back"))
  } finally {
    await host.close()
  }
})

test("a copy pinned by hand, where the warning says, is served in place of a fetch", async ({ scratch }) => {
  // A host the build can't get the document from: behind a bot check, say.
  const host = await sourceHost({ "/paper.pdf": () => ({ body: "<title>Client Challenge</title>", type: "text/html" }) })
  try {
    const options = { mirrorDir: "mirrors", cacheDir: scratch.dir("annotator-cache") }
    const files = { "paper.md": annotationPage(host.url("/paper.pdf")) }
    const first = await build(scratch, "by-hand", files, options)
    expect(first.mirrors).toEqual([])
    const [, where] = first.output.match(/save it as (\S+?)\.?$/m) ?? []
    expect(where, first.output).toBeDefined()

    fs.writeFileSync(where, pdf("saved by hand"))
    const second = await build(scratch, "by-hand-again", files, options)
    expect(host.hits("/paper.pdf")).toBe(1)
    expect(second.mirrors).toHaveLength(1)
    expect(second.read(second.mirrors[0])).toBe(pdf("saved by hand"))
  } finally {
    await host.close()
  }
})

test("the fixture site pins into a cache of its own, never the real site's", () => {
  // A fixture root symlinks the vendored install's `node_modules`, so the default cache directory
  // there is the one the real site builds pin into.
  const { options = {} } = pluginEntries(fixtureConfig()).find(({ source }) => source === ANNOTATOR)
  const cache = path.resolve(fixtureRoot("main"), options.cacheDir ?? "node_modules/.cache/cgc-annotator")
  // Where writing there really lands, through any symlink on the way.
  let existing = cache
  while (!fs.existsSync(existing)) existing = path.dirname(existing)
  const lands = path.join(fs.realpathSync(existing), path.relative(existing, cache))
  expect(path.relative(fs.realpathSync(vendored), lands).startsWith(".."), lands).toBe(true)
  const repo = path.resolve(testsRoot, "../..")
  const probe = path.relative(repo, path.join(lands, "0123456789abcdef"))
  expect(() => execFileSync("git", ["check-ignore", "-q", probe], { cwd: repo }), `${probe} is ignored`).not.toThrow()
})
