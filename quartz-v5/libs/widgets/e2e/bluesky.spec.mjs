// `/bluesky`, the widget library's non-widget export: Bluesky's public API and a renderer for its
// posts, which the `bluesky-post` widget is built on and which a plugin takes without the widget
// (#36, #75). cgc-social inlines it (#80), and its specs prove the feed there: the requests, who
// reposted and what replies, the counts and the failures (plugins/quartz-social/e2e/bluesky.spec.mjs).
// What that consumer doesn't show is kept here, with a probe standing in for a plugin's build: that
// the bundle carries no widget, Preact or icons library and only the `cgc-bluesky` block's CSS, the
// context lines' MDI glyphs, the post card at its full size, and why a fetch failed. The probe bundles
// the export for the browser with esbuild, as a plugin's build bundles its client script, and runs
// it on a fixture page. Bluesky is the suite's stand-in (tests/harness/bluesky.mjs).
import { test, expect, resolvedColour } from "../../../tests/harness/test.mjs"
import { testsRoot, core } from "../../../tests/harness/site.mjs"
import { createRequire } from "node:module"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const esbuild = createRequire(path.join(core, "package.json"))("esbuild")
const pkg = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

// MDI as installed, read beside the icons library rather than through it.
const iconsLib = path.resolve(pkg, "../icons")
const mdi = JSON.parse(
  fs.readFileSync(
    createRequire(path.join(iconsLib, "package.json")).resolve("@iconify-json/mdi/icons.json"),
    "utf8",
  ),
)
const mdiPath = (name) => /\bd="([^"]+)"/.exec(mdi.icons[name].body)[1]

// `/bluesky`, bundled for the browser from where content resolves the package, into one script
// that puts the export on `window.bluesky`, and the stylesheet that came with it.
async function bundle() {
  const outdir = fs.mkdtempSync(path.join(os.tmpdir(), "cgc-bluesky-probe-"))
  try {
    const result = await esbuild.build({
      stdin: {
        contents: `export * from "@chaoticgoodcomputing/widgets/bluesky"`,
        resolveDir: path.join(testsRoot, "content-fixture"),
        loader: "js",
      },
      bundle: true,
      format: "iife",
      globalName: "bluesky",
      platform: "browser",
      target: "es2020",
      outdir,
      entryNames: "probe",
      write: false,
      metafile: true,
      logLevel: "silent",
    })
    const file = (ext) => result.outputFiles.find((f) => f.path.endsWith(ext))?.text
    return { js: file(".js"), css: file(".css"), inputs: Object.keys(result.metafile.inputs) }
  } finally {
    fs.rmSync(outdir, { recursive: true, force: true })
  }
}

test("a plugin can bundle /bluesky for the browser without the widget, Preact or the icons library", async () => {
  const { js, css, inputs } = await bundle()
  expect(js).toBeTruthy()
  const ours = inputs.filter((f) => f.includes("libs/widgets/"))
  expect(ours.some((f) => f.endsWith("src/bluesky/client.ts"))).toBe(true)
  expect(ours.some((f) => f.endsWith("src/bluesky/render.ts"))).toBe(true)
  expect(
    inputs.filter((f) => /bluesky-post|pdf-viewer|preact|libs\/icons|@iconify/.test(f)),
  ).toEqual([])
  // The renderer's stylesheet comes with it, and holds only its own block.
  const classes = new Set(css.match(/\.cgc-[\w-]+/g))
  expect([...classes].filter((c) => !/^\.cgc-bluesky(__|--|$)/.test(c))).toEqual([])
  expect(classes.has(".cgc-bluesky")).toBe(true)
})

test("a feed drawn with it marks who reposted and what replies with MDI's icons, on full-size cards", async ({
  page,
}) => {
  const { js, css } = await bundle()
  await page.goto("/plain-note")
  await page.addStyleTag({ content: css })
  await page.addScriptTag({ content: js })
  await page.evaluate(async () => {
    const { resolveHandle, getAuthorFeed, renderPost } = window.bluesky
    const feed = await getAuthorFeed(await resolveHandle("fixture.bsky.social"), { limit: 3 })
    const list = document.createElement("div")
    list.className = "cgc-probe-feed"
    list.innerHTML = feed.map((item) => renderPost(item)).join("")
    document.querySelector("article").append(list)
  })

  // The feed is a repost, a reply and a post (cgc-social's spec checks what each says).
  const posts = page.locator(".cgc-probe-feed .cgc-bluesky")
  await expect(posts).toHaveCount(3)
  const [repost, reply] = [posts.nth(0), posts.nth(1)]
  const glyph = (post) =>
    post.locator(".cgc-bluesky__context svg.cgc-bluesky__icon path").getAttribute("d")
  expect(await glyph(repost)).toBe(mdiPath("repeat-variant"))
  expect(await glyph(reply)).toBe(mdiPath("reply"))
  // Styled by its own stylesheet: the card's skin is Quartz's colour properties, and without
  // `compact` it is drawn at the post widget's size (cgc-social's compact card has 4px corners).
  const skin = await repost.evaluate((el) => ({
    border: getComputedStyle(el).borderTopColor,
    radius: getComputedStyle(el).borderTopLeftRadius,
  }))
  expect(skin.border).toBe(await resolvedColour(page, "var(--lightgray)"))
  expect(skin.radius).toBe("8px")
})

test("a fetch that fails rejects with a BlueskyError saying why", async ({ page }) => {
  const { js } = await bundle()
  await page.goto("/plain-note")
  await page.addScriptTag({ content: js })
  const failures = await page.evaluate(async () => {
    const { resolveHandle, getPost, BlueskyError } = window.bluesky
    const why = (promise) =>
      promise.then(
        () => "resolved",
        (error) => (error instanceof BlueskyError ? error.reason : `not a BlueskyError: ${error}`),
      )
    return {
      unknownHandle: await why(resolveHandle("nobody.bsky.social")),
      missingPost: await why(getPost("at://fixture.bsky.social/app.bsky.feed.post/3lcgcmissing")),
    }
  })
  expect(failures).toEqual({ unknownHandle: "unavailable", missingPost: "not-found" })
})
