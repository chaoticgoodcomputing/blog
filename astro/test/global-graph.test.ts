import { expect, test } from "vitest"
import { defaultPeriod, globalGraph } from "../src/lib/global-graph.ts"
import { labelled, litBy, neighbourhood, pulseOpacity, type Graph, type GraphIndex } from "../src/lib/graph.ts"
import { fittedView, labelBox, layOut, shellRadius } from "../src/lib/graph-layout.ts"
import { numbersIn, withNumber } from "../src/lib/graph-tuning.ts"
import { graph } from "../src/site.config.ts"

// A graph index written out, read on 15 June 2026: a note from this month, two from earlier this
// year, a private page from this month, a note from two years ago, and two tags' description notes.
const NOW = new Date("2026-06-15T12:00:00.000Z")
const INDEX: GraphIndex = {
  notes: [
    { url: "/recent", title: "Recent", date: "2026-06-01T00:00:00.000Z", tags: ["engineering"], links: [], private: false },
    { url: "/spring", title: "Spring", date: "2026-04-01T00:00:00.000Z", tags: ["writing"], links: ["/recent"], private: false },
    { url: "/winter", title: "Winter", date: "2026-01-10T00:00:00.000Z", tags: ["engineering/ai"], links: [], private: false },
    { url: "/secret", title: "Secret", date: "2026-06-10T00:00:00.000Z", tags: ["private"], links: ["/recent"], private: true },
    { url: "/old", title: "Old", date: "2024-01-01T00:00:00.000Z", tags: ["horticulture"], links: ["/recent"], private: false },
    { url: "/tags/engineering", title: "Engineering", date: "2020-01-01T00:00:00.000Z", tags: [], links: [], private: false },
    { url: "/tags/horticulture", title: "Horticulture", date: "2020-01-01T00:00:00.000Z", tags: [], links: [], private: false },
  ],
}

const ids = (graph: Graph) => graph.nodes.map((node) => node.id).sort()

test("over the last month, the global graph is the notes dated within it, and the tags they carry", () => {
  const month = globalGraph(INDEX, graph.global, { period: "month", includePrivate: false }, NOW)
  // A tag's description note is the tag's node, and goes with the tag: #horticulture's notes are
  // all older than a month.
  expect(ids(month)).toEqual(["/recent", "/tags/engineering"])
})

test("on the last day of a month, the last month starts on the same day of the month before, or its last day", () => {
  // Read on 31 March 2026: the month before has 28 days, so the last month is from 28 February.
  const index: GraphIndex = {
    notes: [
      { url: "/march", title: "March", date: "2026-03-02T00:00:00.000Z", tags: [], links: [], private: false },
      { url: "/end-of-february", title: "End of February", date: "2026-02-28T13:00:00.000Z", tags: [], links: [], private: false },
      { url: "/february", title: "February", date: "2026-02-27T00:00:00.000Z", tags: [], links: [], private: false },
    ],
  }
  const month = globalGraph(index, graph.global, { period: "month", includePrivate: false }, new Date("2026-03-31T12:00:00.000Z"))
  expect(ids(month)).toEqual(["/end-of-february", "/march"])
})

test("on 29 February, the last year starts on 28 February of the year before", () => {
  const index: GraphIndex = {
    notes: [
      { url: "/in", title: "In", date: "2027-02-28T13:00:00.000Z", tags: [], links: [], private: false },
      { url: "/out", title: "Out", date: "2027-02-28T11:00:00.000Z", tags: [], links: [], private: false },
    ],
  }
  const year = globalGraph(index, graph.global, { period: "year", includePrivate: false }, new Date("2028-02-29T12:00:00.000Z"))
  expect(ids(year)).toEqual(["/in"])
})

test("over the last year, with private pages, the global graph adds the year's notes and the private page, marked", () => {
  const year = globalGraph(INDEX, graph.global, { period: "year", includePrivate: true }, NOW)
  expect(ids(year)).toEqual(["/recent", "/secret", "/spring", "/tags/engineering", "/tags/engineering/ai", "/tags/writing", "/winter"])
  expect(year.nodes.find((node) => node.id === "/secret")).toMatchObject({ private: true })
  // The private tag is removed, as the site configures, though its page is drawn.
  expect(year.edges).toContainEqual({ source: "/secret", target: "/recent", kind: "noteNote" })
})

test("over all time, the global graph is every note and every tag, and no private page unless asked", () => {
  const all = globalGraph(INDEX, graph.global, { period: "all", includePrivate: false }, NOW)
  expect(ids(all)).toEqual([
    "/old",
    "/recent",
    "/spring",
    "/tags/engineering",
    "/tags/engineering/ai",
    "/tags/horticulture",
    "/tags/writing",
    "/winter",
  ])
  expect(all.edges).toContainEqual({ source: "/old", target: "/recent", kind: "noteNote" })
})

