import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { obsidianFeatures, obsidianResolve, obsidianSyntax, type Vault } from "@chaoticgoodcomputing/obsidian-markdown"
import { addAnnotation, readNote, type AnnotationContent } from "@chaoticgoodcomputing/web-annotations"
import { parse, type HTMLElement } from "node-html-parser"
import { markdownToHtml } from "satteri"
import { afterAll, beforeAll, expect, test } from "vitest"
import {
  annotatedDocument,
  annotatedFileType,
  annotationAnchors,
  annotationDate,
  annotationPropertiesOf,
  annotationSection,
  isAnnotationPage,
  passageAddress,
  passageLinks,
  readAnnotations,
  webAnnotationTarget,
} from "../src/lib/annotations.ts"
import { indexNotes } from "../src/lib/notes.ts"
import { sidenotes } from "../src/lib/sidenotes.ts"
import { openVault } from "../src/lib/vault.ts"

// Annotation blocks as the Annotator writes them: by web-annotations itself, with the time, the block
// id and the record's id fixed.
let uuids = 0
function annotate(text: string, blockId: string, content: AnnotationContent, now = "2026-03-26T16:16:11.698Z"): string {
  const uuid = () => `00000000-0000-4000-8000-${String(++uuids).padStart(12, "0")}`
  return addAnnotation(text, content, { now: () => now, blockId: () => blockId, uuid }).text
}

const HANDBOOK = "https://example.com/handbook.pdf"
const passage = (source: string, exact: string, place?: { start: number; prefix?: string; suffix?: string }) => ({
  source,
  selector: [
    ...(place ? [{ type: "TextPositionSelector", start: place.start, end: place.start + exact.length }] : []),
    { type: "TextQuoteSelector", exact, prefix: place?.prefix ?? "", suffix: place?.suffix ?? "" },
  ],
})

/** An annotation note on `target`: its frontmatter, a preface, one annotation, and an epilogue. */
function note(target: string, frontmatter = "") {
  const text = annotate(`---\nannotation-target: "${target}"\n${frontmatter}---\nThe preface.\n`, "abc123", {
    comment: "A comment.",
    target: passage(target, "A passage"),
  })
  return `${text}\nThe epilogue.\n`
}

// The handbook: two annotations, written in the order the document doesn't have them, with a
// comment that links to another note and one with tags.
let handbook = `---\nannotation-target: ${HANDBOOK}\n---\nWhy I read it.\n`
handbook = annotate(handbook, "adventure", {
  comment: "The first line a new employee sees.\n\nSee [[flatland]].",
  target: passage(HANDBOOK, "A fearless adventure", { start: 162, prefix: "E M P L O Y E E S", suffix: "FIRST EDITION" }),
})
handbook = annotate(
  handbook,
  "welcome",
  { comment: "Read this **twice**.", tags: ["management", "flat orgs"], target: passage(HANDBOOK, "Welcome to Flatland", { start: 40 }) },
  "2026-03-26T16:24:56.949Z",
)
handbook += "\nWhat I took from it.\n"

// A web page's note, as the Annotator extension has the plugin write it.
const PICKLE = "https://example.org/pickle"
const pickle = annotate(`---\nannotation-target: "${PICKLE}"\nannotation-target-type: web\n---\n`, "pickle1", {
  comment: "Brined.",
  target: passage(PICKLE, "A pickle is a cucumber", { start: 0, prefix: "Introduction. ", suffix: " kept in brine." }),
})

// The handbook's second block, broken: its record no longer JSON.
const broken = (() => {
  const [, welcome] = readNote(handbook).annotations
  const block = handbook.slice(welcome!.span.start, welcome!.span.end)
  return handbook.replace(block, block.replace('{"@context"', '{"@context":'))
})()

