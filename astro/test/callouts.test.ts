import { obsidianFeatures, obsidianSyntax } from "@chaoticgoodcomputing/obsidian-markdown"
import { markdownToHtml } from "satteri"
import { expect, test } from "vitest"
import { calloutIcons } from "../src/lib/callouts.ts"

/** A note rendered with Obsidian's syntax and the callouts' icons. */
async function render(source: string): Promise<string> {
  const { html } = await markdownToHtml(source, {
    features: obsidianFeatures,
    mdastPlugins: obsidianSyntax({ tags: false }),
    hastPlugins: [calloutIcons()],
  })
  return html.trim()
}

/** The HTML with each icon's drawing, its `<path>`, left out. */
const outline = (html: string) => html.replace(/<path [^>]*><\/path>/g, "")

/** The drawing of the icon a callout of `type` begins its title with. */
const iconOf = async (type: string) =>
  /<svg [^>]*class="callout-icon"[^>]*><path fill="currentColor" d="([^"]+)"/.exec(await render(`> [!${type}]\n> Body`))?.[1]

/** The kind a callout of `type` is drawn as. */
const kindOf = async (type: string) => /data-callout-kind="([^"]+)"/.exec(await render(`> [!${type}]\n> Body`))?.[1]

test("a callout's title begins with its kind's icon, hidden from a screen reader, and the callout says its kind", async () => {
  expect(outline(await render("> [!warning] Mind the gap\n> The body."))).toBe(
    '<div class="callout" data-callout="warning" data-callout-kind="warning">' +
      '<div class="callout-title"><svg viewBox="0 0 24 24" width="1em" height="1em" class="callout-icon" aria-hidden="true"></svg>Mind the gap</div>' +
      '<div class="callout-content"><p>The body.</p></div></div>',
  )
})

test("each kind has an icon of its own", async () => {
  const kinds = ["note", "abstract", "info", "todo", "tip", "success", "question", "warning", "failure", "danger", "bug", "example", "quote", "paraphrase"]
  const icons = await Promise.all(kinds.map(iconOf))
  expect(icons.every((d) => d !== undefined)).toBe(true)
  expect(new Set(icons).size).toBe(kinds.length)
})

test("a type Obsidian reads as another kind is drawn as that kind, and a type it doesn't know as a note", async () => {
  const types = ["summary", "tldr", "hint", "important", "check", "done", "help", "faq", "caution", "attention", "fail", "missing", "error", "cite", "update"]
  const kinds = await Promise.all(types.map(kindOf))
  expect(Object.fromEntries(types.map((type, index) => [type, kinds[index]]))).toEqual({
    summary: "abstract",
    tldr: "abstract",
    hint: "tip",
    important: "tip",
    check: "success",
    done: "success",
    help: "question",
    faq: "question",
    caution: "warning",
    attention: "warning",
    fail: "failure",
    missing: "failure",
    error: "danger",
    cite: "quote",
    update: "note",
  })
})

test("a callout that folds ends its title with a fold icon", async () => {
  expect(outline(await render("> [!tip]- Folded\n> Body"))).toMatch(
    /^<details class="callout" data-callout="tip" data-callout-kind="tip"><summary class="callout-title"><svg [^>]*class="callout-icon"[^>]*><\/svg>Folded<svg [^>]*class="callout-fold" aria-hidden="true"><\/svg><\/summary>/,
  )
})

test("a callout inside a callout has its own icon", async () => {
  const html = await render("> [!note] Outer\n> > [!bug] Inner\n> > Body")
  expect(html.match(/class="callout-icon"/g)).toHaveLength(2)
  expect(html).toContain('data-callout="bug" data-callout-kind="bug"')
})

test("a paraphrase is a kind of its own, its paragraphs as written", async () => {
  const html = outline(await render("> [!PARAPHRASE]\n>\n> Yes, roughly.\n>\n> -- Someone, *Somewhere* (2026)"))
  expect(html).toContain('data-callout="paraphrase" data-callout-kind="paraphrase"')
  expect(html).toContain("<p>Yes, roughly.</p><p>-- Someone, <em>Somewhere</em> (2026)</p>")
})
