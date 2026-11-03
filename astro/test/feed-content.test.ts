import { expect, test } from "vitest"
import { crosspostMarkdown, feedContent } from "../src/lib/feed-content.ts"
import type { Note } from "../src/lib/notes.ts"

const SITE = new URL("https://example.com")
const note = { title: "Small & Models", url: "/content/notes/small-models" } as Note

const page = (article: string) =>
  `<html><body><main>
    <h1 class="article-title">Small Models</h1>
    <div class="share"><button>Share</button></div>
    <article class="prose">${article}</article>
    <div class="after-body">Discussion</div>
  </main></body></html>`

test("an item's content is its page's body, without what is around it, then a link to the page", () => {
  const content = feedContent(note, page("<p>Hello.</p>"), SITE)
  expect(content).not.toContain("Share")
  expect(content).not.toContain("Discussion")
  expect(content).toBe(
    '<p>Hello.</p>\n<hr />\n<p><a href="https://example.com/content/notes/small-models">Small &amp; Models</a> was first published on Chaotic Good Computing, where you can reply to it on Bluesky or from your own site.</p>',
  )
})

test("its links and images are whole addresses, and a link within the page is its text", () => {
  const content = feedContent(
    note,
    page(`<p><a href="/content/b">b</a> <a href="c">c</a> <a href="https://other.example/x">x</a> <a href="#part">part</a>
      <a href="mailto:a@example.com">mail</a></p><img src="/assets/i.png" srcset="/assets/i.png 1x, /assets/i@2x.png 2x" />`),
    SITE,
  )
  expect(content).toContain('<a href="https://example.com/content/b">b</a>')
  expect(content).toContain('<a href="https://example.com/content/notes/c">c</a>')
  expect(content).toContain('<a href="https://other.example/x">x</a>')
  expect(content).toContain("<a>part</a>")
  expect(content).toContain('href="mailto:a@example.com"')
  expect(content).toContain('src="https://example.com/assets/i.png"')
  expect(content).toContain('srcset="https://example.com/assets/i.png 1x, https://example.com/assets/i@2x.png 2x"')
})

test("a heading's anchor and a script are no part of the content", () => {
  const content = feedContent(note, page('<h2>Part<a class="heading-anchor" href="#part">#</a></h2><script>x()</script>'), SITE)
  expect(content.startsWith("<h2>Part</h2>\n<hr />")).toBe(true)
})

test("a callout is a quote, headed by its title where that is more than its kind's name", () => {
  const callout = (kind: string, title: string, content: string) =>
    `<div class="callout" data-callout="${kind}"><div class="callout-title">${title}</div><div class="callout-content">${content}</div></div>`
  const content = feedContent(note, page(callout("quote", "Quote", "<p>Said.</p>") + callout("note", "Mind the gap", "<p>Gap.</p>")), SITE)
  expect(content).toContain("<blockquote><p>Said.</p></blockquote>")
  expect(content).toContain("<blockquote><p><strong>Mind the gap</strong></p><p>Gap.</p></blockquote>")
  expect(content).not.toContain("[!")
  expect(content).not.toContain("data-callout")
})

test("a widget, a diagram and an annotated document's annotations are a quote that links to the page", () => {
  const content = feedContent(
    note,
    page(`<astro-island props="{}"><table><tr><td>1</td></tr></table></astro-island>
      <mermaid-diagram><pre>graph TD</pre></mermaid-diagram><section class="annotations"><article>Card</article></section>`),
    SITE,
  )
  const notice =
    '<blockquote><p>This interactive content can only be viewed on the <a href="https://example.com/content/notes/small-models">live site</a>.</p></blockquote>'
  expect(content.split(notice)).toHaveLength(4)
  expect(content).not.toContain("<table>")
  expect(content).not.toContain("graph TD")
  expect(content).not.toContain("Card")
})

test("a link to an unpublished note is its text, and nothing keeps a style or a data attribute", () => {
  const content = feedContent(
    note,
    page(`<p><a class="internal-link is-unresolved" href="/content/gone" data-href="/content/gone">gone</a></p>
      <pre style="color:red" data-language="ts"><code><span style="color:blue">x</span></code></pre><img class="excalidraw-svg excalidraw-light" src="/d.light.svg" /><img class="excalidraw-svg excalidraw-dark" src="/d.dark.svg" />`),
    SITE,
  )
  expect(content).toContain("<p>gone</p>")
  expect(content).toContain("<pre><code><span>x</span></code></pre>")
  expect(content).toContain("d.light.svg")
  expect(content).not.toContain("d.dark.svg")
})

test("a cross-post is the plain body as Markdown, with its links whole, then a link to the page", () => {
  const markdown = crosspostMarkdown(
    note,
    page(`<p>See <a href="/content/b">b</a>.</p><div class="callout" data-callout="quote"><div class="callout-title">Quote</div><div class="callout-content"><p>Said.</p></div></div>
      <astro-island><table><tr><td>1</td></tr></table></astro-island><pre data-language="ts"><code>const x = 1</code></pre>`),
    SITE,
  )
  expect(markdown).toBe(
    [
      "See [b](https://example.com/content/b).",
      "",
      "> Said.",
      "",
      "> This interactive content can only be viewed on the [live site](https://example.com/content/notes/small-models).",
      "",
      "```ts",
      "const x = 1",
      "```",
      "",
      "---",
      "",
      "*[Small & Models](https://example.com/content/notes/small-models) was first published on Chaotic Good Computing, where you can reply to it on Bluesky or from your own site.*",
      "",
    ].join("\n"),
  )
})

test("a drawing is its PNG where it has one, and its SVG where it has none", () => {
  const pngs = new Map([["/drawings/a.light.svg", "/drawings/a.light.png"]])
  const content = feedContent(
    note,
    page('<img class="excalidraw-svg excalidraw-light" src="/drawings/a.light.svg" /><img class="excalidraw-svg excalidraw-light" src="/drawings/b.light.svg" />'),
    SITE,
    pngs,
  )
  expect(content).toContain('src="https://example.com/drawings/a.light.png"')
  expect(content).toContain('src="https://example.com/drawings/b.light.svg"')
})