const FILES: Record<string, string> = {
  "pickle.md": pickle,
  "handbook.md": handbook,
  "broken.md": broken,
  "flatland.md": "Flatland.\n",
  "quoted.md": "See [[handbook#^adventure|the adventure]].\n\n![[handbook#^welcome]]\n",
  "no-target.md": handbook.replace(/^---\n[\s\S]*?\n---\n/, "---\ntitle: Not an annotation note\n---\n"),
  "on-the-web.md": note("https://media.example.com/apps/Valve_Handbook%20LowRes.pdf"),
  "on-a-host.md": note("https://example.com/"),
  "in-the-vault.md": note("papers/On Stability.pdf"),
  "papers/On Stability.pdf": "%PDF-1.4",
  "footnoted-preface.md": `${handbook.replace("Why I read it.", "Why I read it.[^why]").replace("\nWhat I took from it.\n", "")}\n[^why]: A reason.\n`,
  "footnoted.md": `${handbook.replace("Why I read it.", "Why I read it.[^why]").replace("What I took from it.", "What I took from it.[^took]")}\n[^why]: A reason.\n[^took]: A lesson.\n`,
}

let root: string
let vault: Vault

beforeAll(async () => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "astro-annotations-"))
  for (const [file, contents] of Object.entries(FILES)) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
    fs.writeFileSync(path.join(root, file), contents)
  }
  vault = await openVault(root)
})

afterAll(() => fs.rmSync(root, { recursive: true, force: true }))

// The site's pipeline around annotations: the syntax, the annotations, the link to the document,
// then the resolver, with every file at the address the site gives it (`urlOf`, from the notes
// query over this vault).
async function render(file: string, options: { formatDate?: (date: Date) => string; sidenotes?: boolean } = {}): Promise<string> {
  const section = annotationSection({ vault, ...options })
  const { html } = await markdownToHtml(FILES[file]!.replace(/^---\n[\s\S]*?\n---\n/, ""), {
    features: obsidianFeatures,
    mdastPlugins: [
      ...obsidianSyntax({ tags: false }),
      section,
      annotatedDocument(),
      obsidianResolve({ vault, urlFor: indexNotes(vault, []).urlOf, beforeResolve: [section] }),
    ],
    hastPlugins: [passageLinks(), annotationAnchors(), ...(options.sidenotes ? [sidenotes()] : [])],
    fileURL: pathToFileURL(path.join(root, file)),
  })
  return html.replace(/>\n+</g, "><").trim()
}

const ids = (html: string) => [...html.matchAll(/<article class="annotation" id="([^"]+)"/g)].map((match) => match[1])

// ─── A note's annotation properties ─────────────────────────────────────────────────────────────

test("a note's page is an annotation page when the note has an annotation target", () => {
  expect(isAnnotationPage({ frontmatter: { "annotation-target": "https://example.com/a.pdf" } })).toBe(true)
  // The vault's prelude to Lean Software Development has the property, empty.
  expect(isAnnotationPage({ frontmatter: { "annotation-target": null } })).toBe(false)
  expect(isAnnotationPage({ frontmatter: { title: "A note" } })).toBe(false)
})

test("a note's page range is a set of pages, however it is written", () => {
  const pages = (value: unknown) => annotationPropertiesOf({ frontmatter: { "annotation-target": HANDBOOK, "annotation-pages": value } })?.pages
  expect(pages("12-40")).toEqual([[12, 40]])
  expect(pages(7)).toEqual([[7, 7]])
  expect(pages("9, 3–5")).toEqual([[3, 5], [9, 9]])
  expect(pages("12-20, 21-30, 25-40")).toEqual([[12, 40]])
  expect(annotationPropertiesOf({ frontmatter: { "annotation-target": HANDBOOK } })?.pages).toBeUndefined()
})

test("a malformed page range fails the build, naming the note", () => {
  const malformed = { frontmatter: { "annotation-target": HANDBOOK, "annotation-pages": "5-2" }, file: { path: "annotations/handbook.md" } }
  expect(() => annotationPropertiesOf(malformed)).toThrow(/^annotations\/handbook\.md: annotation-pages: .*"5-2"/)
  expect(() => isAnnotationPage(malformed)).toThrow(/annotations\/handbook\.md/)
})

test("a web page's note names the page; any other note, a PDF's among them, names none", () => {
  expect(webAnnotationTarget({ frontmatter: { "annotation-target": PICKLE, "annotation-target-type": "web" } })).toBe(PICKLE)
  expect(webAnnotationTarget({ frontmatter: { "annotation-target": HANDBOOK } })).toBeUndefined()
  expect(webAnnotationTarget({ frontmatter: { title: "A note" } })).toBeUndefined()
})

