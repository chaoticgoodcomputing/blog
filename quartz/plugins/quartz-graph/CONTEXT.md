# quartz-graph

`@chaoticgoodcomputing/quartz-graph`, manifest name `cgc-graph`: the Quartz 5 plugin that draws the
graph view, and the first of our plugins to be an npm package, loaded by name (#89, #93). It is v4's
graph (FORK-LEDGER `components/Graph.tsx` and `components/scripts/graph/**`), as a consumer of the `quartz-tags` engine (#20, #74, #77). Ours to ship,
because stock `@quartz-community/graph` reads only core's content index, which has no dates and none
of our artifacts. Inherits the family vocabulary in [`quartz/CONTEXT.md`](../../CONTEXT.md), and
the tag vocabulary of [`quartz-tags`](../quartz-tags/CONTEXT.md) and
[`tags-core`](../../libs/tags-core/CONTEXT.md).

## Language

**Graph index**:
`static/cgcGraph.json`, the plugin's own content index and its published artifact: every authored
page, keyed by slug, with its title, links, tags, **primary tag** and date, and every icon a tag in
the site carries, drawn (docs/adr/0001). What every graph is drawn from, with the engine's **tag
index**.
_Avoid_: content index (that is core's `contentIndex.json`), graph data, tag index (that is
`quartz-tags`' `cgcTags.json`)

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
A tag, drawn as a node of its own, with an edge to each page carrying it and to each of its
subtags. A tag's description page, at `tags/<tag>` or `tags/<tag>/index`, is its tag node, not a
page node of its own.
_Avoid_: tag page (that is the page it links to)

**Node's tag**:
The tag that paints a node: a page's **primary tag**, as `quartz-tags` resolves it, or a tag node's
own tag. The node is that tag's **tag bubble**, the one every badge draws: its **tag colour** rims
it, the circle is the theme's `--lightgray` and its icon the theme's `--dark`, from `tags-core`'s
**bubble palette** (docs/adr/0004's bubble amendment, #83). A page with no tags has none, and no
bubble: it is v4's disc, filled in the theme's colours.
_Avoid_: node colour, node tag, category

**Visited rim**:
A bubble's rim in the theme's `tertiary`, in place of its tag's colour, for a page the reader has
visited, as a note: the graph's version of a visited link. A tag's node is exempt, and always keeps its
tag's colour; so is the reader's own page, which its swelling marks instead. No node is ringed outside its rim (docs/adr/0004, visited-rim amendment).
_Avoid_: history ring (its replaced form), halo, highlight, selection ring

**Edge**:
A line between two nodes, of one of three kinds, each with its own distance, strength, opacity
and line style: tag to subtag (`tagTag`), tag to page (`tagPost`), page to page (`postPost`).
_Avoid_: link (in prose; the option names say it), connection

**Private page**:
tags-core's: a page carrying one of the `privateTags`, or a tag under one. Drawn like any page, its
bubble rimmed in `nodeColors.private` when that is set, in place of its tag's colour, and hidden by
the global graph's private filter. The real site sets no `nodeColors`: its `private` tag carries a
red of its own.
_Avoid_: private note (the filter's label says it), hidden page

**Filters**:
The global graph's time slider (every page, the last year, the last month, by each page's date in
the **graph index**) and its private toggle.
_Avoid_: controls, graph settings

**Debug panel**:
The `debugPanel` option's controls, beside the global graph in the **dialog**, one for every graph
setting but `defaultFilterState`, with a switch between the global graph's settings and the local
graph's. The dialog draws whichever graph the switch picks, and draws it afresh on every change. It
shows both graphs' settings as YAML, where they differ from the plugin's defaults, to paste into the
site config. A tuning aid, not for readers: with `debugPanel: serve`, only when the site is served,
never in a build to publish.
_Avoid_: settings panel, config editor, dev tools

**Text alternative**:
The list inside each canvas of every node it draws, linking to its page, with the nodes it has an
edge to (docs/adr/0002). Never rendered; read by assistive technology in the canvas's place.
_Avoid_: fallback, hidden list, accessibility tree

**Dialog**:
The `<dialog>` the global graph opens in, modal, in the page's top layer (docs/adr/0003).
_Avoid_: modal, overlay, portal

## Constraints

- **It reads only what `quartz-tags` publishes:** each page's tags in the **graph index** are the keys
  of its `fileData.cgcTags.tags`. A tag's parent is its path's prefix (`tags-core`'s `parentOf`),
  and whether a tag is under another, for `removeTags`, and whether a page is private are
  `tags-core`'s rules too (`underAny`, `privatePageTest`). The tags its options name are normalised
  as the engine normalises a tag, when the site builds, so they match the tags in the graph index.
- **It reads tag colours and icons only as `quartz-tags` names them:** a tag's colour property from the
  engine's tag index, `static/cgcTags.json`, and its icon id there too. It draws the icons itself,
  when the site builds, with `@chaoticgoodcomputing/icons`.
- **Every colour it paints is resolved in script** through `tags-core`'s one resolver, the theme's,
  the site's options and each tag's, and resolved again on `themechange`, with no new layout. A
  bubble's three come from `tags-core`'s **bubble palette**, never from colours of its own, so the
  canvas's bubble and the badges' can't drift apart. Icons are drawn in the resolved `--dark`.
- **The browser runtime is one self-contained script,** d3 and tween.js inlined by `build.mjs`: a page
  fetches nothing for the graph but the **graph index** and the engine's tag index, once per load,
  and never an icon.
