// The real site keeps cgc-annotator's mirrors out of search and out of git (#37, #59). Mirrors are
// third-party documents: a crawler must not fetch them from us, and they never go on `main`.
// Proven on a scratch site built from the site config, finished by the site's own post-build step.
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { execFileSync } from "node:child_process"
import { createRequire } from "node:module"
import { test, expect, routeSite } from "../harness/test.mjs"
import { buildScratchSite, siteConfig, siteConfigFile, testsRoot, vendored } from "../harness/site.mjs"
import { pdf, sourceHost } from "../harness/source-host.mjs"
import { postbuild } from "../../utils/postbuild.mjs"

const YAML = createRequire(path.join(vendored, "package.json"))("yaml")
const ORIGIN = "https://blog.chaoticgood.computer"
const isAnnotator = (entry) => String(entry.get("source")).endsWith("plugins/cgc-annotator")

// Whether a generic crawler may fetch `pathname`, by RFC 9309: the `User-agent: *` group's rules,
// where the longest matching path wins and `allow` wins a tie.
function crawlable(robots, pathname) {
  const rules = []
  let group = false
  let agentLine = false
  for (const raw of robots.split("\n")) {
    const line = raw.replace(/#.*/, "").trim()
    const colon = line.indexOf(":")
    if (colon < 0) continue
    const key = line.slice(0, colon).trim().toLowerCase()
    const value = line.slice(colon + 1).trim()
    if (key === "user-agent") {
      group = (agentLine && group) || value === "*"
      agentLine = true
      continue
    }
    agentLine = false
    if (group && (key === "allow" || key === "disallow") && value) rules.push({ allow: key === "allow", value })
  }
  // `*` matches anything, and a `$` at the end anchors the match there.
  const pattern = (value) =>
    new RegExp("^" + value.replace(/[.+?^{}()|[\]\\]|\$(?!$)/g, "\\$&").replace(/\*/g, ".*"))
  const matches = rules.filter((rule) => pattern(rule.value).test(pathname))
  if (matches.length === 0) return true
  const longest = Math.max(...matches.map((rule) => rule.value.length))
  return matches.some((rule) => rule.allow && rule.value.length === longest)
}

test("the site's robots.txt disallows the mirror path", async ({ page }) => {
  const host = await sourceHost({ "/paper.pdf": pdf("paper") })
  const cache = fs.mkdtempSync(path.join(os.tmpdir(), "cgc-site-mirrors-cache-"))
  // The site config as it is, except that this test pins into a cache of its own.
  const config = YAML.parseDocument(siteConfig())
  const annotator = config.get("plugins").items.find(isAnnotator)
  expect(annotator, "cgc-annotator is enabled in the site config").toBeDefined()
  annotator.setIn(["options", "cacheDir"], cache)
  let site
  try {
    site = await buildScratchSite("site-mirrors", {
      "index.md": "---\ntitle: Home\n---\nWelcome.\n",
      "content/annotations/paper.md": `---\ntitle: A paper\nannotation-target: ${host.url("/paper.pdf")}\n---\nNotes.\n`,
    }, { config: String(config), keep: true })
    expect(site.code, site.output).toBe(0)
    postbuild(site.public)

    // Wherever the site put the mirror, a crawler reading the site's robots.txt stays out of it.
    const mirror = fs
      .readdirSync(site.public, { recursive: true })
      .find((file) => fs.statSync(path.join(site.public, file)).isFile() && fs.readFileSync(path.join(site.public, file), "utf8") === pdf("paper"))
    expect(mirror, "the mirror was emitted").toBeDefined()

    await routeSite(page, site.public, ORIGIN)
    const response = await page.goto(`${ORIGIN}/robots.txt`)
    expect(response.status()).toBe(200)
    const robots = await response.text()
    expect(crawlable(robots, `/${mirror.split(path.sep).join("/")}`), robots).toBe(false)
    // ...and nowhere else: the annotation page itself is for search engines.
    expect(crawlable(robots, "/content/annotations/paper"), robots).toBe(true)
    expect(robots).toContain(`Sitemap: ${ORIGIN}/sitemap.xml`)
  } finally {
    await host.close()
    fs.rmSync(cache, { recursive: true, force: true })
    if (site) fs.rmSync(site.root, { recursive: true, force: true })
  }
})

test("the real site's mirrors and their cache stay out of git", () => {
  const { plugins } = YAML.parse(fs.readFileSync(siteConfigFile, "utf8"))
  const annotator = plugins.find(({ source }) => String(source).endsWith("plugins/cgc-annotator"))
  const options = annotator?.options ?? {}
  // Where the real site build pins and emits them: `site-v5:build` runs Quartz from the vendored root
  // into `public/`. The defaults are cgc-annotator's own.
  const cache = path.resolve(vendored, options.cacheDir ?? "node_modules/.cache/cgc-annotator")
  const mirrors = path.join(vendored, "public", options.mirrorDir ?? "mirrors")
  const repo = path.resolve(testsRoot, "../..")
  for (const dir of [cache, mirrors]) {
    const probe = path.relative(repo, path.join(dir, "0123456789abcdef"))
    expect(() => execFileSync("git", ["check-ignore", "-q", probe], { cwd: repo }), `${probe} is ignored`).not.toThrow()
  }
})
