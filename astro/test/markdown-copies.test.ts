import { expect, test } from "vitest"
import { copiedNotes, frontOf, llmsTxt, markdownCopy, markdownCopyUrl } from "../src/lib/markdown-copies.ts"
import { getNotes, type Note } from "../src/lib/notes.ts"

const SITE = new URL("https://example.com")

const fake = (over: Partial<Note>): Note =>
  ({
    title: "Small Models",
    description: "A note on small language models.",
    summary: "A note on small language models.",
    url: "/content/notes/small-models",
    tags: ["engineering/ai"],
    date: new Date("2026-03-05T00:00:00Z"),
    modified: new Date("2026-04-01T00:00:00Z"),
    ...over,
  }) as Note

const page = (article: string) =>
  `<html><head><style>p{}</style></head><body><nav>Site</nav><main>
    <h1 class="article-title">Small Models</h1>
    <ul class="tag-list"><li>engineering/ai</li></ul>
    <p class="date-and-reading-time">Mar 05, 2026 · 3 min read</p>
    <div class="share"><button>Share</button></div>
    <article class="prose">${article}</article>
    <div class="after-body">Recent posts</div>
  </main><footer>Footer</footer></body></html>`

test("a copy is at its page's address with .md after it, and the home page's is /index.md", () => {
  expect(markdownCopyUrl("/content/notes/small-models")).toBe("/content/notes/small-models.md")
  expect(markdownCopyUrl("/")).toBe("/index.md")
})

test("a copy opens with its note's title, description, page, author, dates and tags", () => {
  expect(frontOf(fake({}), SITE)).toBe(
    [
      "# Small Models",
      "",
      "> A note on small language models.",
      "",
      "- Page: https://example.com/content/notes/small-models",
      "- Author: Spencer Elkington",
      "- Published: 2026-03-05",
      "- Updated: 2026-04-01",
      "- Tags: engineering/ai",
    ].join("\n"),
  )
})

test("a copy is the page's article, without the furniture or the site around it", () => {
  const copy = markdownCopy(fake({}), page("<p>Hello, <em>small</em> models.</p>"), SITE)
  expect(copy).toContain("Hello, *small* models.")
  for (const furniture of ["Site", "Footer", "Recent posts", "Share", "3 min read", "p{}"]) expect(copy).not.toContain(furniture)
})

test("links and images are whole addresses; a link to a heading of the page is its text", () => {
  const copy = markdownCopy(
    fake({}),
    page('<p><a href="/content/notes/other">Other</a>, <a href="#part">a part</a> and <img src="/assets/a.png" alt="A [diagram]"></p>'),
    SITE,
  )
  expect(copy).toContain("[Other](https://example.com/content/notes/other), a part and ![A diagram](https://example.com/assets/a.png)")
})

test("a heading keeps its text, without its anchor or a link's new-tab icon", () => {
  const copy = markdownCopy(
    fake({}),
    page(
      '<h2 id="why">Why<a class="heading-anchor" href="#why" aria-hidden="true">#</a></h2><p><a href="https://a.example">Away<span class="new-tab" role="img" aria-label="(opens in a new tab)"></span></a></p>',
    ),
    SITE,
  )
  expect(copy).toContain("## Why\n")
  expect(copy).toContain("[Away](https://a.example/)")
})

test("highlighted code is its code as written, fenced and named by its language", () => {
  const copy = markdownCopy(
    fake({}),
    page('<pre class="astro-code" data-language="python"><code><span class="line">print(1)</span>\n<span class="line">print(2)</span></code></pre>'),
    SITE,
  )
  expect(copy).toContain("```python\nprint(1)\nprint(2)\n```")
})

test("math is the TeX it was written in", () => {
  const katex = (tex: string) =>
    `<span class="katex"><span class="katex-mathml"><math><semantics><mrow></mrow><annotation encoding="application/x-tex">${tex}</annotation></semantics></math></span><span class="katex-html" aria-hidden="true">drawn</span></span>`
  const copy = markdownCopy(fake({}), page(`<p>So ${katex("x^2")}.</p><span class="katex-display">${katex("\\sum x")}</span>`), SITE)
  expect(copy).toContain("So $x^2$.")
  expect(copy).toContain("$$\n\\sum x\n$$")
  expect(copy).not.toContain("drawn")
})

test("a callout is the quote Obsidian writes it as", () => {
  const copy = markdownCopy(
    fake({}),
    page('<blockquote class="callout" data-callout="tip"><div class="callout-title">Remember</div><div class="callout-content"><p>Water them.</p></div></blockquote>'),
    SITE,
  )
  expect(copy).toContain("> [!tip] Remember\n>\n> Water them.")
})

test("a table is a table", () => {
  const copy = markdownCopy(fake({}), page("<table><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table>"), SITE)
  expect(copy).toMatch(/\| A +\| B +\|\n\| -+ \| -+ \|\n\| 1 +\| 2 +\|/)
})

test("the copied notes are the indexable notes' pages, and no tag's page", () => {
  const notes = getNotes()
  const copied = copiedNotes(notes)
  expect(copied.length).toBeGreaterThan(0)
  expect(copied.some((note) => note.url.startsWith("/tags/"))).toBe(false)
  expect(copied.some((note) => note.isPrivate)).toBe(false)
})

test("llms.txt names the site, says what it is, and lists each copy by section, with its summary", () => {
  const notes = [
    fake({ url: "/content/articles/old", title: "Old", summary: "An old one.", date: new Date("2020-01-01T00:00:00Z") }),
    fake({ url: "/content/articles/new", title: "New", summary: "A new one.", date: new Date("2026-01-01T00:00:00Z") }),
    fake({ url: "/content/notes/small-models", title: "Small Models", summary: undefined }),
    fake({ url: "/contact", title: "Contact", summary: "How to reach me." }),
  ]
  const text = llmsTxt(notes, SITE, (each) => each)
  expect(text).toMatch(/^# Chaotic Good Computing\n\n> Articles for the data and engineering consulting practice/)
  expect(text).toContain(
    [
      "## Articles",
      "",
      "- [New](https://example.com/content/articles/new.md): A new one.",
      "- [Old](https://example.com/content/articles/old.md): An old one.",
    ].join("\n"),
  )
  expect(text).toContain("## Notes\n\n- [Small Models](https://example.com/content/notes/small-models.md)\n")
  expect(text).toContain("## About the site\n\n- [Contact](https://example.com/contact.md): How to reach me.\n")
})
