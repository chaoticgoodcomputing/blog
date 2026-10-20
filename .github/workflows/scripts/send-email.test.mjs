// node --test .github/workflows/scripts/*.test.mjs
import assert from "node:assert/strict"
import { test } from "node:test"
import { emailFor, isEmail, toEmailMarkdown } from "./send-email.mjs"

const SITE = "https://blog.chaoticgood.computer"
const note = (frontmatter, body = "Hello.") => `---\n${frontmatter}\n---\n\n${body}\n`

test("an email is tagged writing/notes/emails, and neither a draft nor private", () => {
  assert.equal(isEmail(note("tags:\n  - writing/notes/emails")), true)
  assert.equal(isEmail(note("tags: writing/notes/emails")), true)
  assert.equal(isEmail(note("tags:\n  - writing/notes/emails\ndraft: true")), false)
  assert.equal(isEmail(note("tags:\n  - writing/notes/emails\n  - private")), false)
  assert.equal(isEmail(note("tags:\n  - writing/essays")), false)
  assert.equal(isEmail(undefined), false)
})

test("wikilinks become links to the site", () => {
  const byName = new Map([["hello-blog", "content/articles/hello-blog.md"]])
  const markdown = toEmailMarkdown(
    [
      "[[public/content/notes/time-tracking|Time tracking]]",
      "[[/content/notes/qamo]]",
      "[[hello-blog]]",
      "[[public/content/notes/beethoven#The Ninth|the Ninth]]",
      "[[public/tags/writing/notes/emails]]",
    ].join("\n"),
    { byName },
  )
  assert.equal(
    markdown,
    [
      `[Time tracking](${SITE}/content/notes/time-tracking)`,
      `[qamo](${SITE}/content/notes/qamo)`,
      `[hello-blog](${SITE}/content/articles/hello-blog)`,
      `[the Ninth](${SITE}/content/notes/beethoven#the-ninth)`,
      `[emails](${SITE}/tags/writing/notes/emails)`,
    ].join("\n"),
  )
})

test("image embeds become images, and Markdown links to the vault get full addresses", () => {
  const byName = new Map([["doodle.png", "assets/doodle.png"]])
  const markdown = toEmailMarkdown("![[doodle.png]]\n[a note](public/content/notes/x.md) [elsewhere](https://example.com) [here](#top)", { byName })
  assert.equal(markdown, `![](${SITE}/assets/doodle.png)\n[a note](${SITE}/content/notes/x) [elsewhere](https://example.com) [here](#top)`)
})

test("unresolved links stay as text, comments go, code is left alone", () => {
  const missing = []
  const markdown = toEmailMarkdown("[[nowhere|Somewhere]] %%a private aside%%\n\n```\n[[not a link]]\n```", { warn: (t) => missing.push(t) })
  assert.equal(markdown, "Somewhere \n\n```\n[[not a link]]\n```")
  assert.deepEqual(missing, ["nowhere"])
})

test("an email's subject is its title, and it links back to its page", () => {
  const email = emailFor("content/public/content/notes/hi.md", note('title: "Hi there"\ntags:\n  - writing/notes/emails'), new Map())
  assert.equal(email.subject, "Hi there")
  assert.equal(email.page, `${SITE}/content/notes/hi`)
  assert.equal(email.body, `Hello.\n\n---\n\n[Read this on the site](${SITE}/content/notes/hi)\n`)
})

test("an .mdx note or a private note can't be an email", () => {
  assert.throws(() => emailFor("content/public/content/notes/w.mdx", note("tags: writing/notes/emails"), new Map()), /only a \.md note/)
  assert.throws(() => emailFor("content/public/content/notes/p.md", note("tags:\n  - writing/notes/emails\n  - private"), new Map()), /private/)
})

test("callouts become bold labels", () => {
  assert.equal(toEmailMarkdown("> [!UPDATE]\n> Done.\n\n> [!tip]- Read this\n> Now."), "> **Update**\n> Done.\n\n> **Read this**\n> Now.")
})
