import { describe, expect, it } from "vitest"
import {
  AnnotationPropertyError,
  formatPageRange,
  pageRangeIncludes,
  parsePageRange,
  readAnnotationProperties,
  readNote,
} from "../src/index.ts"
import { NOTE, SOURCE } from "./fixtures.ts"

describe("page ranges", () => {
  it.each([
    ["12-40", [[12, 40]], "12-40"],
    ["3-5, 9", [[3, 5], [9, 9]], "3-5,9"],
    // SPEC §3 gives [[3, 8], [9, 9]] here, but 8 and 9 touch, and its rule merges runs that touch (DECISIONS.md).
    ["9, 3-5, 4-8", [[3, 9]], "3-9"],
    ["9, 3-5, 11", [[3, 5], [9, 9], [11, 11]], "3-5,9,11"],
    [[7, "10-12"], [[7, 7], [10, 12]], "7,10-12"],
    ["3-5, 6-8", [[3, 8]], "3-8"],
    ["2 – 4", [[2, 4]], "2-4"],
    [5, [[5, 5]], "5"],
  ])("reads %j as a normalized set", (value, runs, text) => {
    const range = parsePageRange(value)
    expect(range).toEqual(runs)
    expect(formatPageRange(range as [number, number][])).toBe(text)
  })

  it.each([
    ["0", "0"],
    ["5-3", "5-3"],
    ["abc", "abc"],
    [[3, true], "true"],
    ["3,,5", ""],
    [0, "0"],
    [2.5, "2.5"],
    [[], "[]"],
  ])("refuses %j, naming the property and the part %j", (value, part) => {
    const error = parsePageRange(value)
    expect(error).toBeInstanceOf(AnnotationPropertyError)
    expect(error).toMatchObject({ property: "annotation-pages", part })
  })

  it("tells whether a page is in the range; no range is every page", () => {
    const range = parsePageRange("3-5, 9") as [number, number][]
    expect([2, 3, 5, 6, 9].map((page) => pageRangeIncludes(range, page))).toEqual([false, true, true, false, true])
    expect(pageRangeIncludes(undefined, 1000)).toBe(true)
  })
})

describe("annotation properties", () => {
  it("reads target, target type and pages", () => {
    expect(
      readAnnotationProperties({
        "annotation-target": "https://example.com/post",
        "annotation-target-type": "web",
        "annotation-pages": "12, 3-5, 4-8",
      }),
    ).toEqual({ target: "https://example.com/post", targetType: "web", pages: [[3, 8], [12, 12]] })
  })

  it("reads an absent target type as a document, and absent pages as every page", () => {
    expect(readAnnotationProperties({ "annotation-target": "papers/a.pdf" })).toEqual({
      target: "papers/a.pdf",
      targetType: "document",
      pages: undefined,
    })
  })

  it("reads a list of targets as its first item", () => {
    expect(readAnnotationProperties({ "annotation-target": ["a.pdf", "b.pdf"] })).toMatchObject({ target: "a.pdf" })
  })

  it("is undefined for a note that isn't an annotation note", () => {
    expect(readAnnotationProperties({ title: "x" })).toBeUndefined()
    expect(readAnnotationProperties(undefined)).toBeUndefined()
  })

  it.each([
    [{ "annotation-target": "a.pdf", "annotation-pages": "5-3" }, "annotation-pages", "5-3"],
    [{ "annotation-target": "a.pdf", "annotation-target-type": "pdf" }, "annotation-target-type", "pdf"],
    [{ "annotation-target": 42 }, "annotation-target", "42"],
  ])("returns a typed error for %j", (frontmatter, property, part) => {
    const error = readAnnotationProperties(frontmatter)
    expect(error).toBeInstanceOf(AnnotationPropertyError)
    expect(error).toMatchObject({ property, part })
    expect((error as Error).message).toContain(property)
  })

  it("comes from the note's frontmatter when reading a note", () => {
    expect(readNote(NOTE).properties).toEqual({ target: SOURCE, targetType: "document", pages: [[3, 5], [9, 9]] })
  })

  it("reports the page-range error when reading a note", () => {
    const note = readNote("---\nannotation-target: a.pdf\nannotation-pages: [3, true]\n---\nBody\n")
    expect(note.properties).toBeInstanceOf(AnnotationPropertyError)
    expect(note.properties).toMatchObject({ property: "annotation-pages", part: "true" })
    expect(note.preface).toBe("Body\n")
  })

  it("reports frontmatter that isn't YAML", () => {
    expect(readNote("---\nannotation-target: [a\n---\n").properties).toMatchObject({ property: "frontmatter" })
  })
})