test("the global graph opens on its configured period, widened until it holds the fewest posts it should", () => {
  const filters = (minPosts: number, timePeriod: "month" | "year" | "all" = "month", includePrivate = false) => ({
    timePeriod,
    includePrivate,
    minPosts,
  })
  // This month has one post, Recent; this year three; all time four.
  expect(defaultPeriod(INDEX, filters(1), NOW)).toBe("month")
  expect(defaultPeriod(INDEX, filters(3), NOW)).toBe("year")
  expect(defaultPeriod(INDEX, filters(4), NOW)).toBe("all")
  // More than there are: every post there is.
  expect(defaultPeriod(INDEX, filters(10), NOW)).toBe("all")
  // Never narrower than configured.
  expect(defaultPeriod(INDEX, filters(1, "year"), NOW)).toBe("year")
  // With private pages shown, this month has two pages: Recent and Secret.
  expect(defaultPeriod(INDEX, filters(2, "month", true), NOW)).toBe("month")
})

test("laid out, the pinned tags rest on the shell, evenly spaced round it, and each note settles nearer its own tag than another", () => {
  const whole = globalGraph(INDEX, graph.global, { period: "all", includePrivate: false }, NOW)
  const { simulation, nodes, shell } = layOut(whole, graph.global)
  simulation.tick(300)
  const at = (id: string) => nodes.find((node) => node.id === id)!

  // Eight nodes: 150 + 50 × √8. Only the pinned tags this graph has are on it.
  expect(shell).toBeCloseTo(291.42, 2)
  const pinned = ["/tags/engineering", "/tags/writing", "/tags/horticulture"].map(at)
  for (const tag of pinned) expect(Math.hypot(tag.x!, tag.y!)).toBeCloseTo(shell!, 0)
  // Three tags, each a third of the way round from the next.
  const [a, b, c] = pinned.map((tag) => Math.atan2(tag.y!, tag.x!)).sort((a, b) => a - b) as [number, number, number]
  for (const gap of [b - a, c - b, 2 * Math.PI - (c - a)]) expect(gap).toBeCloseTo((2 * Math.PI) / 3, 6)

  const distance = (a: string, b: string) => Math.hypot(at(a).x! - at(b).x!, at(a).y! - at(b).y!)
  expect(distance("/old", "/tags/horticulture")).toBeLessThan(distance("/old", "/tags/engineering"))
  expect(distance("/old", "/tags/horticulture")).toBeLessThan(distance("/old", "/tags/writing"))
  expect(distance("/winter", "/tags/engineering")).toBeLessThan(distance("/winter", "/tags/writing"))
})

test("turning the shell by a pinned tag puts it towards the point, the others turning with it, evenly spaced", () => {
  const whole = globalGraph(INDEX, graph.global, { period: "all", includePrivate: false }, NOW)
  const { simulation, nodes, shell, turnShell } = layOut(whole, graph.global)
  const at = (id: string) => nodes.find((node) => node.id === id)!
  const pinned = ["/tags/engineering", "/tags/writing", "/tags/horticulture"].map(at)

  // Straight down, from anywhere along that way: the tag lands on the ring.
  expect(turnShell(pinned[1]!, 0, 10)).toBe(true)
  simulation.tick(50)
  expect(pinned[1]!.x!).toBeCloseTo(0, 6)
  expect(pinned[1]!.y!).toBeCloseTo(shell!, 6)
  const angles = pinned.map((tag) => Math.atan2(tag.y!, tag.x!)).sort((a, b) => a - b) as [number, number, number]
  for (const gap of [angles[1] - angles[0], angles[2] - angles[1], 2 * Math.PI - (angles[2] - angles[0])]) {
    expect(gap).toBeCloseTo((2 * Math.PI) / 3, 6)
  }
  // A note isn't pinned, and turns nothing.
  expect(turnShell(at("/recent"), 0, 10)).toBe(false)
})

test("laid out, what has no way along its edges to a pinned tag is kept inside the shell", () => {
  // A private page whose only tag is removed, and which links nowhere, and two notes with no tags
  // that link only to each other: nothing pulls them in, and every other node pushes them out.
  const index: GraphIndex = {
    notes: [
      ...INDEX.notes,
      { url: "/alone", title: "Alone", date: "2026-06-12T00:00:00.000Z", tags: ["private"], links: [], private: true },
      { url: "/pair-a", title: "Pair A", date: "2026-06-12T00:00:00.000Z", tags: [], links: ["/pair-b"], private: false },
      { url: "/pair-b", title: "Pair B", date: "2026-06-12T00:00:00.000Z", tags: [], links: [], private: false },
    ],
  }
  const whole = globalGraph(index, graph.global, { period: "all", includePrivate: true }, NOW)
  const { simulation, nodes, shell } = layOut(whole, graph.global)
  simulation.tick(300)
  for (const id of ["/alone", "/pair-a", "/pair-b"]) {
    const node = nodes.find((node) => node.id === id)!
    // On the ring at most, give or take a step along it.
    expect(Math.hypot(node.x!, node.y!)).toBeLessThan(shell! + 1)
  }
})

