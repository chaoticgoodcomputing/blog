---
status: accepted
date: 2026-09-25
---

# Nodes are painted with their tag

v4 painted a graph node with its tag in two ways. A tag node was a grey disc ringed in the tag's
colour, and a page was drawn in the theme's `secondary`, `tertiary` or `gray`, whatever its tags
([nodeFactory.ts:87-98](https://github.com/chaoticgoodcomputing/blog/blob/9e48f89b256f511a94f07d473d46395d91730c53/quartz/components/scripts/graph/ui/nodeFactory.ts#L87-L98),
[styles.ts:31-45](https://github.com/chaoticgoodcomputing/blog/blob/9e48f89b256f511a94f07d473d46395d91730c53/quartz/components/scripts/graph/ui/styles.ts#L31-L45)).
Each node also carried an icon, its first frontmatter tag's
([nodeFactory.ts:100-125](https://github.com/chaoticgoodcomputing/blog/blob/9e48f89b256f511a94f07d473d46395d91730c53/quartz/components/scripts/graph/ui/nodeFactory.ts#L100-L125)).
The browser fetched each icon from jsDelivr, or from `/static/icons/` for the site's own, and forced
every shape in it to a white fill
([iconService.ts:48-58](https://github.com/chaoticgoodcomputing/blog/blob/9e48f89b256f511a94f07d473d46395d91730c53/quartz/util/iconService.ts#L48-L58),
[:101-114](https://github.com/chaoticgoodcomputing/blog/blob/9e48f89b256f511a94f07d473d46395d91730c53/quartz/util/iconService.ts#L101-L114)).
All of that assumed one dark scheme.

Under v5 a tag's colour is a colour property that the `cgc-tags` engine publishes by name, and the
site ships both schemes (#31, #41). Icons are drawn when the site builds, never fetched (#29). The
ticket asked for each node to be filled with its page's primary tag colour, inherited colours
included, for its tag icons with no runtime fetch, and for a repaint when the reader switches
scheme. Decided on
[`cgc-graph`: tag colours, icons and repaint on scheme change](https://github.com/chaoticgoodcomputing/blog/issues/77).

## Decision

**A node is painted with the tag that stands for it:** a page's primary tag, as the engine resolves
it, or a tag node's own tag. That tag's colour fills the node, and its icon is drawn at the centre,
at v4's size of 1.4 times the radius.

- **Colour** comes from the engine's tag index, `static/cgcTags.json`, which names each tag's colour
  property. The runtime fetches that index beside the graph's own and resolves each property
  through `tags-core`'s resolver. So a tag with no colour of its own gets its ancestor's, through the
  cascade, as a badge does. A new palette is made on `themechange`, and every property is resolved
  again in it.
- **The site's `nodeColors` still win,** as in v4. On the real site `private: "#c54040"` draws private
  pages in v4's red. **A page with no tags** keeps v4's colours: `secondary` for the current page,
  `tertiary` for a visited one, and `gray` for the rest.
- **Icons ride in the graph's index.** The emitter draws every icon a tag in the site carries with
  `@chaoticgoodcomputing/icons`, in `currentColor`, into the index's `icons` map, keyed by icon id.
  An id no collection has fails the build. The index's pages move under `pages`
  ([ADR-0001's amendment](./0001-the-graph-publishes-its-own-index.md#amendment-pages-and-icons)).
- **An icon is cut out in the page's background colour,** the theme's `light`, which is resolved
  like any other colour. The runtime sets the SVG's `color` to it and draws the SVG as an image. It
  keeps one image per colour, and draws the one it last loaded while a new colour's loads, so a
  scheme switch never blanks an icon.

## Consequences

- **A page's node shows the reader's history in its ring,** not its fill: a tagged page is its
  tag's colour whether or not the reader has visited it, ringed in `secondary` when it is the
  current page and `tertiary` when the reader has visited it (see the amendment below). The current
  page still swells. _Superseded by the visited-rim amendment: no node is ringed, and a visited
  page's rim is `tertiary`._
- **A page fetches two indexes for the graph**, its own and the engine's, side by side and once per
  load. If the engine's fails, the graph still draws, in v4's colours and without icons.
- **The index grows by the icons.** On the real vault that is about 40 icons at a few hundred bytes
  each. Loading the emitter also loads `@iconify/tools`, about 0.2s per process
  (`libs/icons` ADR-0001).
- **The site's `nodeColors.public`, if a site sets it, paints over every tag colour.** That is v4's
  rule. The real site doesn't set it.

## Considered alternatives

- **v4's look:** grey tag discs ringed in the tag's colour, pages in the theme's colours, and white
  icons. The ticket asked for filled nodes. White is also a literal, which ADR-0003's colour-value
  amendment rules out as a default. In the dark scheme it vanishes on a light fill such as the
  default `darkgray`, `#d4d4d4`. The page's background always stands out from a tag colour, because
  a tag colour is made to stand out on the page.
- **A separate icon file,** such as `static/cgcGraphIcons.json`. That is still a fetch for icons at
  run time, and a third request.
- **Icons in each page's HTML.** Every page would carry every icon, for a graph that may never be
  drawn.
- **Canvas paths built from each icon's SVG.** A site's own icons may carry circles, rects and
  transforms. An image draws whatever the SVG holds.
- **v4's first frontmatter tag for a page's icon.** The engine's primary tag already stands for a
  page, and #20 dropped v4's icon priority, so the icon follows the same tag as the colour.

## Amendment: the reader's own page and history, as a ring

_2026-09-26, from the review of [`cgc-graph`: tag colours, icons and repaint on scheme change](https://github.com/chaoticgoodcomputing/blog/issues/77)._

The first decision filled a tagged page with its tag's colour and nothing else, so on any tagged
page the reader's own node was marked only by its swelling, and the pages they had visited looked
like the rest. v4 marked both, filling the current page `secondary` and visited ones `tertiary`.
The tag's fill stays, as the ticket asks, and v4's two colours come back as the node's ring, which
the drawing already strokes for a tag node the tag index doesn't hold. A site's `nodeColors` still
win over both, as in v4.

## Amendment: a node with a tag is its tag's bubble

_2026-09-26, from the owner's review notes of that day, on
[Graph nodes drawn as tag bubbles](https://github.com/chaoticgoodcomputing/blog/issues/83). The notes
come after spec #53 and win where they differ from an earlier ticket or ADR._

The owner asked for one bubble style "shared across both the list/badges as well as on graph nodes":
a rim in the tag colour, a light or dark gray circle, and a black or white icon. The family records
that rule in
[ADR-0003's tag bubble amendment](../../../../../docs/adr/0003-library-css-in-plugins-application-css-at-the-site.md#amendment-the-tag-bubble-and-what-the-tag-colour-paints),
and builds the bubble once, in `@chaoticgoodcomputing/tags-core` (`./bubble` and `./bubble.css`). The
filled node above breaks it, and the rule wins.

**Decided:** a node with a tag, a page's primary tag or a tag node's own, is drawn as that tag's
bubble.

- **The palette is tags-core's.** The rim is the tag's colour property (`bubblePaletteOf`), the circle
  the theme's `--lightgray` and the icon its `--dark` (`BUBBLE_PALETTE`). Each is resolved through the
  one resolver, and again on `themechange`, so a scheme switch repaints all three where the graph
  stands. The icon's `currentColor` is the resolved `--dark` in place of the page's `light`, which
  replaces this ADR's cut-out icon.
- **Its proportions are the badge's.** `bubble.css` draws a 32px circle with a 2.5px rim and an 18px
  icon. The canvas draws the same shape at the node's radius, with the rim 2.5/16 of the radius (never
  under a pixel) inside the node's edge and the icon 18/16 of it, so a node of any size and zoom is the
  same bubble. v4's icon at 1.4 times the radius would reach the rim.
- **The reader's own page and the pages they have visited** keep v4's cues, as a ring outside the rim,
  a rim's width clear of it: `secondary` for the current page, `tertiary` for a visited one. v4 filled
  those nodes, and the first amendment ringed them over the fill, but a bubble's circle is always the
  theme's gray and its rim is the tag's. The current page still swells, and a label sits below the
  ring. _Superseded by the visited-rim amendment below._
- **A page with no tags keeps v4's disc,** filled `secondary` for the current page, `tertiary` for a
  visited one and `gray` for the rest. It has no tag, so no bubble, and the disc is v4's look
  unchanged. A tag the tag index doesn't hold, as when the index failed to load, is a bubble rimmed in
  `tertiary`, with no icon.
- **The site's `nodeColors` rim a bubble** in place of the tag colour, and fill a page with no tags,
  as v4 filled every node. The bubble keeps its circle and icon. The real site's
  `nodeColors: { private: "#c54040" }` is **deleted**: it painted over the tag colour of every private
  page, and the site's `private` tag already carries a red of its own, `light-dark(#cc0000, #FF0000)`,
  with a lock icon, so private pages are rimmed in red by the rule itself. The global graph's private
  toggle, which took `nodeColors.private`, falls back to the theme's `--secondary` on the real site.

v4 already drew a tag node this way, a grey disc ringed in its tag's colour
([nodeFactory.ts:87-98](https://github.com/chaoticgoodcomputing/blog/blob/9e48f89b256f511a94f07d473d46395d91730c53/quartz/components/scripts/graph/ui/nodeFactory.ts#L87-L98)),
so the bubble is v4's tag node, with the theme's gray in place of v4's grey, and a page with a tag now
looks like one.

**Rejected:**

- **Filling the current page's circle in `secondary`,** v4's cue, or ringing its rim in it: the circle
  is always the theme's gray and the rim always the tag's, so either would break the rule on the one
  node the reader looks for first.
- **An empty bubble for a page with no tags,** rimmed in the engine's default colour: it would look
  like a page tagged with a colourless tag, and lose v4's disc, the nearest look the rule allows for a
  node it doesn't cover.
- **Dropping `nodeColors`.** It is v4's option and a site may still want it. As a rim it keeps the
  bubble's shape; only the real site's value conflicted with the rule.

**Consequences:**

- **Small nodes show little tag colour.** In the global graph a page's radius is a few pixels, so its
  bubble is mostly gray with a one-pixel rim, where a filled node showed its tag's colour whole.
- **Edges and circles share `--lightgray`.** Edges are drawn under the nodes, at their opacity, so a
  circle hides the edges that meet it; cgc-graph's edge spec counts the edges' translucent pixels.
- **Proven at the fixture seam** by `e2e/colours.spec.mjs`, `e2e/icons.spec.mjs` and
  `e2e/scheme.spec.mjs`, which read each bubble's rim, circle and icon off the canvas in both schemes
  and after a switch, and by `e2e/site.spec.mjs` on the real site's config.

## Amendment: a visited page's rim is `tertiary`, and no node is ringed

_2026-09-26, the owner's decision on seeing the history ring on the real site._

The ring outside the rim read as confusing: on a reader's own machine most nodes carried one, since
"visited" is every page the browser has opened (`graph-visited` in `localStorage`, never cleared, as
in v4). The owner asked for the difference a visited link shows against an unvisited one instead: a
visited page's bubble takes the theme's **`tertiary`**, v4's visited node colour, **as its rim**, in
place of its tag's colour (and of the site's `nodeColors`, which is theming, where visited is the
reader's own cue). Its circle and icon are unchanged, so the tag's icon still says what it is.

- **No node is ringed.** The history ring is gone for visited pages and for the current page alike.
- **The reader's own page keeps its tag's colour.** It is recorded as visited as soon as it loads, so
  it is exempt; its swelling (`expandSelectedSize`, v4's) marks it, as the owner noted it already did.
- **A page with no tags is unchanged:** v4's disc, filled `secondary` for the current page,
  `tertiary` for a visited one and `gray` for the rest.
- **Not a link colour.** No visited-link colour exists to borrow: stock Quartz styles every link
  `var(--secondary)`, visited or not, Obsidian's link and graph variables have no visited state
  ([Link](https://docs.obsidian.md/Reference/CSS+variables/Editor/Link),
  [Graph](https://docs.obsidian.md/Reference/CSS+variables/Plugins/Graph)), and neither do
  `@quartz-themes/core` or its themes. The owner chose to change the graph only, leaving links as
  they are.

Proven by `e2e/colours.spec.mjs`: the current page's bubble keeps its tag's rim with no `secondary`
around it, and a page the reader has visited is rimmed in `tertiary`, in both schemes. It went red on
the ring first.
