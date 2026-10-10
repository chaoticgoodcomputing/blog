import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { after, before, test } from "node:test"
import { markdownToHtml, mdxToJs } from "satteri"
import {
  Vault,
  excalidrawExports,
  isExcalidraw,
  obsidianExcalidraw,
  obsidianFeatures,
  obsidianResolve,
  obsidianSyntax,
  withoutExcalidrawBackground,
} from "../src/index.ts"

// A drawing as Obsidian's Excalidraw plugin keeps one: a note that opens with the plugin's
// frontmatter key and holds the scene, and the SVGs the plugin exports beside it.
const DRAWING = "---\n\nexcalidraw-plugin: parsed\ntags: [excalidraw]\n\n---\n\n# Excalidraw Data\n\n## Text Elements\nLoop ^JPnbYZcT\n"

// What an export opens with: the drawing's size, in fractions of a pixel.
const LOOP =
  '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 469.58 371.87" width="469.58" height="371.87" class="excalidraw-svg"></svg>'

const FILES: Record<string, string> = {
  "post.md": "![[doodles/loop]]\n",
  "doodles/loop.md": DRAWING,
  "doodles/loop.light.svg": LOOP,
  "doodles/loop.dark.svg": LOOP,
  "doodles/single.md": DRAWING,
  "doodles/single.svg": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50"></svg>',
  "doodles/unexported.md": DRAWING,
  "doodles/half.md": DRAWING,
  "doodles/half.light.svg": "<svg/>",
  "doodles/plain.md": "A note that is no drawing, though an SVG has its name.\n",
  "doodles/plain.svg": "<svg/>",
}

let root: string
let vault: Vault

before(async () => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "obsidian-markdown-"))
  for (const [file, contents] of Object.entries(FILES)) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
    fs.writeFileSync(path.join(root, file), contents)
  }
  vault = await Vault.open(root)
})

after(() => fs.rmSync(root, { recursive: true, force: true }))

// A site's pipeline: the syntax, then the drawings, then the resolver.
async function render(source: string, from = "post.md"): Promise<string> {
  const { html } = await markdownToHtml(source, {
    features: obsidianFeatures,
    mdastPlugins: [
      ...obsidianSyntax(),
      obsidianExcalidraw({ vault, urlFor: (file) => `/drawings/${file.path}` }),
      obsidianResolve({
        vault,
        urlFor: (file) => (isExcalidraw(vault.metadataCache.getFileCache(file)) ? undefined : `/${file.path}`),
      }),
    ],
    fileURL: pathToFileURL(path.join(vault.root, from)),
  })
  return html.trim()
}

test("an embed of a drawing is its light and its dark export, each an image named for the drawing, at its size", async () => {
  assert.equal(
    await render(FILES["post.md"]!),
    '<p><span class="excalidraw-embed" data-src="doodles/loop">' +
      '<img class="excalidraw-svg excalidraw-light" src="/drawings/doodles/loop.light.svg" alt="loop" width="470" height="372" loading="lazy">' +
      '<img class="excalidraw-svg excalidraw-dark" src="/drawings/doodles/loop.dark.svg" alt="loop" width="470" height="372" loading="lazy">' +
      "</span></p>",
  )
})

test("a drawing with one export is that export, whatever the colour scheme", async () => {
  assert.equal(
    await render("![[single]]\n"),
    '<p><span class="excalidraw-embed" data-src="single">' +
      '<img class="excalidraw-svg" src="/drawings/doodles/single.svg" alt="single" width="100" height="50" loading="lazy">' +
      "</span></p>",
  )
})

test("an embed's alias is the drawing's alternative text", async () => {
  assert.match(
    await render("![[single|How the loop closes]]\n"),
    /<img class="excalidraw-svg" src="[^"]+" alt="How the loop closes" width="100" height="50" loading="lazy">/,
  )
})

test("an embed's alias that is a size sizes the embed, as Obsidian marks one, and the drawing in it", async () => {
  assert.match(
    await render("![[single|300]]\n"),
    /<span class="excalidraw-embed" data-src="single" width="300"><img class="excalidraw-svg" src="[^"]+" alt="single" width="300" height="150" loading="lazy">/,
  )
  assert.match(
    await render("![[single|300x200]]\n"),
    /<span class="excalidraw-embed" data-src="single" width="300" height="200"><img class="excalidraw-svg" src="[^"]+" alt="single" width="300" height="200" loading="lazy">/,
  )
})