test("an annotation page is marked by the kind of file it annotates, from the extension its address ends in", () => {
  const page = (target: unknown, isPrivate = false) => ({ frontmatter: { "annotation-target": target }, isPrivate })
  expect(annotatedFileType(page("https://example.com/papers/On%20Meetings.pdf"))).toBe("pdf")
  expect(annotatedFileType(page("https://cdn.example.com/a/Triad.PDF?ex=69d5&hm=b7be"))).toBe("pdf")
  expect(annotatedFileType(page("https://example.com/papers/"))).toBeUndefined()
  expect(annotatedFileType({ frontmatter: {}, isPrivate: false })).toBeUndefined()
  // A web page annotated in the browser, whatever its address ends in.
  const web = { "annotation-target": "https://example.org/notes.html", "annotation-target-type": "web" }
  expect(annotatedFileType({ frontmatter: web, isPrivate: false })).toBe("web")
  expect(annotatedFileType({ frontmatter: web, isPrivate: true })).toBeUndefined()
  // A private page says nothing of what it is.
  expect(annotatedFileType(page("https://example.com/papers/On%20Meetings.pdf", true))).toBeUndefined()
})

// ─── Reading annotations ────────────────────────────────────────────────────────────────────────

test("an annotation is read from its record and its comment: its quote, its place, its comment, its tags and its date", () => {
  const { annotations, unreadable } = readAnnotations(handbook)
  expect(unreadable).toEqual([])
  expect(annotations[1]).toEqual({
    id: "adventure",
    exact: "A fearless adventure",
    prefix: "E M P L O Y E E S",
    suffix: "FIRST EDITION",
    start: 162,
    comment: "The first line a new employee sees.\n\nSee [[flatland]].",
    tags: [],
    created: "2026-03-26T16:16:11.698Z",
  })
  expect(annotations[0]).toMatchObject({ id: "welcome", tags: ["management", "flat orgs"], created: "2026-03-26T16:24:56.949Z" })
})

// Written in this order: the adventure, Flatland, a reply to Flatland. The document has Flatland first.
let threaded = `---\nannotation-target: ${HANDBOOK}\n---\n`
threaded = annotate(threaded, "adventure", { comment: "On the adventure.", target: passage(HANDBOOK, "A fearless adventure", { start: 162 }) })
threaded = annotate(threaded, "flatland", { comment: "On Flatland.", target: passage(HANDBOOK, "Welcome to Flatland", { start: 40 }) })
threaded = annotate(threaded, "reply", { comment: "Thinking about it more.", replyTo: "flatland" })
const order = (text: string) => readAnnotations(text).annotations.map((annotation) => annotation.id)

test("annotations are read in the order of the document, and a reply directly after what it answers", () => {
  expect(order(threaded)).toEqual(["flatland", "reply", "adventure"])
})

test("a reply to a reply follows the reply it answers", () => {
  expect(order(annotate(threaded, "again", { comment: "And again.", replyTo: "reply" }))).toEqual(["flatland", "reply", "again", "adventure"])
})

test("a reply to an annotation the note does not have comes last, as an annotation of no passage does", () => {
  const blocks = readNote(threaded).annotations.map(({ span }) => threaded.slice(span.start, span.end))
  // The reply's block, and the adventure's, without Flatland, which the reply answers.
  expect(order(`${blocks[2]}\n${blocks[0]}`)).toEqual(["adventure", "reply"])
})

// ─── The section of annotations ─────────────────────────────────────────────────────────────────

test("a preface and an epilogue that cite footnotes keep their columns, each block wrapped with its sidenotes in them", async () => {
  const page = parse(await render("footnoted.md", { sidenotes: true }))
  const top = page.childNodes.filter((node) => node.nodeType === 1) as HTMLElement[]
  expect(top.map((element) => element.classList.value[0] ?? element.tagName)).toEqual([
    "annotation-preface",
    "annotated-document",
    "annotations",
    "annotation-epilogue",
    "footnotes",
  ])
  expect(page.querySelectorAll(".annotation-preface > .sidenoted > aside.sidenote").map((note) => note.id)).toEqual(["user-content-sn-why"])
  expect(page.querySelectorAll(".annotation-epilogue > .sidenoted > aside.sidenote").map((note) => note.id)).toEqual(["user-content-sn-took"])
})

