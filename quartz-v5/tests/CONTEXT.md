# Plugin e2e suite

The end-to-end suite every `cgc-*` plugin is developed against: a small fixture vault, built into a
real Quartz site and driven by a browser. Inherits the family glossary in
[`quartz-v5/CONTEXT.md`](../CONTEXT.md); the decision is [ADR-0004](../../docs/adr/0004-playwright-e2e-as-the-plugin-tdd-loop.md).

## Language

**Content fixture**:
The vault at `content-fixture/` that the suite builds. Small on purpose, and grown one page at a time
as a plugin needs a case.
_Avoid_: test vault, sample content, fixture vault

**Fixture site**:
The Quartz site built from the content fixture with our plugins enabled.
_Avoid_: test site, fixture build

**Baseline**:
The same fixture site with every one of our plugins disabled. What the no-bleed check compares against.
_Avoid_: control, vanilla site, stock site

**Fixture root**:
The directory a fixture site is built from — the vendored copy symlinked in, with the suite's own
config beside it. One per variant.
_Avoid_: shadow root (collides with the DOM's), sandbox, workspace

**Owned element**:
An element one of our plugins rendered, recognised by a `cgc-` class on it or an ancestor.
_Avoid_: plugin element, our DOM

**Bleed**:
A computed style on an element no plugin owns that differs between the fixture site and the baseline.
The rendered-page form of breaking ADR-0003's rule 2.
_Avoid_: leak, collision, style pollution

**Harness**:
The shared `test` and `expect`, with their fixtures, that every spec imports from `harness/test.mjs`.
_Avoid_: test utils, helpers
