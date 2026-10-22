import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import type { Vault } from "@chaoticgoodcomputing/obsidian-markdown"
import { afterAll, beforeAll, expect, test } from "vitest"
import { edgeOpacity, graphOf, neighbourhood, radii, type Graph, type GraphIndex } from "../src/lib/graph.ts"
import { graphIndex } from "../src/lib/graph-index.ts"
import { indexNotes, unpublished, type NoteIndex, type Unpublished } from "../src/lib/notes.ts"
import { openVault } from "../src/lib/vault.ts"
import { graph } from "../src/site.config.ts"

// A vault of this file's own, in no repository, so that each note's date is its frontmatter's.
const FILES: Record<string, string> = {
  "hub.md": "---\ntitle: Hub\ndate: 2026-03-01\ntags: [engineering/ai, writing]\n---\n\nSee [[spoke]], [[spoke|again]] and [[secret]], and ![[drawing]].\n",
  "spoke.md": "---\ntitle: Spoke\ndate: 2026-02-01\n---\n\nBack to [[hub]], and on to [[far]] and [[spoke|itself]].\n",
  "far.md": "---\ntitle: Far\ndate: 2026-01-01\n---\n\n![[spoke]]\n",
  "secret.md": "---\ntitle: Secret\ndate: 2026-04-01T12:30:00Z\ntags: [private/work]\n---\n\nNothing.\n",
  "drawing.md": "---\nkind: drawing\n---\n\nSee [[hub]].\n",
  // A note that links to tag pages: one with a description note, one with none, and one by its
  // address from the vault's root.
  "guide.md": "---\ntitle: Guide\ndate: 2026-01-15\n---\n\nOn [[tags/writing]], [[tags/engineering/ai|ai]] and [[/tags/engineering]].\n",
  // `writing`'s description note, which links on.
  "tags/writing.md": "---\ntitle: Writing\n---\n\nSee [[spoke]].\n",
}
// The site's own rule for tag description notes, and a drawing's.
const RULES: Unpublished[] = [
  { reason: "drawing", test: (_file, cache) => cache.frontmatter?.kind === "drawing" },
  unpublished.find((rule) => rule.reason === "tag description")!,
]

let root: string
let vault: Vault
let notes: NoteIndex

beforeAll(async () => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "astro-local-graph-"))
  for (const [file, source] of Object.entries(FILES)) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
    fs.writeFileSync(path.join(root, file), source)
  }
  vault = await openVault(root)
  notes = indexNotes(vault, RULES)
})

afterAll(() => fs.rmSync(root, { recursive: true, force: true }))

test("the graph index holds every published note, with its title, date, tags and the notes it links to or embeds", () => {
  expect(graphIndex({ vault, index: notes }).notes.filter((note) => !note.url.startsWith("/tags/"))).toEqual([
    { url: "/far", title: "Far", date: "2026-01-01T00:00:00.000Z", tags: [], links: ["/spoke"], private: false },
    {
      url: "/guide",
      title: "Guide",
      date: "2026-01-15T00:00:00.000Z",
      tags: [],
      links: ["/tags/writing", "/tags/engineering/ai", "/tags/engineering"],
      private: false,
    },
    {
      url: "/hub",
      title: "Hub",
      date: "2026-03-01T00:00:00.000Z",
      tags: ["engineering/ai", "writing"],
      links: ["/spoke", "/secret"],
      private: false,
    },
    { url: "/secret", title: "Secret", date: "2026-04-01T12:30:00.000Z", tags: ["private/work"], links: [], private: true },
    { url: "/spoke", title: "Spoke", date: "2026-02-01T00:00:00.000Z", tags: [], links: ["/hub", "/far"], private: false },
  ])
})

// A graph index written out: a hub that links to a spoke and to a private page, a spoke that links
// on to a far note, and the tags they carry.
const INDEX: GraphIndex = {
  notes: [
    { url: "/far", title: "Far", date: "2026-01-01T00:00:00.000Z", tags: [], links: [], private: false },
    {
      url: "/hub",
      title: "Hub",
      date: "2026-03-01T00:00:00.000Z",
      tags: ["engineering/ai", "writing"],
      links: ["/spoke", "/secret"],
      private: false,
    },
    { url: "/secret", title: "Secret", date: "2026-04-01T00:00:00.000Z", tags: ["private/work"], links: ["/hub"], private: true },
    { url: "/spoke", title: "Spoke", date: "2026-02-01T00:00:00.000Z", tags: ["engineering"], links: ["/far"], private: false },
  ],
}

const ids = (graph: Graph) => graph.nodes.map((node) => node.id).sort()
const edges = (graph: Graph) => graph.edges.map(({ source, target, kind }) => `${source} ${kind} ${target}`).sort()

