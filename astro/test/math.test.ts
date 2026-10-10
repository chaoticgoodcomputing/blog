import { obsidianFeatures, obsidianSyntax } from "@chaoticgoodcomputing/obsidian-markdown"
import { markdownToHtml, mdxToJs } from "satteri"
import { expect, test } from "vitest"
import { hasMath, math } from "../src/lib/math.ts"

/** A note as the site's Markdown pipeline renders it, with the frontmatter Astro hands its plugins. */
async function render(source: string) {
  const frontmatter: Record<string, unknown> = {}
  const { html } = await markdownToHtml(source, {
    features: obsidianFeatures,
    mdastPlugins: obsidianSyntax(),
    hastPlugins: [math()],
    data: { astro: { frontmatter, headings: [], localImagePaths: new Set(), remoteImagePaths: new Set() } },
  })
  return { html: html.trim(), frontmatter }
}

test("inline math is typeset into the page, with its source kept for assistive technology", async () => {
  const { html } = await render("Area is $x^2$.")
  expect(html).toMatch(/^<p>Area is <span class="katex"><span class="katex-mathml"><math>/)
  expect(html).toContain('<annotation encoding="application/x-tex">x^2</annotation>')
  expect(html).not.toContain("<code")
})

test("typeset math is MathML as HTML writes it, with no namespace attribute of its own", async () => {
  const { html } = await render("Area is $x^2$.\n\n$$\ny = 1\n$$")
  expect(html.match(/<math[^>]*>/g)).toEqual(["<math>", '<math display="block">'])
})

test("a heading with math has the anchor a link to it is given: its text with the math as written", async () => {
  const { html } = await render("## The $x$ value\n\n## Plain\n\n## The $x$ value\n\n## Plain")
  expect([...html.matchAll(/<h2 id="([^"]*)"/g)].map(([, id]) => id)).toEqual([
    "the-x-value",
    "plain",
    "the-x-value-1",
    "plain-1",
  ])
})

test("a heading of a note with no math in its headings is left for Astro to give its anchor", async () => {
  const { html } = await render("## Plain\n\nArea is $x^2$.")
  expect(html).toMatch(/^<h2>Plain<\/h2>/)
})

test("a math block, and $$ math within a line, are typeset as display math", async () => {
  const { html } = await render("$$\nx = 1\n$$\n\nThe odds: $$y = 2$$")
  expect(html).toMatch(/^<span class="katex-display"><span class="katex">/)
  expect(html).toMatch(/<p>The odds: <span class="katex-display"><span class="katex">/)
  expect(html).not.toContain("<pre")
})

test("a note with math says so, and one without says nothing", async () => {
  expect(hasMath((await render("Area is $x^2$.")).frontmatter)).toBe(true)
  expect(hasMath((await render("It costs $5 and then $10 more.")).frontmatter)).toBe(false)
})

test("math that KaTeX can't read is shown as written, and the note still builds", async () => {
  const { html } = await render(String.raw`Oops: $\frac{1}$`)
  expect(html).toContain('class="katex-error"')
  expect(html).toContain(String.raw`>\frac{1}</span>`)
})

test("math in an MDX note is typeset too", async () => {
  const { code } = await mdxToJs("Area is $x^2$.\n\n<Widget />\n", {
    features: obsidianFeatures,
    mdastPlugins: obsidianSyntax(),
    hastPlugins: [math()],
  })
  expect(code).toContain('className: "katex"')
})