test("a note's footnotes are no part of its epilogue, which a note with none but them doesn't have", async () => {
  const page = parse(await render("footnoted-preface.md"))
  const top = page.childNodes.filter((node) => node.nodeType === 1) as HTMLElement[]
  expect(top.map((element) => element.classList.value[0] ?? element.tagName)).toEqual(["annotation-preface", "annotated-document", "annotations", "footnotes"])
})

test("an annotation note is its preface, its annotations in the document's order, then its epilogue", async () => {
  const html = await render("handbook.md")
  expect(html).toMatch(/^<div class="annotation-preface"><p>Why I read it\.<\/p><\/div>/)
  expect(html).toMatch(/<\/section><div class="annotation-epilogue"><p>What I took from it\.<\/p><\/div>$/)
  // The passage at character 40 comes before the one at 162, though it was written after it.
  expect(ids(html)).toEqual(["^welcome", "^adventure"])
})

test("an annotation is its passage, then its comment rendered as Markdown with its wikilinks resolved", async () => {
  const card = /<article class="annotation" id="\^adventure">.*?<\/article>/s.exec(await render("handbook.md"))?.[0]
  expect(card).toMatch(
    new RegExp(
      '^<article class="annotation" id="\\^adventure"><blockquote class="annotation-highlight"><p>A fearless adventure</p></blockquote>' +
        '<div class="annotation-comment"><p>The first line a new employee sees.</p>' +
        '<p>See <a class="internal-link" href="/flatland" data-href="flatland">flatland</a>.</p></div><a class="annotation-anchor"',
    ),
  )
})

test("an annotation's tags follow its comment, and its date is written last, as the site writes dates", async () => {
  expect(await render("handbook.md", { formatDate: annotationDate })).toContain(
    '<div class="annotation-comment"><p>Read this <strong>twice</strong>.</p></div>' +
      '<ul class="annotation-tags"><li class="annotation-tag">#management</li><li class="annotation-tag">#flat orgs</li></ul>' +
      '<time class="annotation-date" datetime="2026-03-26T16:24:56.949Z">Mar 26, 2026</time>',
  )
  expect(await render("handbook.md")).not.toContain("<time")
})

test("an annotation's date is written as the site writes dates", () => {
  expect(annotationDate(new Date("2026-03-26T16:24:56.949Z"))).toBe("Mar 26, 2026")
})

test("none of an annotation block's own markup reaches the page", async () => {
  const html = await render("handbook.md")
  for (const written of ["%%", "```", "[!annotation]", "urn:uuid", "TextQuoteSelector", "@context", "^adventure\n"]) expect(html).not.toContain(written)
})

test("a link to an annotation goes to its anchor, and an embed of one shows it", async () => {
  const html = await render("quoted.md")
  expect(html).toContain('<a class="internal-link" href="/handbook#^adventure" data-href="handbook#^adventure">the adventure</a>')
  expect(html).toMatch(/<div class="markdown-embed-content"><article class="annotation"><blockquote class="annotation-highlight"><p>Welcome to Flatland<\/p>/)
})

test("in a note with no annotation target, an annotation block is left as Markdown", async () => {
  const html = await render("no-target.md")
  expect(html).not.toContain('class="annotation')
})

test("a block that can't be read is left out, and the rest are shown", async () => {
  const html = await render("broken.md")
  expect(ids(html)).toEqual(["^adventure"])
  expect(html).not.toContain("Welcome to Flatland")
})

const documentLink = (html: string) => /<p class="annotated-document">.*?<\/p>/.exec(html)?.[0]

