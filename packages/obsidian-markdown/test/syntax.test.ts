import assert from "node:assert/strict"
import { test } from "node:test"
import { markdownToHtml } from "satteri"
import { obsidianFeatures, obsidianSyntax, type SyntaxOptions } from "../src/index.ts"

/** A note rendered by the syntax plugins alone: no vault, so a link keeps its target as written. */
async function render(source: string, options: SyntaxOptions = {}): Promise<string> {
  const { html } = await markdownToHtml(source, {
    features: obsidianFeatures,
    mdastPlugins: obsidianSyntax(options),
  })
  return html.trim()
}

test("a wikilink is a link to its target, showing its alias", async () => {
  assert.equal(
    await render("See [[notes/a|the note]]."),
    '<p>See <a class="internal-link" href="notes/a" data-href="notes/a">the note</a>.</p>',
  )
})

test("a wikilink with no alias shows its target, with a subpath as Obsidian writes it", async () => {
  const html = await render("[[a]] [[a#Some heading]] [[#^abc123]]")
  assert.match(html, />a<\/a>/)
  assert.match(html, /data-href="a#Some heading">a &gt; Some heading<\/a>/)
  assert.match(html, /data-href="#\^abc123">\^abc123<\/a>/)
})

test("a wikilink in a table drops the backslash that escapes its pipe", async () => {
  const html = await render("| a |\n|---|\n| [[x\\|y]] |\n")
  assert.match(html, /<a class="internal-link" href="x" data-href="x">y<\/a>/)
})

test("an embed is marked as one, and a Markdown link or image is left alone", async () => {
  const html = await render("![[pic.png|300]] [text](https://example.com) ![alt](./a.png)")
  assert.match(html, /<span class="internal-embed" data-src="pic.png">300<\/span>/)
  assert.match(html, /<a href="https:\/\/example.com">text<\/a>/)
  assert.match(html, /<img src=".\/a.png" alt="alt">/)
})

test("an inline comment is left out", async () => {
  assert.equal(await render("visible %%hidden%% tail"), "<p>visible  tail</p>")
})

test("a block comment hides every block inside it, code included", async () => {
  const html = await render("before\n\n%%\nhidden\n\n```js\ncode\n```\n\nalso hidden\n%%\n\nafter\n")
  assert.equal(html, "<p>before</p>\n<p>after</p>")
})

test("a %% inside code is code", async () => {
  const html = await render("`%%` and\n\n```\n%%\n```\n\nstill here\n")
  assert.match(html, /<code>%%<\/code>/)
  assert.match(html, /still here/)
})

test("a comment hides a wikilink inside it from the page", async () => {
  assert.equal(await render("a %%[[secret]]%% b"), "<p>a  b</p>")
})

test("an Annotator block keeps its highlight and its comment, and drops its markers", async () => {
  const html = await render(
    [
      ">%%",
      ">```annotation-json",
      '>{"text":"x"}',
      ">```",
      ">%%",
      ">*%%PREFIX%%before%%HIGHLIGHT%% ==the highlight== %%POSTFIX%%after*",
      ">%%LINK%%[[#^abc|show annotation]]",
      ">%%COMMENT%%",
      ">The comment.",
      ">",
      ">%%TAGS%%",
      ">",
      "^abc",
    ].join("\n"),
  )
  assert.doesNotMatch(html, /%%|annotation-json|PREFIX|COMMENT/)
  assert.match(html, /<blockquote id="\^abc">/)
  assert.match(html, /<mark>the highlight<\/mark>/)
  assert.match(html, /The comment\./)
})

test("a highlight is a mark, and may hold other inline nodes", async () => {
  assert.equal(await render("a ==b== c"), "<p>a <mark>b</mark> c</p>")
  assert.equal(await render("x ==a **b** c== y"), "<p>x <mark>a <strong>b</strong> c</mark> y</p>")
  assert.equal(await render("*in ==em== too*"), "<p><em>in <mark>em</mark> too</em></p>")
})

test("a highlight nested in a parent that changes too is rendered once", async () => {
  assert.equal(
    await render("==a== and *b ==c== d*"),
    "<p><mark>a</mark> and <em>b <mark>c</mark> d</em></p>",
  )
})

test("an unpaired or spaced marker, and a longer run of =, are text", async () => {
  assert.equal(await render("a == b"), "<p>a == b</p>")
  assert.equal(await render("a == b == c"), "<p>a == b == c</p>")
  assert.equal(await render("a ===b=== c"), "<p>a ===b=== c</p>")
})

test("a tag is a link when tags are on, and text when they are off", async () => {
  assert.equal(
    await render("about #engineering/ai now"),
    '<p>about <a class="tag" href="#engineering/ai">#engineering/ai</a> now</p>',
  )
  assert.equal(await render("about #engineering/ai now", { tags: false }), "<p>about #engineering/ai now</p>")
})

test("a number, a mid-word # and a link's text are not tags", async () => {
  assert.equal(await render("issue #42 and C#sharp"), "<p>issue #42 and C#sharp</p>")
  assert.equal(await render("[a #tag](https://example.com)"), '<p><a href="https://example.com">a #tag</a></p>')
})

test("a block id at the end of a paragraph names the paragraph", async () => {
  assert.equal(await render("Some text. ^para1"), '<p id="^para1">Some text.</p>')
})

test("a block id on a list item names the item", async () => {
  assert.match(await render("- one ^item1\n- two\n"), /<li id="\^item1">one<\/li>/)
})

test("a block id alone names the block before it", async () => {
  const html = await render("> a quote\n\n^q1\n")
  assert.equal(html, '<blockquote id="^q1">\n<p>a quote</p>\n</blockquote>')
})

test("a callout has its type, its title and its body", async () => {
  assert.equal(
    await render("> [!warning] Mind the *gap*\n> The body.\n"),
    '<div class="callout" data-callout="warning">' +
      '<div class="callout-title">Mind the <em>gap</em></div>' +
      '<div class="callout-content"><p>The body.</p></div></div>',
  )
})

test("a callout with no title is titled by its type", async () => {
  assert.match(await render("> [!NOTE]\n> Body\n"), /data-callout="note"><div class="callout-title">Note<\/div>/)
})

test("a callout that folds is a details element, open only with +", async () => {
  const closed = await render("> [!tip]- Title\n> Body\n")
  assert.match(closed, /^<details class="callout" data-callout="tip"><summary class="callout-title">Title<\/summary>/)
  assert.match(await render("> [!tip]+ Title\n> Body\n"), /^<details class="callout" data-callout="tip" open/)
})

test("a callout nests, holds the other syntax, and keeps its block id", async () => {
  const html = await render("> [!note] Outer [[a|link]]\n> ==Body==\n>\n> > [!tip] Inner\n> > Deep\n\n^c1\n")
  assert.match(html, /^<div id="\^c1" class="callout" data-callout="note">/)
  assert.match(html, /<div class="callout-title">Outer <a class="internal-link"/)
  assert.match(html, /<mark>Body<\/mark>/)
  assert.match(html, /<div class="callout" data-callout="tip"><div class="callout-title">Inner<\/div>/)
})

test("a quote that is not a callout stays a quote", async () => {
  assert.equal(await render("> just a quote\n"), "<blockquote>\n<p>just a quote</p>\n</blockquote>")
})
