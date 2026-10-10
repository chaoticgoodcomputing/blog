import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { after, before, test } from "node:test"
import { markdownToHtml } from "satteri"
import { Vault, obsidian, obsidianFeatures } from "../src/index.ts"

// A vault of notes that embed each other. Each test renders one of them as a site would: a note at
// `/` and its path without the extension, a space as `-`.
const FILES: Record<string, string> = {
  "whole.md": "Before.\n\n![[Recipe]]\n\nAfter.\n",
  "kitchen/Recipe.md": "---\ntitle: Recipe\n---\n\nBoil the water.\n\nAdd the tea.\n",

  "section.md": "![[Method#Steps]]\n",
  "kitchen/Method.md": "# Method\n\nIntro.\n\n## Steps\n\nBoil.\n\n### Detail\n\nPour.\n\n## Serving\n\nDrink.\n",

  "blocks.md": "![[Thoughts#^keep]]\n\n![[Thoughts#^item]]\n",
  "kitchen/Thoughts.md": "A thought worth keeping. ^keep\n\n- first\n- second ^item\n\nOther.\n",

  // Two notes named Pot: from the vault's root `[[Pot]]` is the cellar's, from the kitchen the
  // kitchen's.
  "syntax.md": "![[Steeping]]\n",
  "kitchen/Steeping.md":
    "> [!tip] Steep\n> Three ==minutes== in the [[Pot]]. %%Not this.%%\n\nSee [[#Later]], ![[pot.png|200]] and ![a sketch](./sketch.png).\n\n## Later\n\nLater.\n",
  "kitchen/Pot.md": "The kitchen's pot.\n",
  "cellar/Pot.md": "The cellar's pot.\n",
  "kitchen/pot.png": "not really a png",
  "kitchen/sketch.png": "not really a png",

  "loop/Echo.md": "Echo.\n\n![[Echo]]\n",
  "loop/Ping.md": "Ping.\n\n![[Pong]]\n",
  "loop/Pong.md": "Pong.\n\n![[Ping]]\n",

  "unresolved.md": "![[Nowhere]]\n\n![[Recipe#No such heading]]\n\n![[Recipe#^nothing]]\n",

  "anchors.md": "## Steps\n\n![[Method#Steps]]\n\nSee ![[Thoughts#^keep]] here. ^own\n",

  // The page and the note it embeds both have a footnote `a`; the section embedded refers to a
  // footnote defined above it.
  "footnotes.md": "Host note [^a].\n\n![[Footnoted]]\n\n[^a]: Host footnote.\n",
  "footnoted-section.md": "![[Footnoted#Two]]\n",
  "kitchen/Footnoted.md": "Text [^a].\n\n[^b]: Footnote B.\n\n## Two\n\nUnder two [^b].\n\n[^a]: Footnote A.\n",

  "program.md": "![[Widget]]\n",
  "kitchen/Widget.mdx": "import Timer from './timer.tsx'\n\n<Timer minutes={3} />\n",
}

let root: string
let vault: Vault

before(async () => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "obsidian-markdown-embeds-"))
  for (const [file, contents] of Object.entries(FILES)) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
    fs.writeFileSync(path.join(root, file), contents)
  }
  vault = await Vault.open(root, { noteExtensions: ["md", "mdx"] })
})

after(() => fs.rmSync(root, { recursive: true, force: true }))

const urlFor = (file: { path: string }) => `/${file.path.replace(/\.mdx?$/, "").replace(/ /g, "-")}`

/** A note of the vault, rendered, with the line breaks between its blocks taken out. */
async function render(file: string): Promise<string> {
  const { html } = await markdownToHtml(FILES[file]!, {
    features: obsidianFeatures,
    mdastPlugins: obsidian({ vault, urlFor, tagUrl: (tag) => `/tags/${tag}` }),
    fileURL: pathToFileURL(path.join(vault.root, file)),
  })
  return html.replace(/\n/g, "")
}

test("an embed of a note shows the whole note in place, without its frontmatter, and links back to it", async () => {
  assert.equal(
    await render("whole.md"),
    "<p>Before.</p>" +
      '<div class="internal-embed markdown-embed" data-src="Recipe">' +
      '<div class="markdown-embed-content"><p>Boil the water.</p><p>Add the tea.</p></div>' +
      '<a class="internal-link markdown-embed-link" href="/kitchen/Recipe" data-href="Recipe">Recipe</a>' +
      "</div>" +
      "<p>After.</p>",
  )
})

test("an embed of a heading shows the heading and everything under it, up to the next heading of its level", async () => {
  assert.equal(
    await render("section.md"),
    '<div class="internal-embed markdown-embed" data-src="Method#Steps">' +
      '<div class="markdown-embed-content">' +
      '<h2 id="steps">Steps</h2><p>Boil.</p><h3 id="detail">Detail</h3><p>Pour.</p>' +
      "</div>" +
      '<a class="internal-link markdown-embed-link" href="/kitchen/Method#steps" data-href="Method#Steps">Method &gt; Steps</a>' +
      "</div>",
  )
})

test("an embed of a block shows that block alone, a list item as a list of one", async () => {
  const html = await render("blocks.md")
  assert.match(
    html,
    /<div class="markdown-embed-content"><p>A thought worth keeping.<\/p><\/div><a class="internal-link markdown-embed-link" href="\/kitchen\/Thoughts#\^keep" data-href="Thoughts#\^keep">Thoughts &gt; \^keep<\/a>/,
  )
  assert.match(html, /<div class="markdown-embed-content"><ul><li>second<\/li><\/ul><\/div>/)
  assert.doesNotMatch(html, /first|Other/)
})

