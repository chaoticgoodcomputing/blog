import assert from "node:assert/strict"
import { test } from "node:test"
import { addressOf, parseNameStatus, planAliases, withAlias, type Change } from "./alias-moves.ts"

const published = () => true
const plan = (changes: Change[], wasPublished: (file: string) => boolean = published) =>
  planAliases(changes, wasPublished)

test("an address is a path's slug, in lower case, with a folder's index as the folder", () => {
  assert.equal(addressOf("content/notes/Move to Boston.mdx"), "/content/notes/move-to-boston")
  assert.equal(addressOf("tags/projects/college/index.md"), "/tags/projects/college")
  assert.equal(addressOf("index.md"), "/")
})

test("git's -z name-status output is read as renames, deletions and additions", () => {
  const output = "R087\0content/public/a.md\0content/public/b b.md\0D\0content/public/c.md\0A\0content/public/d.md\0M\0content/public/e.md\0"
  assert.deepEqual(parseNameStatus(output), [
    { status: "R", from: "content/public/a.md", to: "content/public/b b.md" },
    { status: "D", from: "content/public/c.md" },
    { status: "A", to: "content/public/d.md" },
  ])
})

test("a moved public note gets its old path as an alias", () => {
  const changes: Change[] = [
    { status: "R", from: "content/public/content/notes/agronomic.mdx", to: "content/public/content/notes/gardening.mdx" },
  ]
  assert.deepEqual(plan(changes), {
    aliases: [{ file: "content/public/content/notes/gardening.mdx", alias: "content/notes/agronomic" }],
    warnings: [],
  })
})

test("a moved tag description note gets the old tag's path as an alias", () => {
  const changes: Change[] = [
    { status: "R", from: "content/public/tags/projects/college.md", to: "content/public/tags/projects/undergrad.md" },
  ]
  assert.deepEqual(plan(changes).aliases, [
    { file: "content/public/tags/projects/undergrad.md", alias: "tags/projects/college" },
  ])
})

test("a move that keeps the address gets no alias: an extension or a folder's index", () => {
  const changes: Change[] = [
    { status: "R", from: "content/public/plugins/quartz-mdx.md", to: "content/public/plugins/quartz-mdx.mdx" },
    { status: "R", from: "content/public/tags/writing/index.md", to: "content/public/tags/writing.md" },
  ]
  assert.deepEqual(plan(changes), { aliases: [], warnings: [] })
})

test("a draft or another unpublished note had no page, so its move gets no alias", () => {
  const changes: Change[] = [{ status: "R", from: "content/public/content/notes/a.md", to: "content/public/content/notes/b.md" }]
  assert.deepEqual(plan(changes, () => false), { aliases: [], warnings: [] })
})

test("a deleted note and an added one of the same name are a move git didn't find", () => {
  const changes: Change[] = [
    { status: "D", from: "content/public/content/notes/scratch/idea.md" },
    { status: "A", to: "content/public/content/articles/idea.mdx" },
  ]
  assert.deepEqual(plan(changes), {
    aliases: [{ file: "content/public/content/articles/idea.mdx", alias: "content/notes/scratch/idea" }],
    warnings: [],
  })
})

test("a name that more than one deleted or added note has pairs nothing", () => {
  const changes: Change[] = [
    { status: "D", from: "content/public/content/a/index.md" },
    { status: "D", from: "content/public/content/b/index.md" },
    { status: "A", to: "content/public/content/c/index.md" },
  ]
  const { aliases, warnings } = plan(changes)
  assert.deepEqual(aliases, [])
  assert.equal(warnings.length, 2)
})

