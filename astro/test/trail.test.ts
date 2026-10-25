import { expect, test } from "vitest"
import type { Graph } from "../src/lib/graph.ts"
import { trailGraph } from "../src/lib/graph.ts"
import { addressOf, follow, trailOf } from "../src/lib/trail.ts"

const at = (address: string) => new URL(address, "https://example.com")

test("an address with no trail is a trail of its own page", () => {
  expect(trailOf(at("/content/notes/a"))).toEqual(["/content/notes/a"])
  expect(trailOf(at("/"))).toEqual(["/"])
})

test("an address's trail is the notes in its query, oldest first, then its own page", () => {
  expect(trailOf(at("/c?trail=/&trail=/a&trail=/b"))).toEqual(["/", "/a", "/b", "/c"])
})

test("a trail's notes are read as the site writes them: decoded, with no trailing slash", () => {
  expect(trailOf(at("/content/Big%20Note/?trail=%2Fa%2F"))).toEqual(["/a", "/content/Big Note"])
})

test("following a link goes on to its note", () => {
  expect(follow(["/", "/a"], "/b")).toEqual(["/", "/a", "/b"])
})

test("a trail holds at most its length, letting the oldest note go", () => {
  expect(follow(["/", "/a", "/b", "/c"], "/d", 4)).toEqual(["/a", "/b", "/c", "/d"])
  expect(trailOf(at("/e?trail=/a&trail=/b&trail=/c&trail=/d"), 4)).toEqual(["/b", "/c", "/d", "/e"])
})

test("following a link to a note on the trail goes back to it, letting the notes after it go", () => {
  expect(follow(["/", "/a", "/b", "/c"], "/a")).toEqual(["/", "/a"])
  expect(follow(["/", "/a"], "/a")).toEqual(["/", "/a"])
})

test("an address whose query names its own page, or a note twice, is read as following each in turn", () => {
  expect(trailOf(at("/b?trail=/a&trail=/b&trail=/c"))).toEqual(["/a", "/b"])
})

test("a trail's address is its last note's, carrying the notes before it", () => {
  expect(addressOf(["/content/notes/a"])).toBe("/content/notes/a")
  expect(addressOf(["/", "/a", "/Big Note"])).toBe("/Big%20Note?trail=%2F&trail=%2Fa")
})

test("a trail read from its own address is the same trail", () => {
  const trail = ["/", "/a b", "/c"]
  expect(trailOf(at(addressOf(trail)))).toEqual(trail)
})

// A path of three notes, a note off it, and tags, as `graphOf` would make them.
const GRAPH: Graph = {
  nodes: ["/a", "/b", "/c", "/d", "/far", "/tags/x"].map((id) => ({
    id,
    kind: id.startsWith("/tags/") ? ("tag" as const) : ("note" as const),
    label: id,
    tag: undefined,
    private: false,
  })),
  edges: [
    { source: "/a", target: "/b", kind: "noteNote" },
    { source: "/b", target: "/c", kind: "noteNote" },
    { source: "/c", target: "/d", kind: "noteNote" },
    { source: "/d", target: "/far", kind: "noteNote" },
    { source: "/a", target: "/tags/x", kind: "tagNote" },
  ],
}

test("the graph around a trail is every note of it, and everything one edge from one", () => {
  const graph = trailGraph(GRAPH, ["/a", "/b"], 1)
  expect(graph.nodes.map((node) => node.id).sort()).toEqual(["/a", "/b", "/c", "/tags/x"])
})

test("the graph around a trail keeps every edge among its nodes, not only each note's own", () => {
  const graph = trailGraph(GRAPH, ["/a", "/d"], 1)
  // `/b` is next to `/a` and `/c` next to `/d`: the edge between them is no trail note's, and is kept.
  expect(graph.edges).toContainEqual({ source: "/b", target: "/c", kind: "noteNote" })
})

test("a trail note the graph has no node for adds nothing to its graph", () => {
  expect(trailGraph(GRAPH, ["/nowhere"], 1)).toEqual({ nodes: [], edges: [] })
})
