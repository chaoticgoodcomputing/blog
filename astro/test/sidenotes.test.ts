import { parse } from "node-html-parser"
import { markdownToHtml } from "satteri"
import { expect, test } from "vitest"
import { layout } from "../src/site.config.ts"
import { restoreFootnotes, sidenoteMarginStyles, sidenotes } from "../src/lib/sidenotes.ts"

function render(source: string) {
  const { html } = markdownToHtml(source, { features: { gfm: true }, hastPlugins: [sidenotes()] })
  return parse(html)
}

const SOURCE = [
  "First[^a] and second[^b].",
  "",
  "- An item citing the first again[^a] and a third[^c].",
  "",
  "No footnote here.",
  "",
  "[^a]: Note *a*.",
  "[^b]: Note b.",
  "",
  "    Its second paragraph.",
  "[^c]: Note c.",
  "",
].join("\n")

test("each block that cites a footnote is wrapped with its sidenotes, before it, in the order cited", () => {
  const page = render(SOURCE)
  const wrapped = page.querySelectorAll(".sidenoted")
  expect(wrapped.map((wrapper) => wrapper.querySelectorAll(":scope > *").map((child) => child.tagName))).toEqual([
    ["ASIDE", "ASIDE", "P"],
    ["ASIDE", "UL"],
  ])
  expect(page.querySelectorAll("aside.sidenote").map((note) => note.id)).toEqual(["user-content-sn-a", "user-content-sn-b", "user-content-sn-c"])
})

test("a sidenote is its number, then its footnote without its link back", () => {
  const page = render(SOURCE)
  const b = page.querySelector("#user-content-sn-b")!
  expect(b.querySelectorAll(":scope > *").map((child) => child.tagName)).toEqual(["A", "P", "P"])
  expect(b.querySelectorAll("p").map((p) => p.text)).toEqual(["Note b.", "Its second paragraph."])
  expect(b.querySelector(".sidenote-number")?.text).toBe("2.")
  expect(b.querySelector("[data-footnote-backref]")).toBeNull()
  expect(page.querySelector("#user-content-sn-a em")?.text).toBe("a")
})

test("a sidenote's number links back to its footnote's first reference", () => {
  const page = render(SOURCE)
  const number = page.querySelector("#user-content-sn-a .sidenote-number")!
  expect(number.tagName).toBe("A")
  expect(number.getAttribute("href")).toBe("#user-content-fnref-a")
  expect(number.getAttribute("aria-label")).toBe("Back to reference 1")
  expect(page.querySelector("#user-content-fnref-a")?.getAttribute("data-footnote-ref")).toBeDefined()
})

test("the even sidenotes are for the left margin, the odd for the right", () => {
  const page = render(SOURCE)
  expect(page.querySelectorAll("aside.sidenote").map((note) => note.classList.contains("sidenote-left"))).toEqual([false, true, false])
})

test("every reference links to its sidenote, and the footnotes stay under the body", () => {
  const page = render(SOURCE)
  expect(page.querySelectorAll("a[data-footnote-ref]").map((a) => a.getAttribute("href"))).toEqual([
    "#user-content-sn-a",
    "#user-content-sn-b",
    "#user-content-sn-a",
    "#user-content-sn-c",
  ])
  expect(page.querySelectorAll("section.footnotes li")).toHaveLength(3)
})

test("without the site's styles, the footnotes are as they were", () => {
  const page = render(SOURCE)
  restoreFootnotes(page)
  expect(page.querySelector(".sidenote")).toBeNull()
  expect(page.querySelectorAll("a[data-footnote-ref]").map((a) => a.getAttribute("href"))).toEqual([
    "#user-content-fn-a",
    "#user-content-fn-b",
    "#user-content-fn-a",
    "#user-content-fn-c",
  ])
})

test("a note without footnotes is left as it is", () => {
  const page = render("Just text.\n")
  expect(page.toString().trim()).toBe("<p>Just text.</p>")
})

test("the margin holds the sidenotes once the room fits the text and a margin either side", () => {
  const css = sidenoteMarginStyles({ ...layout, noteWidth: "40rem", sidenoteWidth: "14rem", sidenoteGap: "2rem" })
  expect(css).toContain("@container note-room (width >= calc(40rem + 2 * (2rem + 14rem + 2rem)))")
  expect(css).toContain("width: 14rem;")
  expect(css).toContain("calc(-1 * (14rem + 2rem))")
  expect(css).toMatch(/\.sidenote-left \{\s*float: left;/)
})
