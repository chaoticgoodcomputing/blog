import { expect, test } from "vitest"
import { footnoteProblems } from "../src/lib/footnotes.ts"

test("a note whose footnotes all match has no problems", () => {
  expect(footnoteProblems("A claim[^1].\n\n[^1]: Its source.\n")).toEqual({ missing: [], unused: [] })
})

test("a reference with no definition is missing, once however often it is cited", () => {
  expect(footnoteProblems("One[^a], two[^a] and three[^b].\n\n[^b]: Defined.\n").missing).toEqual(["a"])
})

test("a definition no reference cites is unused", () => {
  expect(footnoteProblems("Nothing cited.\n\n[^spare]: Never cited.\n").unused).toEqual(["spare"])
})

test("a reference matches its definition whatever its case", () => {
  expect(footnoteProblems("A[^Note].\n\n[^note]: n\n")).toEqual({ missing: [], unused: [] })
})

test("what only looks like a reference, in code, math, frontmatter or a block link, is none", () => {
  const source = "---\ntitle: '[^x]'\n---\n\n`[^code]` and [[note#^block]] and $$[^m]$$.\n\n```\n[^fenced]\n```\n"
  expect(footnoteProblems(source)).toEqual({ missing: [], unused: [] })
})

test("an MDX note is read as MDX", () => {
  const source = "import Widget from './widget'\n\nA[^1] <Widget />\n\n[^2]: two\n"
  expect(footnoteProblems(source, { mdx: true })).toEqual({ missing: ["1"], unused: ["2"] })
})
