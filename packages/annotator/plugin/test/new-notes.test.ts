// A page's new annotation note: its path, by the settings' pattern, and its text, from a template
// or the plugin's own properties, with the page as its target.

import assert from "node:assert/strict"
import { describe, test } from "node:test"
import { fillTemplate, newNote, notePath, pageVariables, sanitize } from "../src/new-notes.ts"

const PAGE = "https://en.wikipedia.org/wiki/Pickle_(food)"
const DATE = "2026-11-05"
const pickle = pageVariables({ uri: PAGE, title: "Pickle - Wikipedia" }, DATE)

describe("a page's variables", () => {
  test("name its host without www., and its whole path as a slug", () => {
    const blog = pageVariables({ uri: "https://www.example.com/2026/05/On-Tools/" }, DATE)
    assert.equal(blog.domain, "example.com")
    assert.equal(blog.slug, "2026-05-on-tools")
    assert.equal(pickle.slug, "wiki-pickle-food")
  })
  test("slug a page with no path as index, and a page's accents away", () => {
    assert.equal(pageVariables({ uri: "https://example.com/" }, DATE).slug, "index")
    assert.equal(pageVariables({ uri: "https://fr.wikipedia.org/wiki/Cr%C3%A8me_br%C3%BBl%C3%A9e" }, DATE).slug, "wiki-creme-brulee")
  })
  test("title a page with no title by its address", () => {
    assert.equal(pageVariables({ uri: "https://example.com/a/b/" }, DATE).title, "example.com a b")
  })
})

describe("a page's sanitized title", () => {
  test("has a dash for each run of spaces and of what a file name can't hold", () => {
    assert.equal(pickle["sanitized-title"], "Pickle-Wikipedia")
    assert.equal(pageVariables({ uri: PAGE, title: 'Pickles: a "history" / part #1' }, DATE)["sanitized-title"], "Pickles-a-history-part-1")
  })
  test("names a path and fills a template", () => {
    assert.equal(notePath("{domain}/{sanitized-title}", pickle), "en.wikipedia.org/Pickle-Wikipedia")
    assert.equal(fillTemplate("---\nfile: {{sanitized-title}}\n---\n", pickle), '---\nfile: "Pickle-Wikipedia"\n---\n')
  })
})

describe("sanitizing", () => {
  test("puts underscores for what a file name can't hold", () => {
    assert.equal(sanitize('Pickles: a "history" / part #1'), "Pickles_ a _history_ _ part _1")
  })
  test("leaves no leading or trailing dot, and never nothing", () => {
    assert.equal(sanitize("..hidden. "), "hidden")
    assert.equal(sanitize("///"), "_")
  })
})

describe("a new note's path", () => {
  test("is the pattern with the page's variables, its own slashes folders", () => {
    assert.equal(notePath("public/content/annotations/highlights/{domain}/{title}.md", pickle), "public/content/annotations/highlights/en.wikipedia.org/Pickle - Wikipedia")
  })
  test("never takes a folder from a variable", () => {
    const page = pageVariables({ uri: PAGE, title: "AC/DC: Live" }, DATE)
    assert.equal(notePath("{domain}/{title}", page), "en.wikipedia.org/AC_DC_ Live")
  })
  test("is the title, with no pattern; keeps what names no variable", () => {
    assert.equal(notePath("", pickle), "Pickle - Wikipedia")
    assert.equal(notePath("{date}/{other}", pickle), "2026-11-05/{other}")
  })
})

describe("a template", () => {
  test("fills a property's whole value as a YAML string, and the body as it is", () => {
    const page = pageVariables({ uri: PAGE, title: 'Pickle: a "food"' }, DATE)
    const filled = fillTemplate("---\ntitle: {{title}}\nsource: \"from {{domain}}\"\n---\n# {{title}}\n<% tp.date.now() %>\n{{other}}\n", page)
    assert.equal(filled, `---\ntitle: "Pickle: a \\"food\\""\nsource: "from en.wikipedia.org"\n---\n# Pickle: a "food"\n<% tp.date.now() %>\n{{other}}\n`)
  })
})

describe("a new note's text", () => {
  test("has the page as its target, in place of the template's, and is a web page's", () => {
    const template = "---\ntitle: {{title}}\nannotation-target:\ndescription:\n---\nBody\n"
    assert.equal(
      newNote({ uri: PAGE, title: "Pickle" }, DATE, template),
      `---\ntitle: "Pickle"\ndescription:\nannotation-target: "${PAGE}"\nannotation-target-type: web\n---\nBody\n`,
    )
  })
  test("is a PDF's, with no target type, for a PDF", () => {
    assert.equal(newNote({ uri: "https://example.org/a.pdf", pdf: true }, DATE, "Body\n"), `---\nannotation-target: "https://example.org/a.pdf"\n---\nBody\n`)
  })
  test("has the annotation template's properties, with no template", () => {
    assert.equal(
      newNote({ uri: PAGE, title: "Pickle: a food" }, DATE),
      `---\ntitle: "Pickle: a food"\ndate: ${DATE}\ntags:\n  - writing/annotations\nannotation-target: "${PAGE}"\nannotation-target-type: web\n---\n`,
    )
  })
})
