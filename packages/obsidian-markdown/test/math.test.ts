import assert from "node:assert/strict"
import { test } from "node:test"
import { markdownToHtml, mdxToJs } from "satteri"
import { obsidianFeatures, obsidianSyntax, parseMetadata } from "../src/index.ts"

/** A note rendered by the syntax plugins alone. Math is left as the parser marks it, for a typesetter. */
async function render(source: string): Promise<string> {
  const { html } = await markdownToHtml(source, {
    features: obsidianFeatures,
    mdastPlugins: obsidianSyntax(),
  })
  return html.trim()
}

test("two prices in a paragraph are text, not math", async () => {
  assert.equal(await render("It costs $5 and then $10 more."), "<p>It costs $5 and then $10 more.</p>")
})

test("a dollar sign before and after math is math, marked for a typesetter", async () => {
  assert.equal(
    await render("Pythagoras: $a^2 + b^2 = c^2$."),
    '<p>Pythagoras: <code class="language-math math-inline">a^2 + b^2 = c^2</code>.</p>',
  )
})

test("a dollar sign that can't close math leaves the next one free to open it", async () => {
  assert.equal(
    await render("From $5 to $10, where $x$ is the rate."),
    '<p>From $5 to $10, where <code class="language-math math-inline">x</code> is the rate.</p>',
  )
})

test("Markdown between two prices is read as Markdown", async () => {
  assert.equal(
    await render("It's **$5** for [[the guide]] and *$10* for both."),
    `<p>It's <strong>$5</strong> for <a class="internal-link" href="the guide" data-href="the guide">the guide</a> and <em>$10</em> for both.</p>`,
  )
})

test("math is its source as written, whatever Markdown would make of it", async () => {
  assert.equal(
    await render(String.raw`$\{a *b* c\} \\ x_1 -- y$`),
    String.raw`<p><code class="language-math math-inline">\{a *b* c\} \\ x_1 -- y</code></p>`,
  )
})

test("an escaped dollar sign neither opens nor closes math", async () => {
  assert.equal(await render(String.raw`\$x$ and $y\$`), "<p>$x$ and $y$</p>")
})

test("math beside a wikilink and a comment leaves both as they would be", async () => {
  assert.equal(
    await render("See [[a]] for $x$. %%draft%%"),
    '<p>See <a class="internal-link" href="a" data-href="a">a</a> for <code class="language-math math-inline">x</code>. </p>',
  )
})

test("math written with two dollar signs within a line is display math", async () => {
  assert.equal(
    await render("The odds: $$(1.00 - 0.30)^5 = 0.16$$"),
    '<p>The odds: <code class="language-math math-display">(1.00 - 0.30)^5 = 0.16</code></p>',
  )
})

test("a wikilink inside math is math, and one between two prices is a link", async () => {
  const cache = await parseMetadata("$[[a]]$ costs $5, [[b]] costs $10")
  assert.deepEqual(
    cache.links?.map((link) => link.link),
    ["b"],
  )
})

test("in MDX, braces inside inline math are math, not expressions", async () => {
  const { code } = await mdxToJs(String.raw`Half is $\frac{1}{2}$.`, {
    features: obsidianFeatures,
    mdastPlugins: obsidianSyntax(),
  })
  assert.match(code, /\\\\frac\{1\}\{2\}/)
})

test("math that runs onto another line of a quote, a callout or a list item is the math alone, without the line's marker", async () => {
  assert.equal(
    await render("> The $a +\n> b$ formula"),
    '<blockquote>\n<p>The <code class="language-math math-inline">a +\nb</code> formula</p>\n</blockquote>',
  )
  assert.match(
    await render("> [!note] Sum\n> The $a +\n>   b$ formula"),
    /<code class="language-math math-inline">a \+\nb<\/code>/,
  )
  assert.match(await render("- The $a +\n  b$ formula"), /<code class="language-math math-inline">a \+\nb<\/code>/)
  assert.match(await render("> - The $a +\n>   b$ formula"), /<code class="language-math math-inline">a \+\nb<\/code>/)
})

test("a math block is display math", async () => {
  assert.equal(
    await render("$$\nx = \\frac{1}{2}\n$$"),
    '<pre><code class="language-math math-display">x = \\frac{1}{2}</code></pre>',
  )
})
