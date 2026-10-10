import assert from "node:assert/strict"
import { test } from "node:test"
import { markdownToHtml } from "satteri"
import { obsidianFeatures, obsidianSyntax } from "../src/index.ts"

// A wikilink's alias is text. Obsidian's reading view shows `[[note|**bold**]]` with its asterisks,
// as written, where a Markdown link's text, `[**bold**](note.md)`, is formatted
// (https://forum.obsidian.md/t/support-markdown-markup-in-wikilink-alias-including-math-like-standard-markdown-links/49519).
// The host's smart punctuation is still the alias's, as it is every other piece of the note's text.

async function link(source: string): Promise<string> {
  const { html } = await markdownToHtml(source, {
    features: { ...obsidianFeatures, smartPunctuation: true },
    mdastPlugins: obsidianSyntax(),
  })
  const match = /<a class="internal-link"[^>]*>(.*?)<\/a>/s.exec(html)
  assert.ok(match, html)
  return match[1]!
}

test("emphasis in an alias is shown as written", async () => {
  assert.equal(await link("[[notes/a|**bold** alias]]"), "**bold** alias")
})

test("code in an alias is shown with its backticks", async () => {
  assert.equal(await link("[[notes/a|`engineering`]]"), "`engineering`")
})

test("HTML in an alias is shown as text, not put in the page", async () => {
  assert.equal(await link("[[notes/a|<b>hi</b>]]"), "&lt;b&gt;hi&lt;/b&gt;")
})

test("math in an alias is shown as written", async () => {
  assert.equal(await link("[[notes/a|$x$ squared]]"), "$x$ squared")
})

test("an alias is trimmed of the spaces around it", async () => {
  assert.equal(await link("[[notes/a| spaced out ]]"), "spaced out")
})

test("an alias with markup in it still has smart punctuation", async () => {
  assert.equal(await link(`[[notes/a|"it's" **so** -- there]]`), "“it’s” **so** – there")
})
