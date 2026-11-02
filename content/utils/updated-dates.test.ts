import assert from "node:assert/strict"
import { test } from "node:test"
import { changesContent, contentOf, isStamped, lastContentChange, stampOf, withUpdated } from "./updated-dates.ts"

const note = (frontmatter: string, body = "Hello.") => `---\n${frontmatter}\n---\n\n${body}\n`

test("a change to the body is a change to the content", () => {
  assert.equal(changesContent(note("title: A"), note("title: A", "Hello, world.")), true)
})

test("a new note changes content", () => {
  assert.equal(changesContent(undefined, note("title: A")), true)
})

test("the title and description are content; tags, aliases, dates and the stamp are not", () => {
  assert.equal(changesContent(note("title: A"), note("title: B")), true)
  assert.equal(changesContent(note("title: A"), note("title: A\ndescription: About A")), true)
  assert.equal(changesContent(note("title: A\ntags:\n  - old"), note("title: A\ntags:\n  - new\naliases:\n  - a")), false)
  assert.equal(changesContent(note("title: A\ndate: 2024-01-01"), note("title: A\ndate: 2024-01-01\nupdated: 2026-11-02")), false)
})

test("a wikilink's new target is no change where what it shows is the same", () => {
  const before = note("title: A", "> — [[public/tags/writing/notes/apl|A Pattern Language]]")
  const after = note("title: A", "> — [[public/tags/writing/fragments/apl|A Pattern Language]]")
  assert.equal(changesContent(before, after), false)
  assert.equal(changesContent(note("", "[[public/content/old/note]]"), note("", "[[public/content/new/note]]")), false)
  assert.equal(changesContent(note("", "[[public/a/note#Part]]"), note("", "[[public/b/note#Part]]")), false)
  assert.equal(changesContent(note("", "| [[public/a/note\\|N]] |"), note("", "| [[public/b/note\\|N]] |")), false)
})

test("a wikilink that shows something else is a change", () => {
  assert.equal(changesContent(note("", "[[public/a/note|Old]]"), note("", "[[public/a/note|New]]")), true)
  assert.equal(changesContent(note("", "[[public/a/one]]"), note("", "[[public/a/two]]")), true)
  assert.equal(changesContent(note("", "![[a/picture.png]]"), note("", "![[a/other.png]]")), true)
})

test("a Markdown link to the vault keeps its file's name; one to another site keeps its address", () => {
  assert.equal(changesContent(note("", "[N](public/a/note.md)"), note("", "[N](public/b/note.md)")), false)
  assert.equal(changesContent(note("", "[N](https://a.example)"), note("", "[N](https://b.example)")), true)
})

test("trailing spaces and blank lines at the ends are no content", () => {
  assert.equal(contentOf(note("title: A", "Hello.  \n\n")), contentOf(note("title: A", "Hello.")))
})

test("the stamp is the day in UTC", () => {
  assert.equal(stampOf(new Date("2026-11-02T21:37:45.123Z")), "2026-11-02")
  assert.equal(stampOf(new Date("2026-11-02T23:30:00-05:00")), "2026-11-03")
})

test("the stamp goes after the date, replaces one there, or opens a frontmatter", () => {
  assert.equal(withUpdated("---\ntitle: A\ndate: 2024-01-01\ntags:\n  - t\n---\nBody\n", "S"), "---\ntitle: A\ndate: 2024-01-01\nupdated: S\ntags:\n  - t\n---\nBody\n")
  assert.equal(withUpdated("---\ntitle: A\nupdated: old\n---\nBody\n", "S"), "---\ntitle: A\nupdated: S\n---\nBody\n")
  assert.equal(withUpdated("---\ntitle: A\n---\nBody\n", "S"), "---\ntitle: A\nupdated: S\n---\nBody\n")
  assert.equal(withUpdated("Body\n", "S"), "---\nupdated: S\n---\nBody\n")
  assert.equal(withUpdated("---\r\ntitle: A\r\n---\r\nBody\r\n", "S"), "---\r\ntitle: A\r\nupdated: S\r\n---\r\nBody\r\n")
})

test("a note stamped already with the same stamp is left as it is", () => {
  const text = "---\nupdated: S\n---\nBody\n"
  assert.equal(withUpdated(text, "S"), text)
})

test("only public notes are stamped, and no Excalidraw drawing", () => {
  assert.equal(isStamped("content/public/content/notes/a.md", note("title: A")), true)
  assert.equal(isStamped("content/public/content/notes/a.mdx", note("title: A")), true)
  assert.equal(isStamped("dist/vault-private/content/a.md", note("title: A")), false)
  assert.equal(isStamped("content/public/drawings/d.md", note("excalidraw-plugin: parsed")), false)
  assert.equal(isStamped("content/public/a.png", ""), false)
})

test("a note last changed when the newest version whose content differs from the one before it was made", () => {
  const at = (day: number) => new Date(`2026-10-${String(day).padStart(2, "0")}T00:00:00Z`)
  const history = [
    { time: at(30), text: note("title: A\ntags:\n  - renamed", "[[public/new/x|X]] Two.") },
    { time: at(20), text: note("title: A", "[[public/old/x|X]] Two.") },
    { time: at(10), text: note("title: A", "[[public/old/x|X]] One.") },
  ]
  assert.equal(lastContentChange(history)?.toISOString(), at(20).toISOString())
  assert.equal(lastContentChange(history.slice(0, 1))?.toISOString(), at(30).toISOString())
  assert.equal(lastContentChange([]), undefined)
})
