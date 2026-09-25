---
status: accepted
date: 2026-09-25
---

# Nodes are painted with their tag

v4 painted a graph node with its tag in two ways. A tag node was a grey disc ringed in the tag's
colour, and a page was drawn in the theme's `secondary`, `tertiary` or `gray`, whatever its tags
([nodeFactory.ts:87-97](https://github.com/chaoticgoodcomputing/blog/blob/9e48f89b256f511a94f07d473d46395d91730c53/quartz/components/scripts/graph/ui/nodeFactory.ts#L87-L97),
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

- **A page's node no longer shows the reader's history.** A tagged page is its tag's colour whether
  or not the reader has visited it. The current page still swells.
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
