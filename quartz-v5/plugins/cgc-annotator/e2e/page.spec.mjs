// What an annotation page is built from, on scratch sites: each note runs through the site's own
// pipeline minus the denylist (docs/adr/0002), a target no mirror can be made of still builds its
// page, and a site with no annotation page ships none of the Viewer. Asserted on the emitted HTML:
// what a reader's browser, or a crawler, is sent.
import fs from "node:fs"
import path from "node:path"
import { test, expect } from "../../../tests/harness/test.mjs"
import { editConfig, fixtureConfig } from "../../../tests/harness/site.mjs"

// The fixture config, with the plugin's options set for one build. Each build pins into a cache of
// its own, though none of these pages' documents can be fetched.
const config = (scratch, options = {}) =>
  editConfig(fixtureConfig(), (doc, entry) =>
    entry("../../plugins/cgc-annotator").set("options", doc.createNode({ cacheDir: scratch.dir("annotator-page"), ...options })),
  )

// An annotation page in the shape Annotator writes, with one annotation carrying `text`.
const annotationPage = (target, text) => {
  const json = JSON.stringify({
    text,
    target: [{ source: target, selector: [{ type: "TextQuoteSelector", exact: "a passage", prefix: "", suffix: "" }] }],
    created: "2024-01-01T00:00:00.000Z",
  })
  const comment = text.split("\n").map((line) => `>${line}`).join("\n")
  return `---\ntitle: Annotated\nannotation-target: ${target}\n---\n\n>%%\n>\`\`\`annotation-json\n>${json}\n>\`\`\`\n>%%\n>*%%HIGHLIGHT%% ==a passage==*\n>%%COMMENT%%\n${comment}\n>%%TAGS%%\n>\n^note\n`
}

// A scratch site with the plugin's options set, removed when the test that built it ends.
async function build(scratch, name, files, options) {
  const site = await scratch.site(name, { "index.md": "# home\n", ...files }, { config: config(scratch, options) })
  expect(site.code, site.output).toBe(0)
  return {
    output: site.output,
    read: (rel) => fs.readFileSync(path.join(site.public, rel), "utf8"),
    exists: (rel) => fs.existsSync(path.join(site.public, rel)),
  }
}

// The one annotation's rendered note, from the page's HTML.
const noteOf = (html) =>
  html.match(/<div class="cgc-annotator__note"[^>]*>([\s\S]*?)<\/div>(?=<p class="cgc-annotator__tags"|<time|<\/article>)/)?.[1]

const TARGET = "https://cgc-fixture.invalid/notes.pdf"
const NOTE = "---\ntitle: not frontmatter\n---\nSquared: $x^2$, from [[other]]."

test("a note is rendered by the site's transformers, less the ones that act on a whole page", async ({ scratch }) => {
  const site = await build(scratch, "pipeline", { "annotated.md": annotationPage(TARGET, NOTE), "other.md": "# other\n" })
  const note = noteOf(site.read("annotated.html"))
  expect(note, "the note is on the page").toBeDefined()
  // In: maths (Latex) and wikilinks (Obsidian-flavored markdown, crawl-links).
  expect(note).toContain('class="katex"')
  expect(note).toMatch(/<a href="[^"]*other"[^>]*class="[^"]*internal/)
  // Out, by default: note-properties, which would take the note's opening `---` block for a page's
  // frontmatter. A note has none, so it stays text.
  expect(note).toContain("title: not frontmatter")
})

test("a site's denylist leaves out the transformers it names", async ({ scratch }) => {
  const site = await build(scratch, "denylist", { "annotated.md": annotationPage(TARGET, NOTE), "other.md": "# other\n" }, {
    denylist: ["NoteProperties", "CreatedModifiedDate", "TableOfContents", "Description", "BasesTransformer", "UnlistedPages", "EncryptedPages", "Latex"],
  })
  const note = noteOf(site.read("annotated.html"))
  // Obsidian-flavored markdown still finds the maths, and nothing typesets it.
  expect(note).not.toContain("katex")
  expect(note).toContain('<code class="language-math math-inline">x^2</code>')
  expect(note).toMatch(/<a href="[^"]*other"[^>]*class="[^"]*internal/)
})

test("a target no mirror can be made of still builds its page, whose Viewer says where to read along", async ({ scratch }) => {
  const site = await build(scratch, "not-a-url", { "annotated.md": annotationPage("papers/notes.pdf", "A note.") })
  expect(site.output).toContain('its annotation-target "papers/notes.pdf" is not a URL')
  const html = site.read("annotated.html")
  // Sent as it is, before any script runs: there is no mirror to try.
  expect(html).toMatch(/<p class="cgc-annotator-viewer__notice">[^<]*read along at <span class="cgc-annotator-viewer__source">papers\/notes\.pdf<\/span>/)
  expect(html).toContain('<blockquote class="cgc-annotator__quote">a passage</blockquote>')
})

test("a site with no annotation page ships none of the Viewer", async ({ scratch }) => {
  const site = await build(scratch, "no-annotations", { "note.md": "---\ntitle: A note\nannotation-target:\n---\nAn ordinary note.\n" })
  expect(site.exists("note.html")).toBe(true)
  expect(site.exists("static/cgc-annotator")).toBe(false)
})
