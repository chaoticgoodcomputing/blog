---
status: accepted
date: 2026-09-28
---

# In a host drawer, the explorer keeps its tree

At or below its `drawerBreakpoint` the explorer is a drawer of its own: a caret fixed at the
window's left edge, and a panel that slides in over a backdrop. That's right where it sits in a
sidebar, which a narrow screen turns into a row with no room for a tree. But a page can put it
somewhere that is a drawer already: quartz-annotator's ☰ drawer, which holds an annotation page's
`header` and `left` components at every width (its
[ADR-0004](../../../quartz-annotator/docs/adr/0004-the-annotation-page-owns-its-frame.md)). There,
a drawer of its own would be a drawer inside a drawer, and its caret would sit on the page while
the ☰ drawer is closed.

**Decided:** a **host drawer** is an element that declares itself the family's `cgc-drawer`
container (`container: cgc-drawer / inline-size`). Inside one, the explorer keeps its sidebar form,
its title and tree in the flow, at every width, and shows no caret, panel bar or backdrop. The rules
sit in `@container cgc-drawer (min-width: 0px)`, which matches only where such an ancestor exists.

## Why a container query

- **It holds before any script.** A class set by the explorer's script on `nav` left the caret on
  screen for the first few frames of a page, and a reader without JavaScript would keep it.
- **It reaches nothing outside the block.** A selector naming the host (`[data-cgc-drawer]
  .cgc-tag-explorer`) would start above the block, which the repo's ADR-0003 rules out. The query
  names a container; every selector inside it starts at the explorer.
- **The contract is one name**, which any package can declare and any component can honour, without
  either knowing the other.

## Consequences

- The host's `cgc-drawer` is a size container, so its width can't come from its content. A drawer
  has a width of its own anyway.
- The query nests inside the drawer's media query, the stylesheet's one: above the breakpoint the
  explorer is in its sidebar form already.
