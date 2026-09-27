// The README's first widget (#79), v4's `initialization` widget as quartz-mdx's hello-world, built as
// the README writes it. Each file it shows is a code block titled with the file's path, which the
// site's syntax highlighting draws as the block's caption and GitHub ignores.
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { test, expect, routeSite } from "../../../tests/harness/test.mjs"
import { buildScratchSite } from "../../../tests/harness/site.mjs"

const README = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../README.md")
const ORIGIN = "https://readme.cgc-fixture.invalid"

/** Every code block in the README titled with a file's path: ```tsx title="widgets/x.tsx" … ``` */
const titledFiles = () =>
  Object.fromEntries(
    [...fs.readFileSync(README, "utf8").matchAll(/^```[\w-]+ title="([^"]+)"\n([\s\S]*?)^```$/gm)].map(([, file, body]) => [file, body]),
  )

// One build per colour-scheme project, shared by that project's tests.
test.describe.configure({ mode: "serial" })

let site
test.beforeAll(async () => {
  test.setTimeout(180_000)
  site = await buildScratchSite("mdx-readme", { "index.md": "---\ntitle: Home\n---\nHome.\n", ...titledFiles() }, { keep: true })
  expect(site.code, site.output).toBe(0)
})
test.afterAll(() => site?.remove())

test("the README shows a whole first widget: a page, its widget and the widget's CSS", () => {
  expect(Object.keys(titledFiles()).sort()).toEqual(["hello.mdx", "widgets/initialization.css", "widgets/initialization.tsx"])
})

test("the first widget says one thing at build time and another once it hydrates", async ({ page }) => {
  // The build-time HTML, before any script runs.
  const html = fs.readFileSync(path.join(site.public, "hello.mdx.html"), "utf8")
  expect(html).toMatch(/class="cgc-mdx-island"[^>]*>\s*<p class="initialization">Initializing widgets…<\/p>/)

  await routeSite(page, site.public, ORIGIN)
  await page.goto(`${ORIGIN}/hello.mdx`)
  await expect(page.locator(".cgc-mdx-island")).toHaveAttribute("data-cgc-hydrated", "")
  await expect(page.locator(".initialization")).toHaveText("Widgets initialized")
  await expect(page.locator(".initialization")).toHaveClass("initialization initialization--ready")
})