test("embedded content is rendered as a note is, and its links go where they go from the note it comes from", async () => {
  const html = await render("syntax.md")
  assert.match(
    html,
    /<div class="callout" data-callout="tip"><div class="callout-title">Steep<\/div><div class="callout-content"><p>Three <mark>minutes<\/mark> in the <a class="internal-link" href="\/kitchen\/Pot" data-href="Pot">Pot<\/a>.\s*<\/p><\/div><\/div>/,
  )
  assert.doesNotMatch(html, /Not this/)
  assert.match(html, /<a class="internal-link" href="\/kitchen\/Steeping#later" data-href="#Later">Later<\/a>/)
  // An image's path is written from the page it is shown on.
  assert.match(html, /<img src=".\/kitchen\/pot.png" alt="pot" width="200">/)
  assert.match(html, /<img src=".\/kitchen\/sketch.png" alt="a sketch">/)
})

test("an embed in running text is a block of its own, between what was written before and after it", async () => {
  const html = await render("anchors.md")
  assert.match(html, /<p id="\^own">See<\/p><div class="internal-embed markdown-embed" data-src="Thoughts#\^keep">/)
  assert.match(html, /<\/a><\/div><p>here.<\/p>$/)
})

test("embedded content takes none of the page's own anchors", async () => {
  const html = await render("anchors.md")
  // The page's own heading is `#steps`, so the embedded one is numbered after it.
  assert.match(html, /^<h2>Steps<\/h2>/)
  assert.match(html, /<h2 id="steps-1">Steps<\/h2>/)
  // A block's anchor is on its own note's page.
  assert.match(html, /<div class="markdown-embed-content"><p>A thought worth keeping.<\/p><\/div>/)
})

/** The text of each footnote at the foot of a page, in order, and where its first reference is. */
const footnotes = (html: string) =>
  [...html.matchAll(/<li id="user-content-fn-([^"]+)"><p>(.*?) <a href="#user-content-fnref-([^"]+)"/g)].map(
    ([, id, text, ref]) => ({ text, id, referenced: html.includes(`href="#user-content-fn-${id}" id="user-content-fnref-${ref}"`) }),
  )

test("an embedded note's footnotes are its own, and the page keeps its own beside them", async () => {
  const html = await render("footnotes.md")
  assert.deepEqual(
    footnotes(html).map(({ text, referenced }) => ({ text, referenced })),
    [
      { text: "Host footnote.", referenced: true },
      { text: "Footnote A.", referenced: true },
      { text: "Footnote B.", referenced: true },
    ],
  )
  // The page's reference is to its own footnote.
  assert.match(html, /^<p>Host note <sup><a href="#user-content-fn-a" id="user-content-fnref-a"/)
})

test("an embedded section brings the footnotes it refers to, wherever in its note they are defined", async () => {
  const html = await render("footnoted-section.md")
  assert.doesNotMatch(html, /\[\^b\]/)
  assert.deepEqual(
    footnotes(html).map(({ text, referenced }) => ({ text, referenced })),
    [{ text: "Footnote B.", referenced: true }],
  )
})

test("an MDX note, a program with components of its own, is embedded as a link to it", async () => {
  assert.equal(
    await render("program.md"),
    '<p><a class="internal-embed" data-src="Widget" href="/kitchen/Widget" data-href="Widget">Widget</a></p>',
  )
})

test("the links digest moves when a note another embeds changes, and not when a note none embeds does", async () => {
  const digest = async () => (await Vault.open(root, { noteExtensions: ["md", "mdx"] })).linksDigest
  const before = await digest()
  try {
    fs.appendFileSync(path.join(root, "whole.md"), "\nMore.\n")
    const unembedded = await digest()
    assert.equal(unembedded, before)
    fs.appendFileSync(path.join(root, "kitchen/Recipe.md"), "\nAnd a lemon.\n")
    assert.notEqual(await digest(), unembedded)
  } finally {
    for (const file of ["whole.md", "kitchen/Recipe.md"]) fs.writeFileSync(path.join(root, file), FILES[file]!)
  }
})

const count = (html: string, pattern: RegExp) => html.match(new RegExp(pattern, "g"))?.length ?? 0

test("a note that embeds itself is shown five notes deep, and the embed inside the last is a link", async () => {
  const echo = await render("loop/Echo.md")
  assert.equal(count(echo, /<p>Echo.<\/p>/), 6)
  assert.equal(count(echo, /class="internal-embed markdown-embed"/), 5)
  assert.equal(count(echo, /<a class="internal-embed" data-src="Echo" href="\/loop\/Echo" data-href="Echo">Echo<\/a>/), 1)
})

test("so is a note that embeds itself through another", async () => {
  const ping = await render("loop/Ping.md")
  assert.equal(count(ping, /<p>Ping.<\/p>/), 3)
  assert.equal(count(ping, /<p>Pong.<\/p>/), 3)
  assert.equal(count(ping, /<a class="internal-embed" data-src="Ping" href="\/loop\/Ping"/), 1)
})

test("an embed of no note, or of a heading or block its note doesn't have, shows nothing and is unresolved", async () => {
  const html = await render("unresolved.md")
  assert.equal(
    html,
    '<p><a class="internal-embed is-unresolved" data-src="Nowhere" href="Nowhere" data-href="Nowhere">Nowhere</a></p>' +
      '<p><a class="internal-embed is-unresolved" data-src="Recipe#No such heading" href="/kitchen/Recipe#no-such-heading" data-href="Recipe#No such heading">Recipe &gt; No such heading</a></p>' +
      '<p><a class="internal-embed is-unresolved" data-src="Recipe#^nothing" href="/kitchen/Recipe#^nothing" data-href="Recipe#^nothing">Recipe &gt; ^nothing</a></p>',
  )
})