test("each node starts on its top-level tag, a note by its first tag, before the layout moves it", () => {
  const whole = globalGraph(INDEX, graph.global, { period: "all", includePrivate: false }, NOW)
  const { nodes } = layOut(whole, graph.global)
  const at = (id: string) => nodes.find((node) => node.id === id)!
  const apart = (a: string, b: string) => Math.hypot(at(a).x! - at(b).x!, at(a).y! - at(b).y!)
  // Winter's first tag is #engineering/ai: it starts on #engineering, as #engineering/ai does.
  expect(apart("/winter", "/tags/engineering")).toBeLessThan(10)
  expect(apart("/tags/engineering/ai", "/tags/engineering")).toBeLessThan(10)
  expect(apart("/old", "/tags/horticulture")).toBeLessThan(10)
  // Never on one point: d3-force would push them apart at random.
  expect(apart("/winter", "/tags/engineering/ai")).toBeGreaterThan(0)
})

test("where a local graph has no top-level tag, a node starts on the highest tag of its line it has", () => {
  const local = neighbourhood(globalGraph(INDEX, graph.global, { period: "all", includePrivate: false }, NOW), "/winter", 1)
  expect(local.nodes.map((node) => node.id)).not.toContain("/tags/engineering")
  const { nodes } = layOut(local, graph.local)
  const [winter, ai] = ["/winter", "/tags/engineering/ai"].map((id) => nodes.find((node) => node.id === id)!) as [typeof nodes[0], typeof nodes[0]]
  expect(Math.hypot(winter.x! - ai.x!, winter.y! - ai.y!)).toBeLessThan(10)
})

test("at rest, nodes keep the gap between them, and clear of every tag's label", () => {
  const whole = globalGraph(INDEX, graph.global, { period: "all", includePrivate: false }, NOW)
  const settings = { ...graph.global, sizes: { ...graph.global.sizes, gap: 10 } }
  const { simulation, nodes, radius } = layOut(whole, settings, (label) => label.length * 7)
  simulation.tick(300)
  const r = (id: string) => radius.get(id)!
  for (const [i, a] of nodes.entries()) {
    for (const b of nodes.slice(i + 1)) {
      // Give or take a pixel: the collisions are forces, not walls.
      expect(Math.hypot(a.x! - b.x!, a.y! - b.y!) - r(a.id) - r(b.id)).toBeGreaterThan(10 - 1)
    }
  }
  for (const tag of nodes.filter((node) => node.kind === "tag")) {
    const box = labelBox(tag.x!, tag.y!, r(tag.id), tag.label.length * 7, settings.sizes.label)
    for (const node of nodes.filter((node) => node !== tag)) {
      const [px, py] = [Math.min(Math.max(node.x!, box.left), box.right), Math.min(Math.max(node.y!, box.top), box.bottom)]
      expect(Math.hypot(node.x! - px, node.y! - py)).toBeGreaterThan(r(node.id))
    }
  }
})

test("a graph with no shell is laid out with no tag pinned", () => {
  const whole = globalGraph(INDEX, graph.global, { period: "all", includePrivate: false }, NOW)
  const { shell } = layOut(whole, graph.local)
  expect(shell).toBeUndefined()
})

test("each edge's length at rest is its link distance times the shell's diameter, drawn or not", () => {
  const whole = globalGraph(INDEX, graph.global, { period: "all", includePrivate: false }, NOW)
  const shellSize = { base: 100, scaling: 0 }
  const forces = { ...graph.local.forces, linkDistance: { tagTag: 0.1, tagNote: 0.25, noteNote: 0.5 } }
  // A diameter of 200, whether the shell is drawn or not.
  for (const settings of [{ ...graph.local, shellSize, forces }, { ...graph.global, shellSize, forces }]) {
    expect(layOut(whole, settings).linkDistance).toEqual({ tagTag: 20, tagNote: 50, noteNote: 100 })
  }
})

test("hovering a note lights it, the nodes it has an edge to, and those edges", () => {
  const whole = globalGraph(INDEX, graph.global, { period: "all", includePrivate: false }, NOW)
  const { nodes, edges } = litBy(whole, "/recent")
  expect([...nodes].sort()).toEqual(["/old", "/recent", "/spring", "/tags/engineering"])
  expect([...edges].map(([edge, hops]) => `${edge.source} ${edge.target} ${hops}`).sort()).toEqual([
    "/old /recent 0",
    "/recent /tags/engineering 0",
    "/spring /recent 0",
  ])
})

