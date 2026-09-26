// The real-site acceptance report (tests/CONTEXT.md, the second seam): what it prints and how it
// exits, for a pair of built sites. Most tests hand it small v4-shaped and v5-shaped sites written
// here, whose heads copy what each Quartz renders. The last builds a few vault-shaped pages under
// both Quartz versions, to prove the report reads their real output. Building the real vault is the
// `site-v5-e2e:acceptance` target's job.
//
// The report renders nothing, so it runs in one colour-scheme project only.
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { test, expect } from "../harness/test.mjs"
import { buildScratchSite, siteConfig, testsRoot } from "../harness/site.mjs"
import { ALLOWLIST, checkAllowlist } from "../acceptance/allowlist.mjs"

const run = promisify(execFile)
const ORIGIN = "https://blog.chaoticgood.computer"
const REPORT = path.join(testsRoot, "acceptance/report.mjs")
const repoRoot = path.resolve(testsRoot, "../..")

test.skip(({ colorScheme }) => colorScheme === "dark", "the report has no colour scheme")

// What the file made, removed once its tests are done.
const scratch = []
test.afterAll(() => scratch.forEach((remove) => remove()))
const tempDir = (name) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `cgc-acceptance-${name}-`))
  scratch.push(() => fs.rmSync(dir, { recursive: true, force: true }))
  return dir
}

// Whether the temp directory's filesystem tells `a` from `A`. Where it doesn't (macOS by default),
// a case redirect and its target would be one file, so alias-redirects emits none (#23).
const caseSensitive = (() => {
  const dir = tempDir("case")
  fs.writeFileSync(path.join(dir, "a"), "")
  return !fs.existsSync(path.join(dir, "A"))
})()

