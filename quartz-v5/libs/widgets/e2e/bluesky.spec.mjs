// `/bluesky`, the widget library's non-widget export: Bluesky's public API and a renderer for its
// posts, which the `bluesky-post` widget is built on and which a plugin such as cgc-social takes
// without the widget (#36, #75). No plugin takes it yet, so the spec does what one would: it bundles
// the export for the browser with esbuild, as a plugin's build bundles its client script, and runs
// the bundle on a fixture page. Bluesky is the suite's stand-in (tests/harness/bluesky.mjs).
import { test, expect, resolvedColour } from "../../../tests/harness/test.mjs"
import { BLUESKY_API } from "../../../tests/harness/bluesky.mjs"
import { testsRoot, vendored } from "../../../tests/harness/site.mjs"
import { createRequire } from "node:module"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const esbuild = createRequire(path.join(vendored, "package.json"))("esbuild")
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

test("a feed drawn with it says who reposted and what replies, beside MDI icons", async ({
  page,
}) => {
  const { js, css } = await bundle()
  const asked = []
  page.on("request", (req) => BLUESKY_API.test(req.url()) && asked.push(new URL(req.url())))
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
  expect(asked.map((u) => [u.pathname, Object.fromEntries(u.searchParams)])).toEqual([
    ["/xrpc/com.atproto.identity.resolveHandle", { handle: "fixture.bsky.social" }],
    [
      "/xrpc/app.bsky.feed.getAuthorFeed",
      { actor: "did:plc:cgcfixtureauthor2345abcd", limit: "3" },
    ],
  ])

  const posts = page.locator(".cgc-probe-feed .cgc-bluesky")
  await expect(posts).toHaveCount(3)
  const [repost, reply, own] = [posts.nth(0), posts.nth(1), posts.nth(2)]
  await expect(repost.locator(".cgc-bluesky__context")).toHaveText("Fixture Author reposted")
  await expect(repost.locator(".cgc-bluesky__name")).toHaveText("Quoted Author")
  await expect(reply.locator(".cgc-bluesky__context")).toHaveText("Fixture Author replied")
  await expect(own.locator(".cgc-bluesky__context")).toHaveCount(0)
  const glyph = (post) =>
    post.locator(".cgc-bluesky__context svg.cgc-bluesky__icon path").getAttribute("d")
  expect(await glyph(repost)).toBe(mdiPath("repeat-variant"))
  expect(await glyph(reply)).toBe(mdiPath("reply"))
  // v4's renderer showed counts unless told not to.
  await expect(own.locator(".cgc-bluesky__metric")).toHaveText([
    "0 replies",
    "0 reposts",
    "2 likes",
  ])
  // Styled by its own stylesheet: the card's skin is Quartz's colour properties.
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
