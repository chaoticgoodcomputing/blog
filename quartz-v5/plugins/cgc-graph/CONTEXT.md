# cgc-graph

The Quartz 5 plugin that draws the graph view: v4's graph (FORK-LEDGER `components/Graph.tsx` and
`components/scripts/graph/**`), as a consumer of the `cgc-tags` engine (#20, #74). Ours to ship,
because stock `@quartz-community/graph` reads only core's content index, which has no dates and none
of our artifacts. Inherits the family vocabulary in [`quartz-v5/CONTEXT.md`](../../CONTEXT.md), and
the tag vocabulary of [`cgc-tags`](../cgc-tags/CONTEXT.md) and
[`tags-core`](../../libs/tags-core/CONTEXT.md).

## Language

**Graph index**:
`static/cgcGraph.json`, the plugin's own content index and its published artifact: every authored
page, keyed by slug, with its title, links, tags and date (docs/adr/0001). What every graph is
drawn from.
_Avoid_: content index (that is core's `contentIndex.json`), graph data, tag index

**Authored page**:
A page with a file behind it, Markdown or anything a page type renders from a file, such as
`.mdx`. The **graph index** holds these and no others: not the tag pages and folder pages Quartz
generates, and not unlisted pages.
_Avoid_: content page, real page, post (v4's word, kept only in option names)

**Local graph**:
The graph in the page's layout: the current page and every node within `depth` edges of it.
_Avoid_: mini graph, page graph

**Global graph**:
Every page and tag of the site, in the **dialog**, behind the local graph's button or Ctrl/⌘+G, with
the **filters**.
_Avoid_: full graph (v4's FullGraph, a separate component, which is dropped), site graph

**Node**:
One circle in a graph: a page, or a **tag node**. Its id is the page's simple slug (`/` for the
site's index) or `tags/<tag>`.
_Avoid_: vertex, point

**Tag node**:
A tag, drawn as a ring, with an edge to each page carrying it and to each of its subtags. A tag's
description page, at `tags/<tag>` or `tags/<tag>/index`, is its tag node, not a page node of its own.
_Avoid_: tag page (that is the page it links to)

**Edge**:
A line between two nodes, of one of three kinds, each with its own distance, strength, opacity
and line style: tag to subtag (`tagTag`), tag to page (`tagPost`), page to page (`postPost`).
_Avoid_: link (in prose; the option names say it), connection

**Private page**:
A page carrying one of the `privateTags`, or a tag under one. Drawn like any page, in
`nodeColors.private` when that is set, and hidden by the global graph's private filter.
_Avoid_: private note (the filter's label says it), hidden page

**Filters**:
The global graph's time slider (every page, the last year, the last month, by each page's date in
the **graph index**) and its private toggle.
_Avoid_: controls, graph settings

**Text alternative**:
The list inside each canvas of every node it draws, linking to its page, with the nodes it has an
edge to (docs/adr/0002). Never rendered; read by assistive technology in the canvas's place.
_Avoid_: fallback, hidden list, accessibility tree

**Dialog**:
The `<dialog>` the global graph opens in, modal, in the page's top layer (docs/adr/0003).
_Avoid_: modal, overlay, portal

## Constraints

- **It reads only what `cgc-tags` publishes:** each page's tags in the **graph index** are the keys
  of its `fileData.cgcTags.tags`. A tag's parent is its path's prefix (`tags-core`'s `parentOf`).
- **Every colour it paints is resolved in script** through `tags-core`'s one resolver, the theme's
  as well as the site's options, and resolved again on `themechange`, with no new layout.
- **The browser runtime is one self-contained script,** d3 and tween.js inlined by `build.mjs`: a page
  fetches nothing for the graph but the **graph index**, once per load.
- **Tag colours and icons are #77's.** Until then a tag node is ringed in the theme's `tertiary`.
