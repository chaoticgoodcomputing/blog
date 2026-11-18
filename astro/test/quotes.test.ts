import { obsidianFeatures, obsidianSyntax } from "@chaoticgoodcomputing/obsidian-markdown"
import { markdownToHtml } from "satteri"
import { expect, test } from "vitest"
import { calloutIcons } from "../src/lib/callouts.ts"
import { quotes } from "../src/lib/quotes.ts"

/** A note rendered with Obsidian's syntax, the callouts' icons and the quotes' marks, without the icons. */
async function render(source: string): Promise<string> {
  const { html } = await markdownToHtml(source, {
    features: obsidianFeatures,
    mdastPlugins: obsidianSyntax({ tags: false }),
    hastPlugins: [calloutIcons(), quotes()],
  })
  return html.trim().replace(/<svg .*?<\/svg>/g, "")
}

test("a blockquote is a quote whose words are its own", async () => {
  expect(await render("> Some words.")).toBe('<blockquote class="quote quote-body">\n<p>Some words.</p>\n</blockquote>')
})

test("a quote or paraphrase callout is a quote whose words are its content, and any other callout is not", async () => {
  for (const type of ["quote", "cite", "paraphrase"]) {
    expect(await render(`> [!${type}]\n> Some words.`), type).toMatch(
      /^<div class="callout quote" [^>]*><div class="callout-title">[^<]*<\/div><div class="callout-content quote-body"><p>Some words\.<\/p><\/div><\/div>$/,
    )
  }
  expect(await render("> [!note]\n> Some words.")).not.toContain("quote")
})

test("a quote's last paragraph, when it begins with a dash, is its attribution, the dash as written", async () => {
  for (const dash of ["--", "—"]) {
    const html = await render(`> [!paraphrase]\n> Some words.\n>\n> ${dash} Someone, *Somewhere* (2026)`)
    expect(html, dash).toMatch(/<p>Some words\.<\/p><p class="quote-attribution">(?:--|–|—) Someone, <em>Somewhere<\/em> \(2026\)<\/p>/)
  }
  expect(await render("> Some words.\n>\n> -- Someone")).toContain('<p class="quote-attribution">')
})

test("a quote has no attribution when its dash isn't the start of its last paragraph", async () => {
  expect(await render("> Some words.\n>\n> -- Someone\n>\n> More words.")).not.toContain("quote-attribution")
  expect(await render("> Some words -- Someone")).not.toContain("quote-attribution")
  expect(await render("> Some words.\n>\n> --Someone")).not.toContain("quote-attribution")
  expect(await render("> [!note]\n> Some words.\n>\n> -- Someone")).not.toContain("quote-attribution")
})
