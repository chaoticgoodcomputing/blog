// The plugins' tag, `projects/site/plugins`, and the DAG on its description note (#86, the owner's
// review notes of 2026-09-26), as a reader sees them: the tag's page shows the description with the
// DAG as a Mermaid diagram, and lists every plugin note. The DAG is a Mermaid flowchart that
// `utils/plugin-dag.mjs` generates from the packages' manifests (`pnpm nx run site-v5:plugin-dag`).
// That the note carries what it would write, and that every plugin's README is its note, tagged and
// linked into the vault, are the `plugin-dag` and `plugin-notes` repo guards'; the script's own
// cases are utils/test/plugin-dag.test.mjs.
import fs from "node:fs"
import path from "node:path"
import { test, expect, routeSite } from "../harness/test.mjs"
import { buildScratchSite, siteConfig } from "../harness/site.mjs"
import { flowchart, notePath, quartzRoot, readPackages } from "../../utils/plugin-dag.mjs"

const TAG = "projects/site/plugins"
const pluginDirs = () =>
  fs
    .readdirSync(path.join(quartzRoot, "plugins"))
    .filter((dir) => fs.existsSync(path.join(quartzRoot, "plugins", dir, "package.json")))
    .sort()

// The tag's page on the site config, with the description note in the shape the cutover rename (#43)
// gives it, `tags/projects/site/plugins.md`, so it is the tag's page itself, and the plugin notes as
// the vault links them.
test.describe("on the site config", () => {
  test.describe.configure({ mode: "serial" })

  const ORIGIN = "https://blog.chaoticgood.computer"
  let site
  test.beforeAll(async () => {
    test.setTimeout(240_000)
    const content = {
      "index.md": "---\ntitle: Home\n---\nWelcome.\n",
      [`tags/${TAG}.md`]: fs.readFileSync(notePath(), "utf8"),
    }
    for (const dir of pluginDirs()) {
      content[`plugins/${dir}.md`] = fs.readFileSync(path.join(quartzRoot, "plugins", dir, "README.md"), "utf8")
    }
    // Offline: nothing here looks at type, so the site's Google Fonts needn't be fetched.
    site = await buildScratchSite("plugin-dag-site", content, { config: siteConfig({ offline: true }), keep: true })
    expect(site.code, site.output).toBe(0)
  })
  test.afterAll(() => site?.remove())

  test("the tag's page shows the description, with the DAG as a Mermaid diagram", async ({ page }) => {
    // Stock's Mermaid script loads Mermaid from a CDN, which no spec reaches: the block is checked
    // as the page serves it, before the script draws it.
    await page.route("https://cdnjs.cloudflare.com/**", (route) => route.abort())
    await routeSite(page, site.public, ORIGIN)
    await page.goto(`${ORIGIN}/tags/${TAG}`)
    const body = page.locator(".cgc-tag-page")
    await expect(body).toContainText("plugins this site is built with")
    // The generated markers are Obsidian comments, which the page leaves out.
    await expect(body).not.toContainText("plugin-dag")
    const diagram = body.locator("code.mermaid")
    await expect(diagram).toHaveCount(1)
    expect((await diagram.textContent()).trim()).toBe(flowchart(readPackages()))
  })

  test("the tag's page lists every plugin note", async ({ page }) => {
    await routeSite(page, site.public, ORIGIN)
    await page.goto(`${ORIGIN}/tags/${TAG}`)
    const links = page.locator(".cgc-post-listing__link")
    const listed = (await links.evaluateAll((as) => as.map((a) => new URL(a.href).pathname))).sort()
    expect(listed).toEqual(pluginDirs().map((dir) => `/plugins/${dir}`))
  })
})