test("a deleted public note is reported, unless it became a private note at the same path", () => {
  const changes: Change[] = [
    { status: "D", from: "content/public/content/notes/gone.md" },
    { status: "R", from: "content/public/content/notes/hidden.md", to: "dist/vault-private/content/notes/hidden.md" },
    { status: "D", from: "content/public/content/notes/stubbed.md" },
    { status: "A", to: "dist/vault-private/content/notes/stubbed.md" },
    { status: "D", from: "content/public/tags/old.md" },
  ]
  assert.deepEqual(plan(changes), {
    aliases: [],
    warnings: ["content/public/content/notes/gone.md is deleted, and no move accounts for it: /content/notes/gone will be the 404 page."],
  })
})

test("a public note that moves to a new path as a private note is reported, since a stub carries no alias", () => {
  const changes: Change[] = [
    { status: "R", from: "content/public/content/notes/a.md", to: "dist/vault-private/content/notes/scratch/a.md" },
  ]
  const { aliases, warnings } = plan(changes)
  assert.deepEqual(aliases, [])
  assert.match(warnings[0], /a private note, which can't carry an alias: \/content\/notes\/a will be the 404 page/)
})

test("a private note's moves are the private vault's, and get nothing", () => {
  const changes: Change[] = [
    { status: "R", from: "dist/vault-private/content/notes/a.md", to: "dist/vault-private/content/notes/b.md" },
    { status: "R", from: "content/templates/a.md", to: "content/templates/archive/a.md" },
  ]
  assert.deepEqual(plan(changes), { aliases: [], warnings: [] })
})

const OWN = "content/notes/new.md"

test("an alias is added to a block list of aliases as one more line", () => {
  const text = "---\ntitle: New\naliases:\n  - writing/notes/older\ntags:\n  - a\n---\n\nBody.\n"
  assert.equal(
    withAlias(text, "content/notes/old", OWN),
    "---\ntitle: New\naliases:\n  - writing/notes/older\n  - content/notes/old\ntags:\n  - a\n---\n\nBody.\n",
  )
})

test("an alias is added as a new list where the frontmatter has none", () => {
  const text = "---\ntitle: New\n---\n\nimport X from 'x'\n\n---\n\nBody.\n"
  assert.equal(withAlias(text, "content/notes/old", OWN), "---\ntitle: New\naliases:\n  - content/notes/old\n---\n\nimport X from 'x'\n\n---\n\nBody.\n")
})

test("a note with no frontmatter gets frontmatter with the alias", () => {
  assert.equal(withAlias("Body.\n", "content/notes/old", OWN), "---\naliases:\n  - content/notes/old\n---\nBody.\n")
})

test("aliases written on one line are written again as a block list", () => {
  assert.equal(
    withAlias("---\naliases: [first, Second Name]\n---\nBody.\n", "content/notes/old", OWN),
    '---\naliases:\n  - first\n  - "Second Name"\n  - content/notes/old\n---\nBody.\n',
  )
  assert.equal(
    withAlias("---\naliases: first, second\n---\nBody.\n", "content/notes/old", OWN),
    "---\naliases:\n  - first\n  - second\n  - content/notes/old\n---\nBody.\n",
  )
})

test("an alias the note already has, by its address, leaves the text as it was", () => {
  const text = "---\naliases:\n  - Content/Notes/Old.md\n---\nBody.\n"
  assert.equal(withAlias(text, "content/notes/old", OWN), text)
})

test("an alias that is the note's own address is dropped, as when a note moves back", () => {
  const text = "---\naliases:\n  - content/notes/new\n---\nBody.\n"
  assert.equal(withAlias(text, "content/notes/old", OWN), "---\naliases:\n  - content/notes/old\n---\nBody.\n")
  assert.equal(withAlias(text, "content/notes/new", OWN), "---\n---\nBody.\n")
})

test("a path with a space is quoted, and Windows line endings are kept", () => {
  assert.equal(
    withAlias("---\r\ntitle: New\r\n---\r\nBody.\r\n", "content/Move to Boston/Timeline", OWN),
    '---\r\ntitle: New\r\naliases:\r\n  - "content/Move to Boston/Timeline"\r\n---\r\nBody.\r\n',
  )
})