test("an annotation page's preface is followed by the annotated document's source, a link to it named by its host, then its annotations", async () => {
  const html = await render("on-the-web.md")
  expect(html).toMatch(/^<div class="annotation-preface">.*<\/div><p class="annotated-document">.*?<\/p><section class="annotations"/s)
  expect(html).toMatch(/<\/section><div class="annotation-epilogue"><p>The epilogue.<\/p><\/div>$/)
  expect(html.match(/class="annotation-preface"/g)).toHaveLength(1)
  expect(documentLink(html)).toBe(
    '<p class="annotated-document">Source document: ' +
      '<a href="https://media.example.com/apps/Valve_Handbook%20LowRes.pdf">media.example.com</a></p>',
  )
  expect(documentLink(await render("on-a-host.md"))).toBe(
    '<p class="annotated-document">Source document: <a href="https://example.com/">example.com</a></p>',
  )
})

test("a document in the vault is linked where the site publishes it, named by its file", async () => {
  expect(documentLink(await render("in-the-vault.md"))).toBe(
    '<p class="annotated-document">Source document: ' +
      '<a href="/papers/On%20Stability.pdf" class="internal-link" data-href="papers/On Stability.pdf">On Stability.pdf</a></p>',
  )
})

test("the annotations are headed as such, in a section that names the annotated document", async () => {
  expect(await render("on-the-web.md")).toContain(
    '<section class="annotations" data-annotation-target="https://media.example.com/apps/Valve_Handbook%20LowRes.pdf"><h2 class="annotations-heading">Annotations</h2><article class="annotation"',
  )
})

test("each annotation's card ends with a link to itself, for the pointer alone", async () => {
  const card = /<article class="annotation" id="\^abc123">.*?<\/article>/s.exec(await render("on-the-web.md"))?.[0]
  expect(card).toMatch(/<a class="annotation-anchor" href="#\^abc123" aria-hidden="true" tabindex="-1"><svg[^>]*>.*<\/svg><\/a><\/article>$/s)
})

// ─── Web pages ──────────────────────────────────────────────────────────────────────────────────

test("a web page is cited by its host", async () => {
  expect(documentLink(await render("pickle.md"))).toBe('<p class="annotated-document">From <a href="https://example.org/pickle">example.org</a></p>')
  expect(await render("pickle.md")).toContain('<section class="annotations" data-annotation-target="https://example.org/pickle" data-annotation-target-type="web">')
})

test("a passage's address is its page's, with a text fragment for it and the words either side", () => {
  expect(
    passageAddress("https://example.org/pickle#history", { exact: "A pickle is a cucumber", prefix: "So, the long Introduction. ", suffix: " kept in brine, mostly." }),
  ).toBe("https://example.org/pickle#:~:text=the%20long%20Introduction.-,A%20pickle%20is%20a%20cucumber,-kept%20in%20brine%2C")
  expect(passageAddress("https://example.org/a", { exact: "one two three four five six seven eight nine ten eleven twelve" })).toBe(
    "https://example.org/a#:~:text=one%20two%20three%20four%20five,eight%20nine%20ten%20eleven%20twelve",
  )
  expect(passageAddress("https://example.org/a", { exact: "well-known" })).toBe("https://example.org/a#:~:text=well%2Dknown")
})

test("a web page's passage is a quote callout linking to it in the page, and a PDF's a plain quote", async () => {
  const passage = /<a class="annotation-passage".*?<\/a>/s.exec(await render("pickle.md"))?.[0] ?? ""
  expect(passage).toMatch(
    /^<a class="annotation-passage" href="https:\/\/example\.org\/pickle#:~:text=Introduction\.-,A%20pickle%20is%20a%20cucumber,-kept%20in%20brine\." target="_blank" rel="noopener" title="Read it in context">/,
  )
  expect(passage).toMatch(/<div class="callout" data-callout="quote" data-callout-kind="quote"><div class="callout-title"><svg/)
  expect(passage).toMatch(/Quote<\/div><div class="callout-content"><p>A pickle is a cucumber<\/p><\/div><\/div><\/a>$/)
  const pdf = await render("on-the-web.md")
  expect(pdf).toContain('<blockquote class="annotation-highlight"><p>A passage</p></blockquote>')
  expect(pdf).not.toContain("annotation-passage")
  expect(await render("handbook.md")).not.toMatch(/cite=/)
})