/** A page's HTML, with a head in the shape Quartz renders (Preact's self-closing tags). */
function page({ title = "A page", robots, canonical, article = [], jsonld, refresh, styles = [] } = {}) {
  const head = [
    `<title>${title}</title>`,
    `<meta charset="utf-8"/>`,
    robots && `<meta name="robots" content="${robots}"/>`,
    ...article.map(([property, content]) => `<meta property="article:${property}" content="${content}"/>`),
    canonical && `<link rel="canonical" href="${canonical}"/>`,
    jsonld && `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>`,
    refresh && `<meta http-equiv="refresh" content="0; url=${refresh}"/>`,
    ...styles.map((css) => `<style>${css}</style>`),
  ]
  return `<!DOCTYPE html><html lang="en-us"><head>${head.filter(Boolean).join("")}</head><body><article><p>${title}</p></article></body></html>`
}
const sitemap = (paths) =>
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths
    .map((p) => `<url><loc>${ORIGIN}${p}</loc><lastmod>2024-01-01T00:00:00.000Z</lastmod></url>`)
    .join("")}</urlset>`
// A feed of `items`, newest first: each a URL path, or `{ url, date, description }` for an item with
// its date and description as cgc-seo and v4 write them.
const rss = (items) =>
  `<?xml version="1.0" encoding="UTF-8" ?><rss version="2.0"><channel><title>Site</title><link>${ORIGIN}</link>${items
    .map((item) => (typeof item === "string" ? { url: item } : item))
    .map(
      ({ url, date, description }) =>
        `<item><title>${url}</title><link>${ORIGIN}${url}</link><guid>${ORIGIN}${url}</guid>${
          description === undefined ? "" : `<description><![CDATA[ ${description} ]]></description>`
        }${date ? `<pubDate>${new Date(date).toUTCString()}</pubDate>` : ""}</item>`,
    )
    .join("")}</channel></rss>`

/** A built site on disk: `files` maps output paths to their text. */
function site(name, files) {
  const root = tempDir(name)
  for (const [file, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
    fs.writeFileSync(path.join(root, file), text)
  }
  return root
}

// An article as both Quartz versions render it, and the rest of a minimal site around it.
const ARTICLE = {
  title: "An article",
  canonical: `${ORIGIN}/content/articles/an-article`,
  article: [
    ["published_time", "2024-01-01T00:00:00.000Z"],
    ["tag", "python"],
  ],
  jsonld: { "@context": "https://schema.org", "@type": "Article", headline: "An article", url: `${ORIGIN}/content/articles/an-article` },
}
const BASE = {
  "index.html": page({ title: "Home", canonical: `${ORIGIN}/` }),
  "content/articles/an-article.html": page(ARTICLE),
  "assets/photo.png": "png",
  "sitemap.xml": sitemap(["/", "/content/articles/an-article"]),
  "index.xml": rss(["/content/articles/an-article"]),
}

// Runs the report on two built sites. `vault` is the content they were built from, which some
// allowlist entries consult; an empty one unless a test needs files in it.
async function report(v4, v5, { vault = tempDir("vault"), args = [] } = {}) {
  const out = tempDir("out")
  try {
    const { stdout } = await run("node", [REPORT, "--v4", v4, "--v5", v5, "--vault", vault, "--origin", ORIGIN, "--out", out, "--full", ...args])
    return { code: 0, stdout, json: JSON.parse(fs.readFileSync(path.join(out, "report.json"), "utf8")) }
  } catch (err) {
    const json = fs.existsSync(path.join(out, "report.json")) ? JSON.parse(fs.readFileSync(path.join(out, "report.json"), "utf8")) : null
    return { code: err.code, stdout: `${err.stdout}${err.stderr}`, json }
  }
}

test("passes when the two sites serve the same URLs, feeds and head metadata", async () => {
  const result = await report(site("v4", BASE), site("v5", BASE))
  expect(result.code, result.stdout).toBe(0)
  expect(result.json.failing).toEqual([])
})

test("fails, naming the URL, when v5 no longer serves a page or file v4 did", async () => {
  const v4 = site("v4", { ...BASE, "content/notes/gone.html": page({ title: "Gone" }), "assets/old.pdf": "pdf" })
  const result = await report(v4, site("v5", BASE))
  expect(result.code, result.stdout).toBe(1)
  expect(result.stdout).toContain("/content/notes/gone")
  expect(result.stdout).toContain("/assets/old.pdf")
})

test("fails on a URL v5 serves that v4 did not", async () => {
  const result = await report(site("v4", BASE), site("v5", { ...BASE, "content/notes/new.html": page({ title: "New" }) }))
  expect(result.code, result.stdout).toBe(1)
  expect(result.stdout).toContain("/content/notes/new")
})

test("fails on sitemap and RSS membership that v5 changes", async () => {
  const v5 = site("v5", { ...BASE, "sitemap.xml": sitemap(["/"]), "index.xml": rss(["/content/articles/an-article", "/"]) })
  const result = await report(site("v4", BASE), v5)
  expect(result.code, result.stdout).toBe(1)
  expect(result.json.failing).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ area: "sitemap", change: "removed", url: "/content/articles/an-article" }),
      expect.objectContaining({ area: "rss", change: "added", url: "/" }),
    ]),
  )
})

test("fails on every kind of head metadata v5 changes: noindex, canonical, article:* and JSON-LD", async () => {
  const v5 = site("v5", {
    ...BASE,
    "content/articles/an-article.html": page({
      ...ARTICLE,
      robots: "noindex",
      canonical: `${ORIGIN}/content/articles/elsewhere`,
      article: [["published_time", "2024-01-01T00:00:00.000Z"]],
      jsonld: { ...ARTICLE.jsonld, "@type": "BlogPosting" },
    }),
  })
  const result = await report(site("v4", BASE), v5)
  expect(result.code, result.stdout).toBe(1)
  const fields = result.json.failing.filter((d) => d.area === "head").map((d) => d.field)
  expect(fields.sort()).toEqual(["article:tag", "canonical", "jsonld.@type", "robots"])
  expect(result.stdout).toContain("jsonld.@type")
})

// The site's stack declaration as site-styles emits it (#64): every top-level layer, the site last.
const STACK = "@layer quartz-base, cgc, site; @layer site { p { margin: 0 } }"

test("fails on a v5 page whose cascade layers don't rank as the site's stack declares", async () => {
  const v4 = site("v4", { ...BASE, "404.html": page({ title: "404" }) })
  const v5 = site("v5", {
    ...BASE,
    "index.html": page({ title: "Home", canonical: `${ORIGIN}/`, styles: [STACK] }),
    // A plugin's layer the stack doesn't name ranks above the site.
    "content/articles/an-article.html": page({ ...ARTICLE, styles: [STACK, "@layer stray { p { padding: 0 } }"] }),
    // No stack declaration at all: site-styles is missing.
    "404.html": page({ title: "404", styles: ["@layer cgc { p { padding: 0 } }"] }),
  })
  const result = await report(v4, v5)
  expect(result.code, result.stdout).toBe(1)
  expect(result.json.sites.v5.layers).toEqual(expect.objectContaining({ sets: 3, pages: 3 }))
  expect(result.json.failing).toEqual([
    expect.objectContaining({ area: "layers", url: "/404", declared: null, ranked: ["cgc"] }),
    expect.objectContaining({ area: "layers", url: "/content/articles/an-article", declared: ["quartz-base", "cgc", "site"], ranked: ["quartz-base", "cgc", "site", "stray"] }),
  ])
  expect(result.stdout).toContain("stray")
})

test("allows the differences the map expects, citing the ticket that decided each", async () => {
  const v4 = site("v4", {
    ...BASE,
    // #23: a mixed-case page, lowercased in v5.
    "content/notes/Weekly-W06.html": page({ title: "W06", canonical: `${ORIGIN}/content/notes/Weekly-W06` }),
    // #42: a folder page.
    "content/notes/index.html": page({ title: "Folder: content/notes | Spencer Elkington", canonical: `${ORIGIN}/content/notes/` }),
    // #43: a tag page, at /tags/<t>/ in v4.
    "tags/topic/index.html": page({ title: "#topic", canonical: `${ORIGIN}/tags/topic/` }),
    // #48: the retired widget reference.
    "widgets/README.html": page({ title: "Widgets" }),
    // #28: a private stub, noindex without nofollow in v5.
    "content/notes/stub.html": page({ title: "Stub", robots: "noindex, nofollow" }),
  })
  const v5 = site("v5", {
    ...BASE,
    "content/notes/weekly-w06.html": page({ title: "W06", canonical: `${ORIGIN}/content/notes/weekly-w06` }),
    // alias-redirects' case redirect, which only a case-sensitive filesystem can hold beside its target.
    ...(caseSensitive && { "content/notes/Weekly-W06.html": page({ title: "W06", refresh: "./weekly-w06" }) }),
    "tags/topic.html": page({ title: "topic", canonical: `${ORIGIN}/tags/topic` }),
    "content/notes/stub.html": page({ title: "Stub", robots: "noindex" }),
  })
  const result = await report(v4, v5, { args: ["--allow-unverified-redirects"] })
  expect(result.code, result.stdout).toBe(0)
  const cited = (url) => result.json.allowed.filter((d) => d.url === url).map((d) => d.ticket)
  expect(cited("/content/notes/Weekly-W06")).toEqual([23])
  expect(cited("/content/notes/")).toEqual([42])
  expect(cited("/tags/topic/")).toEqual([43])
  expect(cited("/widgets/README")).toEqual([48])
  expect(cited("/content/notes/stub")).toEqual([28])
  for (const ticket of ["#23", "#42", "#43", "#48", "#28"]) expect(result.stdout).toContain(ticket)
})

test("allows a tag page only v5 serves when the vault has a description file for that tag (#43)", async () => {
  const vault = site("vault", {
    // Before the cutover rename, a description file is tags/<t>/index.md; after it, tags/<t>.md.
    "tags/described/index.md": "---\ntitle: Described\n---\nAbout the tag.\n",
    "tags/renamed.md": "---\ntitle: Renamed\n---\nAbout the tag.\n",
  })
  const v5 = site("v5", {
    ...BASE,
    "tags/described/index.html": page({ title: "Described" }),
    "tags/renamed.html": page({ title: "Renamed" }),
    "tags/stray/index.html": page({ title: "Stray" }),
  })
  const result = await report(site("v4", BASE), v5, { vault })
  expect(result.code, result.stdout).toBe(1)
  expect(result.json.allowed.map((d) => [d.url, d.ticket]).sort()).toEqual([
    ["/tags/described/", 43],
    ["/tags/renamed", 43],
  ])
  expect(result.json.failing).toEqual([expect.objectContaining({ area: "url", change: "added", url: "/tags/stray/" })])
})

test("allows /widgets/README to go, and nothing else about it (#48)", async () => {
  const README = { title: "Widgets", canonical: `${ORIGIN}/widgets/README` }
  const v4 = site("v4", {
    ...BASE,
    "widgets/README.html": page(README),
    "sitemap.xml": sitemap(["/", "/content/articles/an-article", "/widgets/README"]),
  })
  // Retired: the page and its sitemap entry are gone.
  const retired = await report(v4, site("v5", BASE))
  expect(retired.code, retired.stdout).toBe(0)
  expect(retired.json.allowed.map((d) => [d.area, d.change, d.ticket])).toEqual([
    ["url", "removed", 48],
    ["sitemap", "removed", 48],
  ])
  // Still served, at its lowercase URL, but with a head v4's didn't have: that is not #48's.
  const v5 = site("v5", {
    ...BASE,
    "widgets/readme.html": page({ ...README, canonical: `${ORIGIN}/widgets/readme`, robots: "noindex" }),
    "sitemap.xml": sitemap(["/", "/content/articles/an-article", "/widgets/readme"]),
  })
  const changed = await report(v4, v5)
  expect(changed.code, changed.stdout).toBe(1)
  expect(changed.json.failing).toEqual([expect.objectContaining({ area: "head", url: "/widgets/README", field: "robots", added: ["noindex"] })])
})

test("allows what #48 decided: cgc-mdx's plugin note at /plugins/cgc-mdx, and its alias redirect at /widgets/readme", async () => {
  // Plugin notes are published at /plugins/<pkg>, from the READMEs symlinked into the vault.
  const vault = site("vault", { "plugins/cgc-mdx.md": "---\ntitle: cgc-mdx\naliases:\n  - widgets/README\n---\nWidgets.\n" })
  const v4 = site("v4", {
    ...BASE,
    "widgets/README.html": page({ title: "Widgets", canonical: `${ORIGIN}/widgets/README` }),
    "sitemap.xml": sitemap(["/", "/content/articles/an-article", "/widgets/README"]),
  })
  // The note's `widgets/README` alias, lowercased by v5, as stock alias-redirects renders it.
  const alias = (to) => page({ title: "plugins/cgc-mdx", canonical: to, robots: "noindex", refresh: to })
  const decided = site("v5", {
    ...BASE,
    "plugins/cgc-mdx.html": page({ title: "cgc-mdx", canonical: `${ORIGIN}/plugins/cgc-mdx` }),
    "widgets/readme.html": alias("../plugins/cgc-mdx"),
    "sitemap.xml": sitemap(["/", "/content/articles/an-article", "/plugins/cgc-mdx"]),
  })
  // No case redirect was ever decided at /widgets/README, so none is waited for, on any filesystem.
  const result = await report(v4, decided, { vault })
  expect(result.code, result.stdout).toBe(0)
  expect(result.json.verdict).toBe("pass")
  expect(result.json.allowed.map((d) => [d.area, d.change ?? d.field, d.url, d.ticket]).sort()).toEqual([
    ["head", "canonical", "/plugins/cgc-mdx", 48],
    ["head", "refresh", "/widgets/README", 48],
    ["sitemap", "added", "/plugins/cgc-mdx", 48],
    ["sitemap", "removed", "/widgets/README", 48],
    ["url", "added", "/plugins/cgc-mdx", 48],
    ["url", "moved", "/widgets/README", 48],
  ])

  // The alias sending readers anywhere but the plugin note is not what #48 decided.
  const elsewhere = site("v5", { ...BASE, "plugins/cgc-mdx.html": page({ title: "cgc-mdx" }), "widgets/readme.html": alias("../plugins/cgc-other") })
  const misdirected = await report(v4, elsewhere, { vault })
  expect(misdirected.code, misdirected.stdout).toBe(1)
  expect(misdirected.json.failing).toEqual([
    expect.objectContaining({ area: "head", url: "/widgets/README", field: "refresh", added: [`${ORIGIN}/plugins/cgc-other`] }),
  ])
  // Nor is a page under /plugins/ with no README note in the vault behind it.
  const stray = await report(site("v4", BASE), site("v5", { ...BASE, "plugins/cgc-stray.html": page({ title: "cgc-stray" }) }), { vault })
  expect(stray.code, stray.stdout).toBe(1)
  expect(stray.json.failing).toEqual([expect.objectContaining({ area: "url", change: "added", url: "/plugins/cgc-stray" })])
})

test("compares the head of a page only v5 serves, and allows a plugin note's or tag description's only when it is indexed at its own URL (#48, #43)", async () => {
  const vault = site("vault", {
    "plugins/cgc-mdx.md": "---\ntitle: cgc-mdx\n---\nWidgets.\n",
    "tags/described/index.md": "---\ntitle: Described\n---\nAbout the tag.\n",
  })
  const note = (head) => page({ title: "cgc-mdx", ...head })
  const tag = (head) => page({ title: "Described", ...head })

  // Indexed at their own URLs, as v4's other notes and tag pages are: what the decisions expect.
  const decided = site("v5", {
    ...BASE,
    "plugins/cgc-mdx.html": note({ canonical: `${ORIGIN}/plugins/cgc-mdx`, jsonld: { "@type": "Article", headline: "cgc-mdx" } }),
    "tags/described/index.html": tag({ canonical: `${ORIGIN}/tags/described/` }),
  })
  const result = await report(site("v4", BASE), decided, { vault })
  expect(result.code, result.stdout).toBe(0)
  const heads = result.json.allowed.filter((d) => d.area === "head").map((d) => [d.url, d.field, d.added, d.ticket])
  expect(heads.sort()).toEqual([
    ["/plugins/cgc-mdx", "canonical", [`${ORIGIN}/plugins/cgc-mdx`], 48],
    ["/plugins/cgc-mdx", "jsonld.@type", ["Article"], 48],
    ["/plugins/cgc-mdx", "jsonld.headline", ["cgc-mdx"], 48],
    ["/tags/described/", "canonical", [`${ORIGIN}/tags/described/`], 43],
  ])

  // A plugin note kept out of search, or a tag page that sends crawlers elsewhere, is not.
  const hidden = site("v5", {
    ...BASE,
    "plugins/cgc-mdx.html": note({ canonical: `${ORIGIN}/plugins/cgc-mdx`, robots: "noindex" }),
    "tags/described/index.html": tag({ canonical: `${ORIGIN}/tags/elsewhere` }),
  })
  const wrong = await report(site("v4", BASE), hidden, { vault })
  expect(wrong.code, wrong.stdout).toBe(1)
  expect(wrong.json.failing).toHaveLength(2)
  expect(wrong.json.failing).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ area: "head", url: "/plugins/cgc-mdx", field: "robots", removed: [], added: ["noindex"] }),
      expect.objectContaining({ area: "head", url: "/tags/described/", field: "canonical", removed: [], added: [`${ORIGIN}/tags/elsewhere`] }),
    ]),
  )
  expect(wrong.stdout).toContain("pages whose robots v5 added")

  // A page no decision covers fails for being there, and its head is reported with it.
  const stray = await report(site("v4", BASE), site("v5", { ...BASE, "content/notes/new.html": page({ title: "New", canonical: `${ORIGIN}/content/notes/new` }) }))
  expect(stray.code, stray.stdout).toBe(1)
  expect(stray.json.failing).toHaveLength(2)
  expect(stray.json.failing).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ area: "url", change: "added", url: "/content/notes/new" }),
      expect.objectContaining({ area: "head", url: "/content/notes/new", field: "canonical", added: [`${ORIGIN}/content/notes/new`] }),
    ]),
  )
})

// The owner's 2026-09-26 decision (cgc-mdx ADR-0005): an .mdx page lives at its .mdx URL, as stock
// page types keep a file's extension, and its v4 URL is an alias that alias-redirects redirects there.
// Its OG image is named after its slug, so it follows the page.
const MDX_ARTICLE = (url) => ({
  title: "Dice",
  canonical: `${ORIGIN}${url}`,
  jsonld: { "@context": "https://schema.org", "@type": "Article", headline: "Dice", url: `${ORIGIN}${url}`, image: `${ORIGIN}${url}-og-image.webp` },
})
function mdxSites({ slug, redirect = true }) {
  const v4 = site("v4", {
    ...BASE,
    [`${slug}.html`]: page(MDX_ARTICLE(`/${slug}`)),
    [`${slug}-og-image.webp`]: "webp",
    "sitemap.xml": sitemap(["/", "/content/articles/an-article", `/${slug}`]),
    "index.xml": rss(["/content/articles/an-article", `/${slug}`]),
  })
  const v5 = site("v5", {
    ...BASE,
    [`${slug}.mdx.html`]: page(MDX_ARTICLE(`/${slug}.mdx`)),
    [`${slug}.mdx-og-image.webp`]: "webp",
    ...(redirect && { [`${slug}.html`]: page({ title: `${slug}.mdx`, refresh: `./${path.posix.basename(slug)}.mdx` }) }),
    "sitemap.xml": sitemap(["/", "/content/articles/an-article", `/${slug}.mdx`]),
    "index.xml": rss(["/content/articles/an-article", `/${slug}.mdx`]),
  })
  return [v4, v5]
}

test("classes an .mdx page at its .mdx URL as moved, with its redirect verified, and allows the vault's six", async () => {
  for (const slug of ["resume", "content/notes/scratch/dice-widget"]) {
    const result = await report(...mdxSites({ slug }))
    expect(result.code, result.stdout).toBe(0)
    // The feeds, the canonical and the OG image follow the page, so the move is the one difference.
    expect(result.json.allowed).toEqual([
      expect.objectContaining({ area: "url", change: "moved", url: `/${slug}`, to: `/${slug}.mdx`, how: ["mdx-extension"], redirect: "verified", ticket: 53 }),
    ])
    expect(result.stdout).toContain("pages moved (mdx-extension, redirect verified)")
  }
})

test("never allows an .mdx page's move without its redirect, nor any .mdx page but the vault's six", async () => {
  const unredirected = await report(...mdxSites({ slug: "resume", redirect: false }))
  expect(unredirected.code, unredirected.stdout).toBe(1)
  expect(unredirected.json.failing).toEqual([expect.objectContaining({ area: "url", change: "moved", url: "/resume", redirect: "missing" })])
  const another = await report(...mdxSites({ slug: "content/notes/dice" }))
  expect(another.code, another.stdout).toBe(1)
  expect(another.json.failing).toEqual([expect.objectContaining({ area: "url", change: "moved", url: "/content/notes/dice", redirect: "verified" })])
})

test("never allows an .mdx page v5 leaves out, nor the article that takes its place in the feed", async () => {
  // v5 serves every .mdx article, at its .mdx URL since the owner's 2026-09-26 decision, and builds
  // all of them since #79.
  const vault = site("vault", { "content/notes/dice.mdx": "---\ntitle: Dice\n---\nRoll.\n" })
  const v4 = site("v4", {
    ...BASE,
    "content/notes/dice.html": page({ title: "Dice", canonical: `${ORIGIN}/content/notes/dice` }),
    "sitemap.xml": sitemap(["/", "/content/articles/an-article", "/content/notes/dice"]),
    "index.xml": rss(["/content/articles/an-article", "/content/notes/dice"]),
  })
  // The feed keeps its length, so an older article takes the missing one's place.
  const v5 = site("v5", { ...BASE, "index.xml": rss(["/content/articles/an-article", "/content/notes/older"]) })
  const result = await report(v4, v5, { vault })
  expect(result.code, result.stdout).toBe(1)
  // Nothing waits on #79 any more, and no other ticket covers these.
  expect(result.json.failing.map((d) => [d.area, d.change, d.url, d.pending ?? null]).sort()).toEqual([
    ["rss", "added", "/content/notes/older", null],
    ["rss", "removed", "/content/notes/dice", null],
    ["sitemap", "removed", "/content/notes/dice", null],
    ["url", "removed", "/content/notes/dice", null],
  ])
  expect(result.stdout).not.toContain("pending #79")
})

test("reads relative site, vault and output paths from the repo root, as its defaults are", async () => {
  const v4 = site("v4", BASE)
  const v5 = site("v5", BASE)
  const vault = tempDir("vault")
  const out = tempDir("out")
  const fromRoot = (dir) => path.relative(repoRoot, dir)
  // Nx runs the target in quartz-v5/tests.
  const { stdout } = await run("node", [REPORT, "--v4", fromRoot(v4), "--v5", fromRoot(v5), "--vault", fromRoot(vault), "--out", fromRoot(out)], {
    cwd: testsRoot,
  })
  expect(stdout).toContain("PASS")
  expect(fs.existsSync(path.join(out, "report.json"))).toBe(true)
})

test("allows an asset lowercased with no redirect, as the owner decided on #26, and no other asset move", async () => {
  const lowered = await report(site("v4", { ...BASE, "assets/Resume.pdf": "pdf" }), site("v5", { ...BASE, "assets/resume.pdf": "pdf" }))
  expect(lowered.code, lowered.stdout).toBe(0)
  expect(lowered.json.allowed).toEqual([
    expect.objectContaining({ area: "url", change: "moved", url: "/assets/Resume.pdf", to: "/assets/resume.pdf", ticket: 26 }),
  ])
  // A folder note's move is allowed only for the one notebook the owner accepted.
  const folded = await report(
    site("v4", { ...BASE, "assets/nb/nb.ipynb": "{}" }),
    site("v5", { ...BASE, "assets/nb/index.ipynb": "{}" }),
  )
  expect(folded.code, folded.stdout).toBe(1)
  expect(folded.json.failing).toEqual([expect.objectContaining({ area: "url", change: "moved", url: "/assets/nb/nb.ipynb", how: ["folder-note"] })])
})

test("treats a date both builds took from their own clock as the same date", async () => {
  // A page with no date of its own is dated when it is built, so the two builds disagree by however
  // long apart they ran.
  const dated = (root, when) => {
    const file = path.join(root, "content/articles/an-article.html")
    const stamp = new Date(when).toISOString()
    fs.writeFileSync(file, page({ ...ARTICLE, article: [["published_time", stamp], ["tag", "python"]], jsonld: { ...ARTICLE.jsonld, datePublished: stamp } }))
    for (const entry of fs.readdirSync(root, { recursive: true })) {
      const target = path.join(root, entry)
      if (fs.statSync(target).isFile()) fs.utimesSync(target, new Date(when + 20_000), new Date(when + 20_000))
    }
    return root
  }
  const now = Date.now()
  const result = await report(dated(site("v4", BASE), now - 60_000), dated(site("v5", BASE), now))
  expect(result.code, result.stdout).toBe(0)
})

test("still fails on a real date v5 changes, whatever the dates of the files a build copies", async () => {
  // Quartz copies some vault assets with their source's modification time (empty files, on macOS),
  // and a vault may hold an HTML asset. Such a file says nothing about when the site was built, so
  // it can't widen the build's clock over real dates.
  const withDates = (name, modified) => {
    const root = site(name, {
      ...BASE,
      "content/articles/an-article.html": page({ ...ARTICLE, article: [...ARTICLE.article, ["modified_time", modified]] }),
      "assets/empty.txt": "",
      "assets/figure.html": "<html><body>A figure</body></html>",
    })
    const copied = new Date("2020-01-01T00:00:00.000Z")
    for (const file of ["assets/empty.txt", "assets/figure.html"]) fs.utimesSync(path.join(root, file), copied, copied)
    return root
  }
  const result = await report(withDates("v4", "2024-03-01T00:00:00.000Z"), withDates("v5", "2024-02-01T00:00:00.000Z"))
  expect(result.code, result.stdout).toBe(1)
  expect(result.json.failing).toEqual([
    expect.objectContaining({
      area: "head",
      url: "/content/articles/an-article",
      field: "article:modified_time",
      removed: ["2024-03-01T00:00:00.000Z"],
      added: ["2024-02-01T00:00:00.000Z"],
    }),
  ])
})

test("refuses an allowlist entry that cites no ticket or says nothing, and every entry cites one", async () => {
  // The report runs this check before anything else, and exits 2 when it throws.
  const allows = () => true
  expect(() => checkAllowlist([{ summary: "Anything goes.", allows }])).toThrow(/cites no ticket/)
  expect(() => checkAllowlist([{ ticket: "#23", summary: "Anything goes.", allows }])).toThrow(/cites no ticket/)
  expect(() => checkAllowlist([{ ticket: 23, summary: " ", allows }])).toThrow(/has no summary/)
  expect(() => checkAllowlist([{ ticket: 23, summary: "Anything goes." }])).toThrow(/has no allows/)
  expect(ALLOWLIST.length).toBeGreaterThan(0)
  expect(() => checkAllowlist(ALLOWLIST)).not.toThrow()
})

test("says whether it could check case redirects on this filesystem, and never passes without checking them", async () => {
  const v4 = site("v4", { ...BASE, "content/notes/Mixed.html": page({ title: "Mixed" }) })
  const v5 = site("v5", { ...BASE, "content/notes/mixed.html": page({ title: "Mixed" }) })
  const result = await report(v4, v5)
  if (caseSensitive) {
    // With nothing at the old URL, the case redirect alias-redirects should have emitted is missing.
    expect(result.code, result.stdout).toBe(1)
    expect(result.json.failing).toEqual([expect.objectContaining({ url: "/content/notes/Mixed", redirect: "missing" })])
  } else {
    // Everything else passes, but the redirects #23 relies on went unseen: exit 3, not 0, unless the
    // run says it knows.
    expect(result.code, result.stdout).toBe(3)
    expect(result.json.verdict).toBe("unverified")
    expect(result.stdout).toMatch(/case-insensitive/)
    const knowingly = await report(v4, v5, { args: ["--allow-unverified-redirects"] })
    expect(knowingly.code, knowingly.stdout).toBe(0)
    expect(knowingly.stdout).toMatch(/case-insensitive/)
  }
})

test("fails on an RSS item whose description v5 changes, such as its reading time", async () => {
  const item = (description) => ({ url: "/content/articles/an-article", date: "2024-01-01", description })
  const v4 = site("v4", { ...BASE, "index.xml": rss([item("About things. (4 min read)")]) })
  const v5 = site("v5", { ...BASE, "index.xml": rss([item("About things. (5 min read)")]) })
  const result = await report(v4, v5)
  expect(result.code, result.stdout).toBe(1)
  expect(result.json.failing).toEqual([
    expect.objectContaining({
      area: "rss",
      change: "changed",
      url: "/content/articles/an-article",
      field: "description",
      removed: ["About things. (4 min read)"],
      added: ["About things. (5 min read)"],
    }),
  ])
  expect(result.stdout).toContain("RSS items whose description v5 changed")
})

// A few vault-shaped pages built by the real v4 (the repo root's `quartz/`) and by v5 from the site
// config: proves the report reads what each version actually renders.
test("reads the heads, feeds and URLs both Quartz versions really emit", async () => {
  test.setTimeout(240_000)
  const dates = "created: 2024-02-01\nmodified: 2024-03-01\npublished: 2024-02-01\n"
  const CONTENT = {
    "index.md": `---\ntitle: Home\n${dates}---\nWelcome.\n`,
    "content/articles/an-article.md": `---\ntitle: An article\ntags: [writing/articles, engineering]\ndescription: About things.\n${dates}---\nBody text.\n`,
    "content/notes/a-stub.md": `---\ntitle: A stub\ntags: [private]\n${dates}---\nPrivate.\n`,
    "content/notes/Mixed Case.md": `---\ntitle: Mixed case\n${dates}---\nCapitals.\n`,
  }
  const content = tempDir("content")
  for (const [file, text] of Object.entries(CONTENT)) {
    fs.mkdirSync(path.dirname(path.join(content, file)), { recursive: true })
    fs.writeFileSync(path.join(content, file), text)
  }
  const v4 = path.join(tempDir("v4-build"), "public")
  await run("node", ["quartz/bootstrap-cli.mjs", "build", "-d", content, "-o", v4], { cwd: repoRoot, maxBuffer: 64 * 1024 * 1024 })
  const v5 = await buildScratchSite("acceptance", CONTENT, { config: siteConfig(), keep: true })
  scratch.push(v5.remove)
  expect(v5.code, v5.output).toBe(0)

  const { json, stdout } = await report(v4, v5.public, { vault: content })
  // Both heads were read: the article's canonical, article:* and JSON-LD, the stub's noindex.
  for (const side of ["v4", "v5"]) {
    for (const [field, count] of Object.entries(json.sites[side].heads)) expect(count, `${side} ${field}\n${stdout}`).toBeGreaterThan(0)
  }
  // site-styles' stack declaration ranks every layer on every v5 page.
  expect(json.sites.v5.layers.sets, stdout).toBeGreaterThan(0)
  expect(json.failing.filter((d) => d.area === "layers"), stdout).toEqual([])
  // The article's head is the same in both, and the stub differs only by the nofollow v5 drops.
  const head = (url) => [...json.failing, ...json.allowed].filter((d) => d.area === "head" && d.url === url)
  expect(head("/content/articles/an-article"), stdout).toEqual([])
  expect(head("/content/notes/a-stub")).toEqual([expect.objectContaining({ field: "robots", removed: ["nofollow"], ticket: 28 })])
  // Both sitemaps and both feeds hold the same pages, the stub in none of them, and both feeds
  // describe the article alike (#67).
  expect([...json.failing, ...json.allowed].filter((d) => d.area === "sitemap" || d.area === "rss"), stdout).toEqual([])
  expect(json.sites.v5.sitemap, stdout).toBeGreaterThan(0)
  expect(json.sites.v5.rss, stdout).toBeGreaterThan(0)
  // The mixed-case page moved to its lowercase URL, and v4's folder pages are gone.
  expect(json.allowed).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ area: "url", change: "moved", url: "/content/notes/Mixed-Case", to: "/content/notes/mixed-case", ticket: 23 }),
      expect.objectContaining({ area: "url", change: "removed", url: "/content/notes/", ticket: 42 }),
    ]),
  )
})