test("an embed of a part of a drawing is the whole drawing", async () => {
  assert.match(await render("![[single#^JPnbYZcT]]\n"), /<span class="excalidraw-embed" data-src="single#\^JPnbYZcT"><img class="excalidraw-svg" src="\/drawings\/doodles\/single.svg"/)
})

test("an embed in an MDX note is the drawing's exports too", async () => {
  const { code } = await mdxToJs("![[doodles/loop]]\n", {
    features: obsidianFeatures,
    mdastPlugins: [...obsidianSyntax(), obsidianExcalidraw({ vault, urlFor: (file) => `/drawings/${file.path}` })],
    fileURL: pathToFileURL(path.join(vault.root, "post.mdx")),
  })
  assert.match(code, /excalidraw-embed/)
  assert.match(code, /\/drawings\/doodles\/loop\.light\.svg/)
  assert.match(code, /\/drawings\/doodles\/loop\.dark\.svg/)
})

test("a link to a drawing, and an embed of any other note, are left for the resolver", async () => {
  const html = await render("[[doodles/loop]] and ![[plain]]\n")
  assert.match(html, /<a class="internal-link is-unresolved" href="doodles\/loop" data-href="doodles\/loop">doodles\/loop<\/a>/)
  // The resolver shows an embedded note in place (ticket 02).
  assert.match(html, /<div class="internal-embed markdown-embed" data-src="plain">/)
  assert.doesNotMatch(html, /excalidraw/)
})

test("a note is a drawing when its frontmatter has the Excalidraw plugin's key", () => {
  const cache = vault.metadataCache
  assert.equal(isExcalidraw(cache.getFileCache("doodles/loop.md")), true)
  assert.equal(isExcalidraw(cache.getFileCache("doodles/plain.md")), false)
  assert.equal(isExcalidraw(cache.getFileCache("doodles/loop.light.svg")), false)
})

test("a drawing's exports are the SVGs beside it: a light and a dark one, or one, or none", () => {
  const exports = (drawing: string) =>
    excalidrawExports(vault, vault.getFileByPath(drawing)!).map(({ file, scheme }) => [file.path, scheme])
  assert.deepEqual(exports("doodles/loop.md"), [
    ["doodles/loop.light.svg", "light"],
    ["doodles/loop.dark.svg", "dark"],
  ])
  assert.deepEqual(exports("doodles/single.md"), [["doodles/single.svg", undefined]])
  assert.deepEqual(exports("doodles/unexported.md"), [])
  assert.deepEqual(exports("doodles/half.md"), [], "a light export with no dark one is half a pair")
})

test("an embed of a drawing with no export stops the render, and says which drawing and what is missing", async () => {
  await assert.rejects(render("![[unexported]]\n"), (error: Error) => {
    assert.match(error.message, /post\.md embeds the Excalidraw drawing doodles\/unexported\.md \(!\[\[unexported\]\]\)/)
    assert.match(error.message, /no exported SVG beside it: neither unexported\.svg, nor unexported\.light\.svg with unexported\.dark\.svg/)
    return true
  })
  await assert.rejects(render("![[half]]\n"), /half\.light\.svg with half\.dark\.svg/)
})

test("an export loses the canvas it was drawn on, and nothing else", () => {
  const exported =
    '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 469.58 371.87" width="469.58" height="371.87" class="excalidraw-svg">' +
    '<defs></defs><rect x="0" y="0" width="469.58" height="371.87" fill="#ffffff"></rect>' +
    '<g><rect x="10" y="10" width="40" height="20" fill="#f08c00"></rect><text x="0" y="28">Loop</text></g></svg>'
  assert.equal(
    withoutExcalidrawBackground(exported),
    '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 469.58 371.87" width="469.58" height="371.87" class="excalidraw-svg">' +
      '<defs></defs>' +
      '<g><rect x="10" y="10" width="40" height="20" fill="#f08c00"></rect><text x="0" y="28">Loop</text></g></svg>',
  )
})

test("an SVG whose first rectangle is not its canvas is left as it is", () => {
  const drawn = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="10" y="10" width="40" height="20" fill="#f08c00"/></svg>'
  assert.equal(withoutExcalidrawBackground(drawn), drawn)
  assert.equal(withoutExcalidrawBackground("<svg/>"), "<svg/>")
})
