# site-styles

The site plugin that carries this site's application CSS: the **stack declaration** first, then
v4's ITCSS stack under the `site` layer, compiled from Sass in the plugin's own build and emitted
from `externalResources()` at `defaultOrder: -1000`. It also ships the **site fonts**, and so is an
emitter as well as a transformer. Inherits the family vocabulary in
[`quartz/CONTEXT.md`](../../CONTEXT.md). The decision is ADR-0003's *site plugin* amendment
([#39](https://github.com/chaoticgoodcomputing/blog/issues/39)); the port is
[#64](https://github.com/chaoticgoodcomputing/blog/issues/64). No fixture config loads it, so its
specs build scratch sites that do. The fonts are ADR-0003's amendment "the site self-hosts its fonts", from the
owner's review notes of 2026-09-26 ([#84](https://github.com/chaoticgoodcomputing/blog/issues/84)).

## Language

**Site fonts**:
Inter and IBM Plex Mono, v4's typography, as files the site serves itself from
`static/site-styles/fonts/`. Inter is its variable font, 400 to 700, upright and italic; IBM Plex
Mono comes at 400, 600 and 700, upright. Every subset Google Fonts serves, as woff2.
_Avoid_: web fonts, Google Fonts (for the files the site serves), core's fonts

**Font face**:
One file of the site fonts: a family, a style, a weight range and a Unicode subset, declared by one
`@font-face`. Named for all four, e.g. `inter-italic-400-700-latin.woff2`.
_Avoid_: font file (for the declaration), variant

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
- **The site's own components are styled here.** site-components' page title and footer (#70)
  ship no CSS of their own. Their v4 rules are in the components tier, on v4's class names
  (`.page-title…`, `.site-footer`).
- **The grid is the default frame's.** The objects tier's grid selects
  `.page[data-frame="default"]` (FORK-LEDGER `styles/_objects.scss`). Core's full-width and minimal
  frames keep core's layout, and a frame a plugin registers lays out its own, as quartz-annotator's
  `cgc-annotation` does.
- **The site outranks the family.** A rule in any tier beats every `cgc.*` rule, whatever its
  specificity. So a bare-element rule here, like `img`, restyles images inside family plugins too.
- **The stack names only what the config loads.** A theme enabled in the site config adds its
  layers to the declaration in `site.scss`. `e2e/stack.spec.mjs` checks the declaration on a
  fixture-based scratch site, and `tests/specs/site-config.spec.mjs` checks it against the site
  config.
- **The fonts are fetched at the plugin's build, never later.** `build.mjs` asks Google Fonts' CSS
  API for the site fonts, as a current Chrome does so it answers with woff2, downloads every face into
  `dist/fonts/`, and writes what each declares into `dist/index.js`. It keeps them in
  `node_modules/.cache/site-styles-fonts/`, by the request's URL, so a rebuild needs no network:
  delete the cache to refetch. A fetch that fails fails the build. The site config's
  `theme.fontOrigin` is `local`, so core fetches none of its own; core's would sit at absolute
  production URLs, which 404 on any other host.
- **The faces are declared at root-relative URLs**, one `@font-face` each, in the `generic` tier,
  appended to the one stylesheet the transformer emits. Each URL starts with the site's base path, the
  path of `baseUrl`, as core computes it for `data-basepath`, and with nothing under `serve`. So the
  site works on any host, and at the base path it was built for.
- **Two factories, `transformer` and `emitter`.** A plugin in two categories is instantiated once for
  each, so one factory would emit the stylesheet twice; the loader picks each by its shape. The
  emitter copies `dist/fonts/` to `static/site-styles/fonts/`, which nothing else writes, so it never
  races the stock Static emitter that runs beside it. On a `serve` rebuild it emits nothing, since
  output isn't cleaned between rebuilds.
- **`e2e/fonts.spec.mjs` serves the site away from its `baseUrl`**, at its root and under a base
  path, and asks the browser which face it drew each kind of text in. The site-config spec serves at
  the `baseUrl` itself, where core's absolute URLs happened to work.
- **lightningcss rewrites the declaration** when core serves the sheet: it folds
  `@layer …, site; @layer site {…}` into `@layer …;@layer site{…}`, and an empty tier into a bare
  statement. The order is unchanged, so the specs read the order back from the CSSOM, never the
  text. A cross-origin stylesheet's rules are closed to the CSSOM, so `e2e/stack.spec.mjs` fails on
  any the page links unless its source has been checked by hand and listed as declaring no layer.
