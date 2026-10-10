import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { pathToFileURL } from "node:url"
import {
  obsidianAnnotator,
  obsidianFeatures,
  obsidianResolve,
  obsidianSyntax,
  type Vault,
} from "@chaoticgoodcomputing/obsidian-markdown"
import { markdownToHtml } from "satteri"
import { afterAll, beforeAll, expect, test } from "vitest"
import { annotatedDocument, annotationDate, isAnnotationPage } from "../src/lib/annotations.ts"
import { indexNotes } from "../src/lib/notes.ts"
import { openVault } from "../src/lib/vault.ts"

// An annotation note with one annotation, as Obsidian's Annotator writes it.
const BLOCK =
  ">%%\n" +
  ">```annotation-json\n" +
  '>{"text":"A comment.","target":[{"source":"TARGET","selector":[{"type":"TextQuoteSelector","exact":"A passage"}]}],"tags":[]}\n' +
  ">```\n" +
  ">%%\n" +
  ">*%%HIGHLIGHT%% ==A passage== *\n" +
  ">%%LINK%%[[#^abc123|show annotation]]\n" +
  ">%%COMMENT%%\n" +
  ">A comment.\n" +
  ">%%TAGS%%\n" +
  ">\n" +
  "^abc123\n"

const note = (target: string) => `---\nannotation-target: ${target}\n---\nThe preface.\n\n${BLOCK.replace("TARGET", target)}`

const FILES: Record<string, string> = {
  "on-the-web.md": note("https://media.example.com/apps/Valve_Handbook%20LowRes.pdf"),
  "on-a-host.md": note("https://example.com/"),
  "in-the-vault.md": note("papers/On Stability.pdf"),
  "papers/On Stability.pdf": "%PDF-1.4",
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
async function render(file: string): Promise<string> {
  const { html } = await markdownToHtml(FILES[file]!.replace(/^---\n[\s\S]*?\n---\n/, ""), {
    features: obsidianFeatures,
    mdastPlugins: [
      ...obsidianSyntax({ tags: false }),
      obsidianAnnotator({ vault }),
      annotatedDocument(),
      obsidianResolve({ vault, urlFor: indexNotes(vault, []).urlOf }),
    ],
    fileURL: pathToFileURL(path.join(root, file)),
  })
  return html.replace(/>\n+</g, "><").trim()
}

test("a note's page is an annotation page when the note has an annotation target", () => {
  expect(isAnnotationPage({ frontmatter: { "annotation-target": "https://example.com/a.pdf" } })).toBe(true)
  // The vault's prelude to Lean Software Development has the property, empty.
  expect(isAnnotationPage({ frontmatter: { "annotation-target": null } })).toBe(false)
  expect(isAnnotationPage({ frontmatter: { title: "A note" } })).toBe(false)
})

const documentLink = (html: string) => /<p class="annotated-document">.*?<\/p>/.exec(html)?.[0]

test("an annotation page opens with the annotated document's source, a link to it named by its host", async () => {
  const html = await render("on-the-web.md")
  expect(html.startsWith('<p class="annotated-document">')).toBe(true)
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

test("the annotations are headed as such", async () => {
  expect(await render("on-the-web.md")).toContain('<section class="annotations" data-annotation-target="https://media.example.com/apps/Valve_Handbook%20LowRes.pdf"><h2 class="annotations-heading">Annotations</h2><article class="annotation"')
})

test("an annotation's date is written as the site writes dates", () => {
  expect(annotationDate(new Date("2026-03-26T16:24:56.949Z"))).toBe("Mar 26, 2026")
})
