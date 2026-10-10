import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { after, before, test } from "node:test"
import { markdownToHtml } from "satteri"
import {
  Vault,
  annotationTarget,
  type AnnotatorOptions,
  obsidianAnnotator,
  obsidianFeatures,
  obsidianResolve,
  obsidianSyntax,
  parseAnnotations,
} from "../src/index.ts"

// One annotation as Obsidian's Annotator writes it: its record as JSON in a hidden code block, then
// the plugin's view of it for Obsidian, every line quoted, and the block id on the line after.
// Written out by hand from what the plugin writes, so a test reads what an author's note holds.
const VALVE =
  ">%%\n" +
  ">```annotation-json\n" +
  '>{"text":"The first line a new employee sees.\\n\\nSee [[flatland]].","target":[{"source":"https://example.com/handbook.pdf","selector":[{"type":"TextPositionSelector","start":162,"end":247},{"type":"TextQuoteSelector","exact":"A fearless adventure","prefix":"E M P L O Y E E S","suffix":"FIRST EDITION"}]}],"created":"2026-03-26T16:16:11.698Z","updated":"2026-03-26T16:16:11.698Z","tags":[]}\n' +
  ">```\n" +
  ">%%\n" +
  ">*%%PREFIX%%E M P L O Y E E S%%HIGHLIGHT%% ==A fearless adventure== %%POSTFIX%%FIRST EDITION*\n" +
  ">%%LINK%%[[#^qywghl0r7w|show annotation]]\n" +
  ">%%COMMENT%%\n" +
  ">The first line a new employee sees.\n" +
  ">\n" +
  ">See [[flatland]].\n" +
  ">%%TAGS%%\n" +
  ">\n" +
  "^qywghl0r7w\n"

test("a note's annotation target is its non-empty annotation-target property", () => {
  assert.equal(annotationTarget({ "annotation-target": " https://example.com/handbook.pdf " }), "https://example.com/handbook.pdf")
  assert.equal(annotationTarget({ "annotation-target": "" }), undefined)
  assert.equal(annotationTarget({ "annotation-target": null }), undefined)
  assert.equal(annotationTarget({ title: "A note" }), undefined)
  assert.equal(annotationTarget(undefined), undefined)
})

test("an annotation is read from the record Annotator keeps as JSON: its passage, its place, its comment and its tags", () => {
  const { annotations, unreadable } = parseAnnotations(`Before.\n\n\n${VALVE}\nAfter.\n`)
  assert.deepEqual(unreadable, [])
  assert.deepEqual(annotations.map(({ position: _position, ...annotation }) => annotation), [
    {
      id: "qywghl0r7w",
      exact: "A fearless adventure",
      prefix: "E M P L O Y E E S",
      suffix: "FIRST EDITION",
      start: 162,
      text: "The first line a new employee sees.\n\nSee [[flatland]].",
      tags: [],
      created: "2026-03-26T16:16:11.698Z",
    },
  ])
})

// A second annotation, with tags. With tags the plugin writes them on the block's last quoted line,
// and the `^id` line follows it directly.
const TAGGED =
  ">%%\n" +
  ">```annotation-json\n" +
  '>{"text":"Read this **twice**.","target":[{"source":"https://example.com/handbook.pdf","selector":[{"type":"TextPositionSelector","start":40,"end":59},{"type":"TextQuoteSelector","exact":"Welcome to Flatland","prefix":"","suffix":""}]}],"created":"2026-03-26T16:24:56.949Z","tags":["management","flat orgs"]}\n' +
  ">```\n" +
  ">%%\n" +
  ">*%%HIGHLIGHT%% ==Welcome to Flatland== *\n" +
  ">%%LINK%%[[#^ze04t12qu3i|show annotation]]\n" +
  ">%%COMMENT%%\n" +
  ">Read this **twice**.\n" +
  ">%%TAGS%%\n" +
  ">#management, #flat orgs\n" +
  "^ze04t12qu3i\n"

// A vault with annotation notes in it. Each test renders a note as a site would: the syntax, the
// annotations, then the resolver, a note at `/` and its path without the extension.
const FILES: Record<string, string> = {
  "handbook.md": `---\nannotation-target: https://example.com/handbook.pdf\n---\nWhy I read it.\n\n\n${VALVE}\n\n${TAGGED}\n\nWhat I took from it.\n`,
  "flatland.md": "Flatland.\n",
  "quoted.md": "See [[handbook#^qywghl0r7w|the adventure]].\n\n![[handbook#^ze04t12qu3i]]\n",
  "no-target.md": `---\ntitle: Not an annotation note\n---\n${TAGGED}`,
  "broken.md": `---\nannotation-target: https://example.com/handbook.pdf\n---\n${VALVE.replace('{"text"', '{"text":')}\n${TAGGED}`,
}

