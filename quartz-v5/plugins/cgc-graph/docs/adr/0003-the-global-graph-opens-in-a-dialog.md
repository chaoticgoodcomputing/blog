---
status: accepted
date: 2026-09-25
---

# The global graph opens in a dialog

v4's global graph was a fixed-position overlay, which its script moved to the end of `<body>` on
every navigation, so that no sidebar's stacking context could trap it under the page
([lifecycle.ts:36-42](https://github.com/chaoticgoodcomputing/blog/blob/9e48f89b256f511a94f07d473d46395d91730c53/quartz/components/scripts/graph/adapters/lifecycle.ts#L36-L42)). Under v5,
Quartz's router morphs `<body>` into the next page's on every navigation, so an element the script
had moved out of place would be morphed away or duplicated. Stock v5's graph instead raises its
sidebar's `z-index`, an inline style on an element it doesn't own (ADR-0003 rule 2), and clears it
again when the graph closes
([graph.inline.ts:677-680](https://github.com/quartz-community/graph/blob/e647019c05ab2a3279c9cddd7bc2f18acb9858b8/src/components/scripts/graph.inline.ts#L677-L680)
and [655-658](https://github.com/quartz-community/graph/blob/e647019c05ab2a3279c9cddd7bc2f18acb9858b8/src/components/scripts/graph.inline.ts#L655-L658),
at v1.0.0, the version the vendored copy installs). Decided on
[`cgc-graph`: the graph, with its own content index](https://github.com/chaoticgoodcomputing/blog/issues/74).

## Decision

The global graph is a `<dialog>` in the component's own markup, opened with `showModal()`. A modal
dialog is raised into the page's top layer, above every stacking context, without moving in the
DOM. The browser dims the rest of the page, makes it inert, and closes the dialog on Escape. The
plugin closes it on a click on its backdrop, on Ctrl/⌘+G, and before a navigation (`prenav`), and
removes the global graph whenever it closes. Its backdrop is styled through `::backdrop`, in the
theme's `--light` at 70%, blurred: v4's dark overlay in the dark scheme, a light one in the light.

## Consequences

- **The markup never moves,** so the router's morph always finds the page as the server rendered it.
- **Focus and Escape are the browser's.** Nothing of v4's escape-handler plumbing is needed.
- **`::backdrop` reads the theme's properties only in browsers where it inherits them** (Chrome 122,
  Safari 17.4, Firefox 120, and later). Before those, the backdrop is only blurred.
