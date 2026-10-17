import assert from "node:assert/strict"
import { test } from "node:test"
import { checkStub, isInternal } from "./guard-private.ts"

const PLACEHOLDER = "This note is private.\n\nAsk me about it!\n"
const FILE = "dist/vault-private/content/notes/x.md"

const FRONTMATTER = '---\ntitle: "A note"\ndate: "2026-02-01T00:00:00.000Z"\ntags:\n  - "projects"\n  - "private"\n---\n\n'
const LINKS = "\n## Links\n\nThis note originally contained the following links:\n\n"

const stub = (body = PLACEHOLDER, frontmatter = FRONTMATTER) => `${frontmatter}${body}`
const problems = (text: string, file = FILE) => checkStub(file, text, PLACEHOLDER)

test("a placeholder passes", () => {
  assert.deepEqual(problems(stub()), [])
})

test("a placeholder with internal links passes", () => {
  const body = `${PLACEHOLDER}${LINKS}- [Day](/content/notes/periodic/daily/2026-02-01)\n- [Tag](tags/projects)\n- [Home](https://blog.chaoticgood.computer/)\n`
  assert.deepEqual(problems(stub(body)), [])
})

test("a stub with no title or date passes", () => {
  assert.deepEqual(problems(stub(PLACEHOLDER, '---\ntags:\n  - "private"\n---\n\n')), [])
})

test("a file other than .md fails", () => {
  assert.deepEqual(problems("anything", "dist/vault-private/content/notes/x.json"), ["is not a .md file"])
})

test("a stub without frontmatter fails", () => {
  assert.deepEqual(problems(PLACEHOLDER), ["does not start with frontmatter"])
})

test("an extra frontmatter field fails", () => {
  const frontmatter = FRONTMATTER.replace("tags:", 'description: "secret"\ntags:')
  assert.deepEqual(problems(stub(PLACEHOLDER, frontmatter)), ["frontmatter has a field other than title, date, tags and draft (`description`)"])
})

test("a YAML comment or block value in the frontmatter fails", () => {
  for (const line of ["# a comment", "  more text"]) {
    const frontmatter = FRONTMATTER.replace("tags:", `${line}\ntags:`)
    assert.equal(problems(stub(PLACEHOLDER, frontmatter)).length, 1, line)
  }
})

test("a title that isn't a quoted string fails", () => {
  const frontmatter = FRONTMATTER.replace('title: "A note"', "title: |")
  assert.deepEqual(problems(stub(PLACEHOLDER, frontmatter)), ["`title` is not a quoted string"])
})

test("a draft passes", () => {
  assert.deepEqual(problems(stub(PLACEHOLDER, FRONTMATTER.replace("---\n\n", "draft: true\n---\n\n"))), [])
})

test("a draft flag other than true fails", () => {
  for (const value of ["false", '"secret"', ""]) {
    const frontmatter = FRONTMATTER.replace("---\n\n", `draft:${value ? ` ${value}` : ""}\n---\n\n`)
    assert.deepEqual(problems(stub(PLACEHOLDER, frontmatter)), ["`draft` is not `true`"], value)
  }
})

test("a missing private tag fails", () => {
  const frontmatter = FRONTMATTER.replace('  - "private"\n', "")
  assert.deepEqual(problems(stub(PLACEHOLDER, frontmatter)), ["tags do not include `private`"])
})

test("a different body fails", () => {
  assert.deepEqual(problems(stub("The note's own text.\n")), ["body does not start with the placeholder text"])
})

test("text after the placeholder fails", () => {
  for (const extra of ["More text.\n", "\n## Public\n\nMore text.\n"]) {
    assert.deepEqual(problems(stub(`${PLACEHOLDER}${extra}`)), ["body has text after the placeholder other than the `## Links` list"], extra)
  }
})

test("an external link in the list fails", () => {
  const body = `${PLACEHOLDER}${LINKS}- [Video](https://www.youtube.com/watch?v=x)\n`
  assert.deepEqual(problems(stub(body)), ["`## Links` list has a link outside the site"])
})

test("anything but links in the list fails", () => {
  const body = `${PLACEHOLDER}${LINKS}- [Day](/content/notes/day)\nA private aside.\n`
  assert.deepEqual(problems(stub(body)), ["`## Links` list has a line that is not a single link"])
})

test("an empty list fails", () => {
  assert.deepEqual(problems(stub(`${PLACEHOLDER}${LINKS}`)), ["`## Links` list is empty"])
})

test("internal links", () => {
  for (const target of ["/content/notes/x", "content/notes/x", "../x", "#heading", "https://chaoticgood.computer/x", "http://blog.chaoticgood.computer"]) {
    assert.equal(isInternal(target), true, target)
  }
  for (const target of ["https://github.com/x", "//youtube.com/x", "mailto:me@example.com", "https://notchaoticgood.computer", "https://chaoticgood.computer.evil.com"]) {
    assert.equal(isInternal(target), false, target)
  }
})