let root: string
let vault: Vault

before(async () => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "obsidian-markdown-"))
  for (const [file, contents] of Object.entries(FILES)) fs.writeFileSync(path.join(root, file), contents)
  vault = await Vault.open(root)
})

after(() => fs.rmSync(root, { recursive: true, force: true }))

async function render(file: string, options: Omit<AnnotatorOptions, "vault"> = {}): Promise<string> {
  // The body, as a host that reads frontmatter itself hands it on.
  const source = FILES[file]!.replace(/^---\n[\s\S]*?\n---\n/, "")
  const annotations = obsidianAnnotator({ vault, ...options })
  const { html } = await markdownToHtml(source, {
    features: obsidianFeatures,
    mdastPlugins: [
      ...obsidianSyntax(),
      annotations,
      obsidianResolve({ vault, urlFor: (note) => `/${note.path.replace(/\.md$/, "")}`, beforeResolve: [annotations] }),
    ],
    fileURL: pathToFileURL(path.join(vault.root, file)),
  })
  // Without the line breaks between elements, which say nothing.
  return html.replace(/>\n+</g, "><").trim()
}

const ids = (html: string) => [...html.matchAll(/<article class="annotation" id="([^"]+)"/g)].map((match) => match[1])

test("an annotation note is its preface, its annotations in the document's order, then its epilogue", async () => {
  const html = await render("handbook.md")
  assert.match(html, /^<p>Why I read it\.<\/p><section class="annotations"/)
  assert.match(html, /<\/section><p>What I took from it\.<\/p>$/)
  // The passage at character 40 comes before the one at 162, though it was written after it.
  assert.deepEqual(ids(html), ["^ze04t12qu3i", "^qywghl0r7w"])
})

test("an annotation is its highlighted passage, then its comment rendered as Markdown with its wikilinks resolved", async () => {
  const html = await render("handbook.md")
  assert.ok(
    html.includes(
      '<article class="annotation" id="^qywghl0r7w">' +
        '<blockquote class="annotation-highlight"><p>A fearless adventure</p></blockquote>' +
        '<div class="annotation-comment"><p>The first line a new employee sees.</p>' +
        '<p>See <a class="internal-link" href="/flatland" data-href="flatland">flatland</a>.</p></div>' +
        "</article>",
    ),
    html,
  )
})

test("an annotation's tags follow its comment", async () => {
  const html = await render("handbook.md")
  assert.ok(
    html.includes(
      '<div class="annotation-comment"><p>Read this <strong>twice</strong>.</p></div>' +
        '<ul class="annotation-tags"><li class="annotation-tag">#management</li><li class="annotation-tag">#flat orgs</li></ul>',
    ),
    html,
  )
})

test("an annotation's date is written last, as the host writes a date, and not at all by a host that writes none", async () => {
  const html = await render("handbook.md", { formatDate: (date) => date.toISOString().slice(0, 10) })
  assert.ok(
    html.includes(
      '<li class="annotation-tag">#flat orgs</li></ul>' +
        '<time class="annotation-date" datetime="2026-03-26T16:24:56.949Z">2026-03-26</time></article>',
    ),
    html,
  )
  assert.ok(!(await render("handbook.md")).includes("<time"))
})

test("none of Annotator's own markup reaches the page", async () => {
  const html = await render("handbook.md")
  for (const written of ["%%", "annotation-json", "show annotation", "PREFIX", "HIGHLIGHT", "COMMENT", "TAGS", "TextQuoteSelector", "=="]) {
    assert.ok(!html.includes(written), `${written} in ${html}`)
  }
})

test("the section of annotations names the annotated document", async () => {
  assert.match(
    await render("handbook.md"),
    /<section class="annotations" data-annotation-target="https:\/\/example\.com\/handbook\.pdf">/,
  )
})

test("a link to an annotation goes to its anchor, and an embed of one shows it", async () => {
  const html = await render("quoted.md")
  assert.ok(
    html.includes('<a class="internal-link" href="/handbook#^qywghl0r7w" data-href="handbook#^qywghl0r7w">the adventure</a>'),
    html,
  )
  assert.match(html, /<div class="markdown-embed-content"><article class="annotation"><blockquote class="annotation-highlight"><p>Welcome to Flatland<\/p>/)
})

test("in a note with no annotation target, an Annotator block is left as Markdown", async () => {
  const html = await render("no-target.md")
  assert.ok(!html.includes('class="annotation'), html)
  assert.match(html, /^<blockquote>/)
})

test("a block whose JSON does not parse is left out, and the rest are shown", async () => {
  const html = await render("broken.md")
  assert.deepEqual(ids(html), ["^ze04t12qu3i"])
  assert.ok(!html.includes("fearless"), html)
})
