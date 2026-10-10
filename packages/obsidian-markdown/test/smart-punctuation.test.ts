import assert from "node:assert/strict"
import { test } from "node:test"
import { markdownToHtml } from "satteri"
import { obsidianFeatures, obsidianSyntax } from "../src/index.ts"

// A host that turns on the parser's smart punctuation, as Astro does by default, has it in every
// piece of a note's text. A wikilink's alias is text the reader reads, and is no exception.

async function render(source: string): Promise<string> {
  const { html } = await markdownToHtml(source, {
    features: { ...obsidianFeatures, smartPunctuation: true },
    mdastPlugins: obsidianSyntax(),
  })
  return html.trim()
}

test("a wikilink's alias has the same smart punctuation as the text around it", async () => {
  assert.equal(
    await render(`It's [[notes/a|that's "it" -- the end...]].`),
    '<p>It’s <a class="internal-link" href="notes/a" data-href="notes/a">that’s “it” – the end…</a>.</p>',
  )
})

test("a wikilink with no alias shows its target exactly as written, since that is a note's name", async () => {
  assert.match(await render(`[[that's it]]`), />that's it<\/a>/)
})

test("an alias with no smart punctuation in it reads as written", async () => {
  const { html } = await markdownToHtml(`[[notes/a|that's "it"]]`, {
    features: obsidianFeatures,
    mdastPlugins: obsidianSyntax(),
  })
  assert.match(html, />that's "it"<\/a>/)
})
