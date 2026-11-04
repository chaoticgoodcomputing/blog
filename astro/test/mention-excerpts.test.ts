import { parse } from "node-html-parser"
import { expect, test } from "vitest"
import {
  excerptAddress,
  excerptBlock,
  excerptPage,
  linkingBlocks,
  mentionTarget,
  noteAtBlock,
} from "../src/lib/mention-excerpts.ts"

const SITE = "https://blog.example.com"
const NOTE = `${SITE}/content/notes/a`

/** A built note page: the site shell around its body. */
const page = (body: string) => `<html><body>
  <aside><a href="https://github.com/someone">GitHub</a></aside>
  <main><header><a href="https://bsky.app/share">Share</a></header>
    <article class="prose">${body}</article>
    <div class="after-body"><a href="https://elsewhere.example/">a backlink's link</a></div>
  </main></body></html>`

const blocksOf = (html: string) =>
  Object.fromEntries([...linkingBlocks(html, SITE)].map(([target, blocks]) => [target, blocks.map((block) => block.toString())]))

test("each site the body links to has the blocks that link there, and the shell's links are none of the note's", () => {
  const html = page(`
    <p>First <a href="https://maggie.example/post">her post</a>.</p>
    <p>Unrelated.</p>
    <ul><li>Again <a href="https://maggie.example/post#part">the post, at a part</a></li></ul>
    <p>And <a href="https://other.example/">another</a> and <a href="/content/notes/b">a note</a>.</p>`)
  expect(blocksOf(html)).toEqual({
    "https://maggie.example/post": [
      '<p>First <a href="https://maggie.example/post">her post</a>.</p>',
      '<li>Again <a href="https://maggie.example/post#part">the post, at a part</a></li>',
    ],
    "https://other.example/": ['<p>And <a href="https://other.example/">another</a> and <a href="/content/notes/b">a note</a>.</p>'],
  })
})

test("a block that links to a site twice is in its excerpt once", () => {
  const html = page(`<p><a href="https://a.example/x">one</a> and <a href="https://a.example/x">two</a></p>`)
  expect(blocksOf(html)["https://a.example/x"]).toHaveLength(1)
})

test("a link inside what is marked data-no-webmention is no mention, as a widget's links to the sites it charts", () => {
  const html = page(`
    <p>See <a href="https://a.example/post">her post</a>.</p>
    <figure data-no-webmention><svg><a href="https://a.example/"><circle r="4"></circle></a><a href="https://b.example/"><circle r="4"></circle></a></svg></figure>`)
  expect(Object.keys(blocksOf(html))).toEqual(["https://a.example/post"])
})

test("a page with no note body has no mentions", () => {
  expect(linkingBlocks("<main><p><a href='https://a.example/'>x</a></p></main>", SITE).size).toBe(0)
})

test("a target is the link's address without its fragment", () => {
  expect(mentionTarget("https://a.example/post?x=1#h")).toBe("https://a.example/post?x=1")
})

test("an excerpt's block drops the new-tab icon and makes every address whole", () => {
  const block = parse(
    `<p>See <a href="https://a.example/" target="_blank" rel="noopener">it<span class="new-tab" role="img" aria-label="(opens in a new tab)"><svg></svg></span></a>, <a href="/content/notes/b">b</a>, <a href="#later">later</a> and <img src="/assets/x.png"></p>`,
  ).querySelector("p")!
  expect(excerptBlock(block, NOTE)).toBe(
    `<p>See <a href="https://a.example/" target="_blank" rel="noopener">it</a>, <a href="${SITE}/content/notes/b">b</a>, <a href="${NOTE}#later">later</a> and <img src="${SITE}/assets/x.png"></p>`,
  )
})

test("an excerpt's block keeps an address's ampersands escaped", () => {
  const block = parse(`<p><a href="https://a.example/?x=1&amp;y=2">a</a></p>`).querySelector("p")!
  expect(excerptBlock(block, NOTE)).toBe(`<p><a href="https://a.example/?x=1&amp;y=2">a</a></p>`)
})

test("an excerpt's address is under the note's, one for each target, and the home note's is under `index`", () => {
  const a = excerptAddress("/content/notes/a", "https://a.example/")
  expect(a).toMatch(/^\/mentions\/content\/notes\/a\/[0-9a-f]{12}$/)
  expect(excerptAddress("/content/notes/a", "https://b.example/")).not.toBe(a)
  expect(excerptAddress("/", "https://a.example/")).toMatch(/^\/mentions\/index\//)
})

test("a reader is sent to the note at the first words of the block, as a text fragment", () => {
  expect(noteAtBlock(NOTE, "  Spring-loaded, as one says & so on, and on and on and on  ")).toBe(
    `${NOTE}#:~:text=Spring%2Dloaded%2C%20as%20one%20says%20%26%20so%20on%2C%20and`,
  )
  expect(noteAtBlock(NOTE, "   ")).toBe(NOTE)
})

test("an excerpt's page is one h-entry of the blocks, its own address its url, sent on to the note", () => {
  const html = excerptPage({
    address: `${SITE}/mentions/content/notes/a/abc`,
    noteAddress: NOTE,
    note: { title: "A <note>", url: "/content/notes/a", date: new Date("2026-03-14T00:00:00Z") },
    blocks: ["<p>One</p>", "<li>Two</li>"],
    continueTo: `${NOTE}#:~:text=One`,
    author: { name: "Someone", url: `${SITE}/about` },
    locale: "en-US",
  })
  const root = parse(html)
  const entries = root.querySelectorAll(".h-entry")
  expect(entries).toHaveLength(1)
  expect(root.querySelector(".p-name")!.text).toBe("A <note>")
  expect(root.querySelector(".u-url")!.getAttribute("href")).toBe(`${SITE}/mentions/content/notes/a/abc`)
  expect(root.querySelector(".dt-published")!.getAttribute("datetime")).toBe("2026-03-14T00:00:00.000Z")
  expect(root.querySelector(".p-author.h-card")!.getAttribute("href")).toBe(`${SITE}/about`)
  expect(root.querySelector(".e-content")!.innerHTML.trim()).toBe("<p>One</p>\n        <li>Two</li>")
  expect(root.querySelector("link[rel=canonical]")!.getAttribute("href")).toBe(NOTE)
  expect(root.querySelector("meta[name=robots]")!.getAttribute("content")).toBe("noindex")
  expect(root.querySelector("script")!.text).toContain(`location.replace("${NOTE}#:~:text=One")`)
})
