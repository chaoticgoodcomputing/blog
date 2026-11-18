// Wikilinks in a published comment, as links to the notes' pages on the site.

import assert from "node:assert/strict"
import { describe, test } from "node:test"
import { type LinkedFile, pageUrl, publicMarkdown, slugFor } from "../src/public-markdown.ts"

const SITE = { url: "https://example.com", roots: ["public", "private"] }

const FILES: Record<string, LinkedFile> = {
  "Some Note": { path: "public/notes/Some Note.md", headings: ["Intro", "Why & how", "Intro"] },
  Secret: { path: "private/notes/Secret.md", headings: [] },
  Template: { path: "templates/Template.md", headings: [] },
  picture: { path: "public/assets/picture.png", headings: [] },
  "": { path: "public/annotations/This Page.md", headings: [] },
  Index: { path: "public/index.md", headings: [] },
}
const resolve = (linkpath: string) => FILES[linkpath]
const convert = (comment: string) => publicMarkdown(comment, resolve, SITE)

describe("publicMarkdown", () => {
  test("a wikilink to a note under a site folder links to its page", () => {
    assert.equal(convert("See [[Some Note]]."), "See [Some Note](https://example.com/notes/Some-Note).")
  })

  test("a private note's page is linked too, as is one not published yet", () => {
    assert.equal(convert("[[Secret]]"), "[Secret](https://example.com/notes/Secret)")
  })

  test("an alias is the link's text", () => {
    assert.equal(convert("[[Some Note|that note]]"), "[that note](https://example.com/notes/Some-Note)")
  })

  test("a heading links to its anchor, numbered as the site numbers it", () => {
    assert.equal(convert("[[Some Note#Why & how]]"), "[Some Note > Why & how](https://example.com/notes/Some-Note#why--how)")
    assert.equal(convert("[[Some Note#Intro]]"), "[Some Note > Intro](https://example.com/notes/Some-Note#intro)")
  })

  test("a block links to its anchor", () => {
    assert.equal(convert("[[Some Note#^abc123]]"), "[Some Note > abc123](https://example.com/notes/Some-Note#^abc123)")
  })

  test("a link to the note itself", () => {
    assert.equal(convert("[[#^abc123|above]]"), "[above](https://example.com/annotations/This-Page#^abc123)")
  })

  test("a folder's index is the folder", () => {
    assert.equal(convert("[[Index]]"), "[Index](https://example.com/)")
  })

  test("a note outside the site's folders, a file that is no note, and a link to nothing are their text", () => {
    assert.equal(convert("[[Template]], ![[picture]], [[Nowhere|gone]]"), "Template, picture, gone")
  })

  test("code is left alone", () => {
    assert.equal(convert("`[[Some Note]]` and\n```\n[[Some Note]]\n```"), "`[[Some Note]]` and\n```\n[[Some Note]]\n```")
  })

  test("with no site, every link is its text", () => {
    assert.equal(publicMarkdown("[[Some Note]]", resolve, { url: "", roots: ["public"] }), "Some Note")
  })
})

describe("the site's addresses", () => {
  test("slugs follow the site's rule", () => {
    assert.equal(slugFor("a/Tom & Jerry 100%?.md"), "a/Tom--and--Jerry-100-percent")
  })

  test("parentheses are escaped, so the Markdown link holds", () => {
    assert.equal(pageUrl("public/A (B).md", SITE), "https://example.com/A-%28B%29")
  })
})
