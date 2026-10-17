import { describe, expect, test } from "vitest"
import { mapLinkPrefixes } from "../src/lib/link-prefixes.ts"

describe("a wikilink or embed loses its public/ or private/ prefix", () => {
  test.each([
    ["[[public/content/articles/x]]", "[[/content/articles/x]]"],
    ["[[/public/content/articles/x]]", "[[/content/articles/x]]"],
    ["[[private/content/notes/periodic/x]]", "[[/content/notes/periodic/x]]"],
    ["[[/private/content/notes/periodic/x]]", "[[/content/notes/periodic/x]]"],
    ["![[public/assets/photo.png]]", "![[/assets/photo.png]]"],
    ["![[/public/assets/Pasted image 20260824170843.png]]", "![[/assets/Pasted image 20260824170843.png]]"],
    ["[[public/content/x|an alias]]", "[[/content/x|an alias]]"],
    ["[[private/content/x#A heading]]", "[[/content/x#A heading]]"],
    ["[[private/content/x#A heading|alias]]", "[[/content/x#A heading|alias]]"],
    ["[[/private/content/x#^block-id]]", "[[/content/x#^block-id]]"],
    ["| [[public/content/x\\|alias]] |", "| [[/content/x\\|alias]] |"],
    ["[[private/content/A note with spaces]]", "[[/content/A note with spaces]]"],
  ])("%s", (written, mapped) => {
    expect(mapLinkPrefixes(written)).toBe(mapped)
  })
})

describe("a Markdown link loses its public/ or private/ prefix", () => {
  test.each([
    ["[x](public/content/x)", "[x](/content/x)"],
    ["[x](/public/content/x)", "[x](/content/x)"],
    ["[x](private/content/x.md)", "[x](/content/x.md)"],
    ["[x](/private/content/x#Morning Block)", "[x](/content/x#Morning Block)"],
    ["![photo](public/assets/Pasted%20image.png)", "![photo](/assets/Pasted%20image.png)"],
    ["[x](<private/content/a note.md>)", "[x](</content/a note.md>)"],
  ])("%s", (written, mapped) => {
    expect(mapLinkPrefixes(written)).toBe(mapped)
  })
})

test("a link already written from the assembled vault's root, or by name, is left as it is", () => {
  const text = "[[/content/x]] [[content/x|alias]] [[A note]] ![[photo.png]] [x](/content/x) [y](../x.md)"
  expect(mapLinkPrefixes(text)).toBe(text)
})

test("public/ or private/ anywhere but at the start of a link's path is left alone", () => {
  const text = [
    "See https://example.com/public/x and [the docs](https://example.com/private/y).",
    "A bare https://example.com/a](public/b) is part of the address.",
    "[[content/public/x]] [[publicity/x]] [[Public/x]] the public/ folder",
  ].join("\n")
  expect(mapLinkPrefixes(text)).toBe(text)
})

describe("a link to tags/<tag>/index goes to the tag page", () => {
  test.each([
    ["[[/tags/engineering/ai/index]]", "[[/tags/engineering/ai]]"],
    ["[[tags/engineering/index|Engineering]]", "[[tags/engineering|Engineering]]"],
    ["| [[/tags/engineering/index\\|Engineering]] |", "| [[/tags/engineering\\|Engineering]] |"],
    ["[[/tags/engineering/index#Heading]]", "[[/tags/engineering#Heading]]"],
    ["[x](/tags/engineering/index)", "[x](/tags/engineering)"],
    ["[x](tags/engineering/index#Heading)", "[x](tags/engineering#Heading)"],
    ["[[public/tags/engineering/index|Engineering]]", "[[/tags/engineering|Engineering]]"],
    ["[x](/public/tags/engineering/index)", "[x](/tags/engineering)"],
  ])("%s", (written, mapped) => {
    expect(mapLinkPrefixes(written)).toBe(mapped)
  })

  test("but not a note called index under a tag's folder that the link doesn't end at", () => {
    const text = "[[/tags/engineering/indexes]] [x](/tags/engineering/index-of-things)"
    expect(mapLinkPrefixes(text)).toBe(text)
  })
})

test("every link in a note is mapped, and the rest of it is as it was", () => {
  const note = [
    "---",
    "title: A note",
    'related: "[[private/content/notes/y]]"',
    "---",
    "",
    "Read [[public/content/articles/x|this]] and [that](/private/content/notes/y#Part 2).",
    "",
    "![[public/assets/photo.png]]",
    "",
  ].join("\n")
  expect(mapLinkPrefixes(note)).toBe(
    [
      "---",
      "title: A note",
      'related: "[[/content/notes/y]]"',
      "---",
      "",
      "Read [[/content/articles/x|this]] and [that](/content/notes/y#Part 2).",
      "",
      "![[/assets/photo.png]]",
      "",
    ].join("\n"),
  )
})
