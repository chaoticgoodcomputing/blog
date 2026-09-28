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
    entry("@chaoticgoodcomputing/quartz-annotator").set("options", doc.createNode({ cacheDir: scratch.dir("annotator-page"), ...options })),
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

// The page's own prose, around its annotations (docs/adr/0005): cut by H1 markers into a preface and
// an epilogue, which render through the site's pipeline and count in the page's links and text.
const block = (id, exact) => {
  const json = JSON.stringify({ text: `On ${exact}.`, target: [{ source: TARGET, selector: [{ type: "TextQuoteSelector", exact }] }] })
  return `>%%\n>\`\`\`annotation-json\n>${json}\n>\`\`\`\n>%%\n>*%%HIGHLIGHT%% ==${exact}==*\n>%%COMMENT%%\n>On ${exact}.\n>%%TAGS%%\n>\n^${id}\n`
}

const between = (html, from, to) => html.indexOf(from) !== -1 && html.indexOf(from) < html.indexOf(to)

test("an author's prose is cut into a preface before the annotations and an epilogue after them", async ({ scratch }) => {
  const page = [
    `---\ntitle: Annotated\nannotation-target: ${TARGET}\n---\n`,
    "Before any marker, which is the preface too.\n",
    "# Preface\n\nWhy I read it, beside [[other]].\n\n## A heading of the preface\n\nStill the preface.\n",
    "# Epilogue\n\nWhat I took from it, and [[third]].\n",
    "# Annotations\n",
    block("first", "the first passage"),
    "\nStray prose, under the annotations.\n\n",
    block("second", "the second passage"),
    "\n# preface\n\nMore preface, under a repeated marker.\n",
  ].join("\n")
  const site = await build(scratch, "sections", { "annotated.md": page, "other.md": "# other\n", "third.md": "# third\n" })
  const html = site.read("annotated.html")
  const preface = html.match(/<article class="cgc-annotator__preface">([\s\S]*?)<\/article>/)?.[1] ?? ""
  const epilogue = html.match(/<article class="cgc-annotator__epilogue">([\s\S]*?)<\/article>/)?.[1] ?? ""
  // Text before any marker, under "# Preface", and under the repeated marker, in the preface.
  for (const said of ["Before any marker", "Why I read it", "Still the preface", "More preface"]) expect(preface).toContain(said)
  expect(preface).toMatch(/<h2[^>]*>.*A heading of the preface/)
  expect(preface).toMatch(/<a href="[^"]*other"[^>]*class="[^"]*internal/)
  expect(epilogue).toContain("What I took from it")
  // The preface before the annotations, the epilogue after them.
  expect(between(html, "Why I read it", 'data-annotation="first"')).toBe(true)
  expect(between(html, 'data-annotation="second"', "What I took from it")).toBe(true)
  // The markers aren't rendered, and the stray prose is left out.
  expect(html).not.toMatch(/<h1[^>]*>\s*(Preface|Epilogue|Annotations)\s*</i)
  expect(html).not.toContain("Stray prose")
  // One warning each, naming the page; the build passes.
  const warnings = site.output.split("\n").filter((line) => line.includes("cgc-annotator") && line.includes("annotated.md") && !line.includes("could not mirror"))
  expect(warnings.filter((line) => /"# Annotations" isn't an annotation/.test(line))).toHaveLength(1)
  expect(warnings.filter((line) => /"# Preface" appears more than once/.test(line))).toHaveLength(1)
  expect(warnings).toHaveLength(2)
  // What the preface and epilogue link to and say counts in the page's links and text.
  const entry = JSON.parse(site.read("static/contentIndex.json"))["annotated"]
  expect(entry.links).toEqual(expect.arrayContaining(["other", "third"]))
  expect(entry.content).toContain("Why I read it")
  expect(entry.content).toContain("What I took from it")
  expect(entry.content).not.toContain("Stray prose")
})

test("a page with prose and no markers shows it all as its preface", async ({ scratch }) => {
  const page = `---\ntitle: Annotated\nannotation-target: ${TARGET}\n---\n\nNotes on the paper, with no headings.\n\n${block("only", "a passage")}`
  const site = await build(scratch, "no-markers", { "annotated.md": page })
  const html = site.read("annotated.html")
  expect(html).toMatch(/<article class="cgc-annotator__preface">\s*<p>Notes on the paper, with no headings\.<\/p>/)
  expect(html).not.toContain("cgc-annotator__epilogue")
  expect(site.output.split("\n").filter((line) => line.includes("cgc-annotator") && !line.includes("could not mirror"))).toEqual([])
})
