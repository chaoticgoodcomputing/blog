---
status: accepted
date: 2026-09-25
---

# A text alternative inside each canvas

v4's graph was a bare canvas: a picture of the pages around the current one, with nothing for a
screen reader to read. HTML asks a canvas to carry content that conveys what its bitmap does. The
specs had the same problem from the other side: a canvas shows a reader nodes and edges, and a test
can't read them off its pixels. Decided on
[`cgc-graph`: the graph, with its own content index](https://github.com/chaoticgoodcomputing/blog/issues/74).

## Decision

Each time a graph is drawn, the plugin writes inside its canvas a list of what it draws: one item
per node, `li.cgc-graph__node[data-node]`, holding a link to the node's page, marked
`aria-current="page"` for the current page and followed by `(private)` for a private page, and a
nested list of the nodes it has an edge to, `li.cgc-graph__edge[data-node]`. The canvas's
`aria-label` names the graph. The browser never renders a canvas's content, and assistive
technology reads it in the drawing's place.

- **The links are out of the tab order** (`tabindex="-1"`). Nothing shows where they are, so a
  sighted keyboard user would tab through invisible stops. A screen reader lists and follows them
  as it does any link, through Quartz's router.
- **Each edge is listed once, under its source:** the page that links, the tag a page carries, the
  parent of a subtag.
- **While the pointer is over a node, its item is marked `data-hovered`,** as the drawing lights
  it up. The node under the pointer is something a spec can find (see the amendment below, which
  replaced a tooltip).

The specs read a graph through these two: its nodes and edges from the list, and where a node is
drawn by moving a pointer over the canvas until the list marks it.

## Consequences

- **The DOM grows with the graph.** A local graph is a few dozen elements. The global graph of the
  real vault is a few thousand, written when the dialog opens and removed when it closes.
- **The list is the drawing's contract** for which nodes and edges there are. A change to what
  the graph draws that the list doesn't follow fails the specs, which is the point. That a node or
  an edge is painted at all the list can't show, so the specs read the canvas's pixels for that:
  each node's fill, and the edges' strokes by their colour.
- **Crawlers that run scripts see the links.** They lead to pages the page already links to, or that
  link to it, or to its tags.

## Considered alternatives

- **A test-only hook,** such as the node positions on a data attribute. It serves the specs and no
  reader, and the specs would pass on a graph nobody else can read.
- **Reading pixels.** It proves something is drawn, and the scheme spec does it for colours, but it
  can't say which node is which.
- **A visible list beside the graph.** v4 had none, and it would be a second navigation block on
  every page.

## Amendment: no tooltip

_2026-09-26, from the review of [`cgc-graph`: the graph, with its own content index](https://github.com/chaoticgoodcomputing/blog/issues/74)._

The first decision set the canvas's `title` to the hovered node's label, so a spec could find the
node under the pointer. A reader saw it too: the browser's tooltip, over the label the canvas
already draws, so the label showed twice, where v4 showed it once. The test seam had leaked into
what a reader sees. The hovered node's item in the list is marked `data-hovered` in its place. No
reader sees it, and it says what the drawing says: which node the pointer lights up.
