# site-styles

The site plugin that carries this site's application CSS: the **stack declaration** first, then
v4's ITCSS stack under the `site` layer, compiled from Sass in the plugin's own build and emitted
from `externalResources()` at `defaultOrder: -1000`. Inherits the family vocabulary in
[`quartz-v5/CONTEXT.md`](../../CONTEXT.md). The decision is ADR-0003's *site plugin* amendment
([#39](https://github.com/chaoticgoodcomputing/blog/issues/39)); the port is
[#64](https://github.com/chaoticgoodcomputing/blog/issues/64). No fixture config loads it, so its
specs build scratch sites that do.

## Language

**Tier**:
One of v4's five ITCSS layers inside `site`, lowest first: `generic`, `elements`, `objects`,
`components`, `utilities`. Each is a sublayer of `site`, written nested in `site.scss`, and every one
is kept even when the port leaves it empty.
_Avoid_: level, layer (for a tier, in prose), section

**Settings** and **tools**:
The Sass partials the tiers draw on: values (the breakpoints, the measure, the grids) and mixins
(`respond-to`, `grid`). They emit no CSS, so they are not tiers.
_Avoid_: variables tier, tools tier

**Site breakpoints**:
1000px and 1300px, the site's own (#22), in place of core's 800px and 1200px. The site grid, the
sidebars and the `mobile-only`/`desktop-only` switch follow them. Stock plugins' own CSS keeps
core's, an accepted cosmetic band between 800px and 1000px.
_Avoid_: mobile/desktop widths, media sizes

**Measure**:
The 40em (about 70-character) width of the centre column's blocks, and of the page footer.
_Avoid_: content width, column width

**Section heading**:
A component's own heading, an `h3` directly inside its root, in a sidebar or the page header. The
section sets its size and spacing, not the component. A heading deeper in a component (the table
of contents' toggle, a search result) is the component's own.
_Avoid_: component title, widget header

## How the port works

- **Only what differs from core.** Most of v4's tier content was core's `base.scss` moved into a
  layer. Those rules are not ported, and what is left is the site's own: the grid at the site
  breakpoints, the page width, the sidebars' spacing, the measure, centred images, and the skin v4
  forked into stock components' stylesheets (FORK-LEDGER rows for `styles/*` and
  `components/styles/*`).
- **The grid is the default frame's.** The objects tier's grid selects
  `.page[data-frame="default"]`, so core's full-width and minimal frames, and any frame a plugin
  registers, keep their own layout. v4's `full-width` layout variant is a frame now (FORK-LEDGER
  `styles/_objects.scss`).
- **The site outranks the family.** A rule in any tier beats every `cgc.*` rule, whatever its
  specificity. So a bare-element rule here, like `img`, restyles images inside family plugins too.
- **The stack names only what the config loads.** A theme enabled in the site config adds its
  layers to the declaration in `site.scss`. `e2e/stack.spec.mjs` checks the declaration on a
  fixture-based scratch site, and `tests/specs/site-config.spec.mjs` checks it against the site
  config.
- **lightningcss rewrites the declaration** when core serves the sheet: it folds
  `@layer …, site; @layer site {…}` into `@layer …;@layer site{…}`, and an empty tier into a bare
  statement. The order is unchanged, so the specs read the order back from the CSSOM, never the
  text.