test("a graph's nodes are the notes and every tag they carry, with each tag's ancestors, each at its page's address", () => {
  const graph = graphOf(INDEX, { removeTags: [], privatePages: "mark" })
  expect(graph.nodes.find((node) => node.id === "/hub")).toEqual({ id: "/hub", kind: "note", label: "Hub", tag: "engineering/ai", private: false })
  expect(graph.nodes.find((node) => node.id === "/far")).toEqual({ id: "/far", kind: "note", label: "Far", tag: undefined, private: false })
  expect(graph.nodes.find((node) => node.id === "/tags/engineering/ai")).toEqual({
    id: "/tags/engineering/ai",
    kind: "tag",
    label: "#ai",
    tag: "engineering/ai",
    private: false,
  })
  expect(ids(graph)).toEqual([
    "/far",
    "/hub",
    "/secret",
    "/spoke",
    "/tags/engineering",
    "/tags/engineering/ai",
    "/tags/private",
    "/tags/private/work",
    "/tags/writing",
  ])
})

test("a graph's edges join a note to each note it links to, a note to each tag it carries, and a tag to each tag under it", () => {
  expect(edges(graphOf(INDEX, { removeTags: [], privatePages: "mark" }))).toEqual([
    "/hub noteNote /secret",
    "/hub noteNote /spoke",
    "/hub tagNote /tags/engineering/ai",
    "/hub tagNote /tags/writing",
    "/secret noteNote /hub",
    "/secret tagNote /tags/private/work",
    "/spoke noteNote /far",
    "/spoke tagNote /tags/engineering",
    "/tags/engineering tagTag /tags/engineering/ai",
    "/tags/private tagTag /tags/private/work",
  ])
})

test("the graph index holds each tag description note at its tag page's address, with the notes it links to", () => {
  const index = graphIndex({ vault, index: notes })
  expect(index.notes.find((note) => note.url === "/tags/writing")).toMatchObject({ title: "Writing", links: ["/spoke"] })
})

test("a link to a tag's page is an edge to the tag's node, and its description note's links are the tag's", () => {
  const graph = graphOf(graphIndex({ vault, index: notes }), { removeTags: [], privatePages: "mark" })
  expect(graph.nodes.filter((node) => node.id === "/tags/writing")).toEqual([
    { id: "/tags/writing", kind: "tag", label: "#writing", tag: "writing", private: false },
  ])
  expect(edges(graph)).toEqual(
    expect.arrayContaining([
      "/guide noteNote /tags/engineering",
      "/guide noteNote /tags/engineering/ai",
      "/guide noteNote /tags/writing",
      "/tags/writing noteNote /spoke",
    ]),
  )
})

test("a note at a tag page's address is that tag's node, with its links", () => {
  const index: GraphIndex = {
    notes: [
      ...INDEX.notes,
      { url: "/tags/engineering", title: "Engineering", date: "2026-01-01T00:00:00.000Z", tags: ["engineering"], links: ["/far"], private: false },
      { url: "/tags/unused", title: "Unused", date: "2026-01-01T00:00:00.000Z", tags: [], links: [], private: false },
    ],
  }
  const graph = graphOf(index, { removeTags: [], privatePages: "mark" })
  expect(graph.nodes.filter((node) => node.id === "/tags/engineering")).toEqual([
    { id: "/tags/engineering", kind: "tag", label: "#engineering", tag: "engineering", private: false },
  ])
  expect(edges(graph)).toContain("/tags/engineering noteNote /far")
  // Carrying its own tag, it would have an edge to itself.
  expect(graph.edges.filter((edge) => edge.source === edge.target)).toEqual([])
  // A tag no other note carries is still the tag's node.
  expect(graph.nodes.find((node) => node.id === "/tags/unused")).toMatchObject({ kind: "tag", label: "#unused" })
})

test("a link to the page of a tag a graph leaves out is no edge", () => {
  const index: GraphIndex = {
    notes: [
      { url: "/a", title: "A", date: "2026-01-01T00:00:00.000Z", tags: [], links: ["/tags/private/work"], private: false },
      { url: "/tags/private", title: "Private", date: "2026-01-01T00:00:00.000Z", tags: [], links: ["/a"], private: false },
    ],
  }
  const graph = graphOf(index, { removeTags: ["private"], privatePages: "mark" })
  expect(ids(graph)).toEqual(["/a"])
  expect(graph.edges).toEqual([])
})

test("a removed tag is left out of a graph with every tag under it, and its notes stay", () => {
  const graph = graphOf(INDEX, { removeTags: ["private"], privatePages: "mark" })
  expect(ids(graph)).toEqual(["/far", "/hub", "/secret", "/spoke", "/tags/engineering", "/tags/engineering/ai", "/tags/writing"])
  expect(graph.nodes.find((node) => node.id === "/secret")).toMatchObject({ private: true, tag: "private/work" })
})

test("left out, a private page is not in a graph, nor are its edges, nor the tags only it carries", () => {
  const graph = graphOf(INDEX, { removeTags: [], privatePages: "omit" })
  expect(ids(graph)).toEqual(["/far", "/hub", "/spoke", "/tags/engineering", "/tags/engineering/ai", "/tags/writing"])
  expect(edges(graph)).not.toContain("/hub noteNote /secret")
})

