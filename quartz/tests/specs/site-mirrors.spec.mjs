// The real site keeps cgc-annotator's mirrors out of search and out of git (#37, #59). Mirrors are
// third-party documents: a crawler must not fetch them from us, and they never go on `main`.
// Proven on a scratch site built from the site config, finished by the site's own post-build step.
import fs from "node:fs"
import path from "node:path"
import { execFileSync } from "node:child_process"
import { test, expect, routeSite } from "../harness/test.mjs"
import { editConfig, pluginEntries, siteConfig, siteConfigFile, testsRoot, core } from "../harness/site.mjs"
import { pdf, sourceHost } from "../harness/source-host.mjs"
import { postbuild } from "../../utils/postbuild.mjs"

const ORIGIN = "https://blog.chaoticgood.computer"

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

test("the site's robots.txt disallows the mirror path", async ({ page, scratch }) => {
  const host = await sourceHost({ "/paper.pdf": pdf("paper") })
  // The site config as it is, except that this test pins into a cache of its own.
  const config = editConfig(siteConfig(), (_, entry) =>
    entry("@chaoticgoodcomputing/quartz-annotator").setIn(["options", "cacheDir"], scratch.dir("site-mirrors-cache")),
  )
  try {
    const site = await scratch.site("site-mirrors", {
      "index.md": "---\ntitle: Home\n---\nWelcome.\n",
      "content/annotations/paper.md": `---\ntitle: A paper\nannotation-target: ${host.url("/paper.pdf")}\n---\nNotes.\n`,
    }, { config })
    expect(site.code, site.output).toBe(0)
    await postbuild(site.public)

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
  }
})

test("the real site's mirrors and their cache stay out of git", () => {
  const annotator = pluginEntries(fs.readFileSync(siteConfigFile, "utf8")).find(({ source }) => source === "@chaoticgoodcomputing/quartz-annotator")
  const options = annotator?.options ?? {}
  // Where the real site build pins and emits them: `site:build` runs Quartz from Core's root
  // into `public/`. The defaults are quartz-annotator's own.
  const cache = path.resolve(core, options.cacheDir ?? "node_modules/.cache/cgc-annotator")
  const mirrors = path.join(core, "public", options.mirrorDir ?? "mirrors")
  const repo = path.resolve(testsRoot, "../..")
  for (const dir of [cache, mirrors]) {
    const probe = path.relative(repo, path.join(dir, "0123456789abcdef"))
    expect(() => execFileSync("git", ["check-ignore", "-q", probe], { cwd: repo }), `${probe} is ignored`).not.toThrow()
  }
})