test("hovering a tag lights the tags under it too, and their neighbours, each edge as far down as it starts", () => {
  const whole = globalGraph(INDEX, graph.global, { period: "all", includePrivate: false }, NOW)
  const { nodes, edges } = litBy(whole, "/tags/engineering")
  expect([...nodes].sort()).toEqual(["/recent", "/tags/engineering", "/tags/engineering/ai", "/winter"])
  expect([...edges].map(([edge, hops]) => `${edge.source} ${edge.target} ${hops}`).sort()).toEqual([
    "/recent /tags/engineering 0",
    "/tags/engineering /tags/engineering/ai 0",
    "/winter /tags/engineering/ai 1",
  ])
})

test("at rest only the tags are labelled; hovering a node labels it and the tags it lights, and no other note", () => {
  const whole = globalGraph(INDEX, graph.global, { period: "all", includePrivate: false }, NOW)
  const labels = (hovered?: string) => {
    const lit = hovered === undefined ? undefined : litBy(whole, hovered)
    return whole.nodes.filter((node) => labelled(node, hovered, lit)).map((node) => node.id).sort()
  }
  const tags = whole.nodes.filter((node) => node.kind === "tag").map((node) => node.id).sort()
  expect(labels()).toEqual(tags)
  expect(labels("/recent")).toEqual(["/recent", "/tags/engineering"])
  expect(labels("/tags/engineering")).toEqual(["/tags/engineering", "/tags/engineering/ai"])
})

test("a lit edge pulses: from faint to whole and back over `on`, faint for `off`, starting `delay` later a tag further down", () => {
  const pulse = { on: 800, off: 1000, delay: 200 }
  // A quarter of the way to whole at the start and the end of a pulse, whole halfway through.
  expect(pulseOpacity(0, 0, pulse)).toBeCloseTo(0.25, 9)
  expect(pulseOpacity(400, 0, pulse)).toBeCloseTo(1, 9)
  expect(pulseOpacity(200, 0, pulse)).toBeCloseTo(0.625, 9)
  expect(pulseOpacity(1200, 0, pulse)).toBeCloseTo(0.25, 9)
  // The next pulse, 1800ms after the first.
  expect(pulseOpacity(2200, 0, pulse)).toBeCloseTo(1, 9)
  // A hop down, each 200ms behind.
  expect(pulseOpacity(400, 1, pulse)).toBeCloseTo(0.625, 9)
  expect(pulseOpacity(100, 1, pulse)).toBeCloseTo(0.25, 9)
  // With no pulse, whole.
  expect(pulseOpacity(1200, 0, { on: 0, off: 0, delay: 0 })).toBe(1)
})

test("the settings panel tunes each number of a graph's settings, by its path, leaving the settings it was given as they were", () => {
  const settings = { forces: { charge: -500, linkDistance: { tagTag: 20 } }, removeTags: ["private"], shell: { radiusBase: 150 } }
  expect(numbersIn(settings)).toEqual([
    { path: "forces.charge", value: -500 },
    { path: "forces.linkDistance.tagTag", value: 20 },
    { path: "shell.radiusBase", value: 150 },
  ])
  expect(withNumber(settings, "forces.linkDistance.tagTag", 35)).toEqual({
    forces: { charge: -500, linkDistance: { tagTag: 35 } },
    removeTags: ["private"],
    shell: { radiusBase: 150 },
  })
  expect(settings.forces.linkDistance.tagTag).toBe(20)
})

test("the view fits the shell with the Quartz site's zoomMargin, 80, round it, 8px in from the box's edges", () => {
  expect(graph.global.shell.zoomMargin).toBe(80)
  // A ring of 200: 2 × (200 + 80) across, fitted to 400 - 2 × 8, round the box's middle.
  const view = fittedView([], { width: 400, height: 400, margin: 8 }, graph.global, {
    radius: 200,
    margin: graph.global.shell.zoomMargin,
  })
  expect(view.k).toBeCloseTo(384 / 560, 9)
  expect(view.x).toBeCloseTo(200 - (384 / 560) * 200, 9)
  expect(view.y).toBeCloseTo(200 - (384 / 560) * 200, 9)
})

test("the view is never larger than the graph", () => {
  expect(fittedView([{ x: 0, y: 0, r: 10 }], { width: 1000, height: 800, margin: 8 }, graph.local)).toEqual({
    k: 1,
    x: 0,
    y: 0,
  })
})

test("the shell's radius grows with the square root of how many nodes the graph has", () => {
  // 150 + 50 × √16.
  expect(shellRadius(16, graph.global.shellSize)).toBe(350)
  expect(shellRadius(0, graph.global.shellSize)).toBe(150)
})