test("a page's local graph is the page and every node within `depth` edges of it, whichever way the edge runs", () => {
  const graph = graphOf(INDEX, { removeTags: ["private"], privatePages: "mark" })
  const local = neighbourhood(graph, "/spoke", 1)
  expect(ids(local)).toEqual(["/far", "/hub", "/spoke", "/tags/engineering"])
  // The edges among them, and no others.
  expect(edges(local)).toEqual(["/hub noteNote /spoke", "/spoke noteNote /far", "/spoke tagNote /tags/engineering"])

  expect(ids(neighbourhood(graph, "/spoke", 2))).toEqual([
    "/far",
    "/hub",
    "/secret",
    "/spoke",
    "/tags/engineering",
    "/tags/engineering/ai",
    "/tags/writing",
  ])
})

test("a tag page's local graph is around its tag's node, and a page the graph has no node for has an empty one", () => {
  const graph = graphOf(INDEX, { removeTags: ["private"], privatePages: "mark" })
  expect(ids(neighbourhood(graph, "/tags/engineering", 1))).toEqual(["/spoke", "/tags/engineering", "/tags/engineering/ai"])
  expect(neighbourhood(graph, "/tags/private", 1)).toEqual({ nodes: [], edges: [] })
})

test("with a depth below zero, the local graph is the whole graph", () => {
  const graph = graphOf(INDEX, { removeTags: [], privatePages: "mark" })
  expect(neighbourhood(graph, "/far", -1)).toEqual(graph)
})

test("the local graph's settings are the Quartz site's, carried over", () => {
  // quartz/core/quartz.config.yaml's `localGraph`, over quartz-graph's defaults: the private tag
  // removed and private pages drawn at 0.8 of their size, a repel force of 2 (d3's many-body
  // strength is -100 times it) and a centre force of 0.5, and the distances, strengths, sizes and
  // opacities below. Its labels were 0.6 of 15px, 9px, over a scale of 0.55: 16.36px. Its link
  // distances were 50px; here they are shares of the shell's diameter, 50px at 16 nodes.
  expect(graph.local).toEqual({
    depth: 1,
    removeTags: ["private"],
    privatePages: "mark",
    forces: {
      charge: -200,
      center: 0.5,
      linkDistance: { tagTag: 0.25, tagNote: 0.25, noteNote: 0.25 },
      linkStrength: { tagTag: 0.3, tagNote: 0.3, noteNote: 0.3 },
    },
    shellSize: { base: 60, scaling: 10 },
    sizes: {
      tag: { base: 10, scaling: 1 },
      note: { base: 10, scaling: 2 },
      private: 0.8,
      current: 1.4,
      label: 16.36,
    },
    edges: {
      opacity: { tagTag: { min: 1, max: 1 }, tagNote: { min: 0, max: 0 }, noteNote: { min: 1, max: 1 } },
      style: { tagTag: "solid", tagNote: "solid", noteNote: "dotted" },
    },
  })
})

test("the global graph's labels are the Quartz site's size", () => {
  // 0.6 of 15px, 9px, over the global graph's scale of 0.8.
  expect(graph.global.sizes.label).toBe(11.25)
})

test("a note's radius grows with its edges, a tag's with the notes under it, and a private page's is smaller", () => {
  const local = neighbourhood(graphOf(INDEX, { removeTags: [], privatePages: "mark" }), "/hub", 1)
  const radius = radii(local, graph.local.sizes)
  // The hub has five edges here: to the spoke, the secret twice (each way) and its two tags. 10 + 2√5.
  expect(radius.get("/hub")).toBeCloseTo(14.472, 3)
  // The secret has two, to and from the hub, and is private: (10 + 2√2) × 0.8.
  expect(radius.get("/secret")).toBeCloseTo(10.263, 3)
  // #ai has one note under it here, the hub; #engineering is not in this graph.
  expect(radius.get("/tags/engineering/ai")).toBe(11)

  // In the whole graph, #engineering has the spoke, and the hub through #ai: 10 + √2.
  const whole = radii(graphOf(INDEX, { removeTags: [], privatePages: "mark" }), graph.local.sizes)
  expect(whole.get("/tags/engineering")).toBeCloseTo(11.414, 3)
})

test("an edge is drawn at its most opaque at half its length or nearer, and at its least at twice it or further", () => {
  const range = { min: 0.2, max: 1 }
  expect(edgeOpacity(10, 50, range)).toBe(1)
  expect(edgeOpacity(25, 50, range)).toBe(1)
  // Halfway from 25 to 100.
  expect(edgeOpacity(62.5, 50, range)).toBeCloseTo(0.6, 9)
  expect(edgeOpacity(100, 50, range)).toBeCloseTo(0.2, 9)
  expect(edgeOpacity(400, 50, range)).toBeCloseTo(0.2, 9)
})
