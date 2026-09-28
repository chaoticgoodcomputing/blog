# quartz-tag-explorer

`@chaoticgoodcomputing/quartz-tag-explorer`, manifest name `cgc-tag-explorer`: the Quartz 5
component that lets a reader browse the site by tag: a tree of the site's tags, each in its tag
colour with its icon, and the pages under each. On a narrow screen it is a drawer of its own. It is
v4's TagExplorer and MobileSidebarMenu, as a consumer of the `quartz-tags` engine (#42, #44, #76).
Inherits the family vocabulary in [`quartz/CONTEXT.md`](../../CONTEXT.md), the tag vocabulary of
[`quartz-tags`](../quartz-tags/CONTEXT.md) and [`tags-core`](../../libs/tags-core/CONTEXT.md), and
the icon vocabulary of [`icons`](../../libs/icons/CONTEXT.md).

## Language

**Tree**:
Every tag in the corpus, less the excluded ones and, with **private pages left out**, the private
tags and any tag only private pages carry, nested by the tag hierarchy. Each level is in the
`tagSort` order, ties A→Z. The tree is rendered into every page when the site builds
([ADR-0001](./docs/adr/0001-the-tree-renders-at-build-time-its-pages-load-from-an-index.md)).
_Avoid_: tag index (v4's JSON file), trie, sidebar

**Tag** (in the tree):
One tag's item, `.cgc-tag-explorer__tag`, with its **fold**, its link to the tag's page (**mark**,
name and **count**), and below them its subtags and then its **pages**.
_Avoid_: folder, node (in prose), tag button

**Fold**:
The button before a tag that opens and closes it. A tag starts closed unless `defaultState` is
`open`, or the reader opened it before.
_Avoid_: chevron (that is its icon), caret and toggle (those are the drawer's)

**Mark**:
The tag colour's one place in a tag's row, `.cgc-tag-explorer__mark`: the tag's icon, drawn in
`currentColor`, or a dot where the tag has none. It carries the tag colour as its own inline
`color`. Not a **tag bubble**: the family's one mark the tag colour paints whole (ADR-0003's tag
bubble amendment). The tag colour never paints text.
_Avoid_: icon (for the element), swatch, badge

**Count**:
How many pages are under a tag: those carrying it or any of its subtags, each once, less the private
ones when **private pages are left out**. The same count as quartz-tag-list's badges while private pages
are listed; quartz-tag-list's badges always count them.
_Avoid_: post count, total

**Pages** (of a tag):
The pages that carry the tag itself, listed under its subtags when it opens: public before private,
then newest first, undated last, and pages with the same date A→Z. A page carrying a subtag is
listed under the subtag only.
_Avoid_: files, posts, children

**Pages index**:
`static/cgcTagExplorer.json`, which the plugin's emitter writes and its script reads to fill a tag's
pages in: every listed page once, and each tag's pages in order. It belongs to this plugin, and it is
not a published artifact.
_Avoid_: content index (stock's, or quartz-graph's), tag index

**Private page**:
tags-core's: a page carrying one of the `privateTags`, or a tag under one. It is listed after a
tag's public pages, with a **lock** where a public page has a bullet, unless **private pages are
left out**.
_Avoid_: locked page, hidden page (by default it is listed)

**Private pages left out**:
The `excludePrivate` option, off by default and on for the real site (the owner's review notes of
2026-09-26, #85). Every private page leaves every tag's **count** and **pages** and the **pages
index**, so no private title reaches the browser. The private tags and their subtags leave the
**tree** as **excluded tags** do, and a tag only private pages carry has no pages left, so it leaves
too. Where it is on, there is no **lock** to see.
_Avoid_: hidden private pages, private filter

**Excluded tag**:
A tag in `excludeTags`, left out of the tree with its subtags. Its pages stay under their other tags.
_Avoid_: hidden tag, filtered tag

**Drawer**:
The explorer at or below its `drawerBreakpoint`: a **toggle**, v4's caret fixed at the window's left
edge half way down, opens its **panel** from the left over a backdrop. The panel takes the focus
(its close button), and the page behind the backdrop holds still, as v4's did. The panel's close
button, the backdrop, Escape or following a link close it again, and give the focus back to the
toggle. It replaces v4's MobileSidebarMenu, which slid out the whole left sidebar.
Never inside a **host drawer**.

**Host drawer**:
A drawer of another package's that the explorer is placed in, which declares itself the family's
`cgc-drawer` container, as quartz-annotator's ☰ drawer does. In one, the explorer keeps its tree
at every width and has no drawer of its own (docs/adr/0002).
_Avoid_: nested drawer, parent drawer
_Avoid_: mobile menu, sidebar menu, off-canvas

**Saved state**:
Which tags the reader opened and closed. It is kept across navigations, and in localStorage under
v4's `tagTree` key and in v4's shape (`[{ path, collapsed }]`), unless `useSavedState` is off. How
far the tree is scrolled is kept for the tab, under v4's `tagExplorerScrollTop`.
_Avoid_: collapse state, tree state

## Constraints

- **It reads only what the engine publishes:** the `ancestors` of every page's `fileData.cgcTags`
  for the tree, and each page's own `tags` for its pages. It never reads the engine's options, and
  it needs no `cgcTags.json` in the browser. Whether a tag is under an excluded one, and whether a
  page is private, are tags-core's rules (`underAny`, `privatePageTest`), and the tags its options
  name are normalised as the engine normalises a tag (`normaliseTag`).
- **It draws icons itself,** with `@chaoticgoodcomputing/icons`, from the ids the engine publishes and
  the site's `iconCollections`. Every tag in the tree is drawn on the first page rendered, so an id
  no collection has fails the build, whichever pages show the tag. The lock is `mdi:lock`.
- **Colour and icon repaint on a scheme switch through CSS alone.** The mark's `color` is a `var()`
  of the tag's property, so no script resolves a colour.
- **Nothing a navigation brings in is animated.** Transitions are on only once a page's saved state
  is in place (`--ready`). Quartz's router puts every class back to the new page's, which also closes
  the drawer.
- **The drawer takes no room in the sidebar's row.** Its toggle, panel and backdrop are fixed to the
  window, because on a phone the row the left sidebar becomes is already full with the site's title,
  search and scheme toggle.
- **Links start from the site's root on the 404 page,** which is served at any depth; everywhere else
  they are relative, as Quartz's own are.
- **The drawer's breakpoint is the one media query in the stylesheet.** It is written at core's
  800px, and the plugin rewrites it to `drawerBreakpoint` when it ships the sheet. build.mjs refuses
  any other query, so the rewrite can't miss one.
