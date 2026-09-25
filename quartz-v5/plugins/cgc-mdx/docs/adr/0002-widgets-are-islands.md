---
status: accepted
date: 2026-09-24
---

# Widgets are islands

A widget is a Preact component. `cgc-mdx` renders it to HTML at build time and then **always**
hydrates it in the browser. Astro's directive names control _when_ hydration happens: the default
is `client:load`, and `client:visible` defers hydration until the widget scrolls into view. There
is no static-only mode. Props must be serializable because they are written into the HTML for
hydration. The `cgc-mdx` client runtime owns the lifecycle across Quartz's SPA navigation.

## Why

**The prior art is Astro's islands.** In
[Astro's model](https://docs.astro.build/en/concepts/islands/), a component renders to HTML at
build time and ships JavaScript only when it needs to be interactive, and only on the pages that
use it. We keep Astro's vocabulary
([client directives](https://docs.astro.build/en/reference/directives-reference/#client-directives))
so the syntax is already familiar. We drop Astro's default of static rendering: every widget we
have draws on the client (a canvas, a plotly chart, a grid), so a static render would publish an
empty box. We found no use case that would make the static mode worth supporting.

**We chose the rewrite now, not later.** The alternative was v4's shape: a build-time component
plus a separate imperative script that finds its element by selector. That would have let the
existing widgets port almost unchanged. We still chose islands. A widget becomes plain Preact on
both sides, with no Quartz-specific second file. Changing the contract now costs three widget
rewrites. Changing it later would break widgets we cannot see, once other sites depend on
`cgc-mdx`.

## Consequences

- **Serializable props, written as JS literals.** Live pages already pass only data. They use
  object and array literals with unquoted keys and comments. A prop that is not data, such as a
  function or a component, fails the build.
- **Widget authors write plain Preact.** They clean up in `useEffect`'s return function, never
  touch Quartz's navigation events, and do no per-page work at a module's top level: a chunk runs
  once per document, not once per page.
- **The runtime is one global `afterDOMLoaded` script, and it owns the lifecycle.** The hooks
  come from
  [Does v5's SPA router differ from v4's, and does it hole the plan?](https://github.com/chaoticgoodcomputing/blog/issues/34):
  - On `prenav`, it unmounts every mounted island (`render(null, el)`). This runs cleanups in the
    same task as the morph.
  - On `nav`, it scans for unmounted island markers, skipping popovers, then `import()`s each
    entry from an absolute path built on the site's basepath and hydrates it. `client:visible`
    goes through an `IntersectionObserver`. The runtime drops any hydration that a newer
    navigation has overtaken.
  - On `render`, the v5 event for in-place DOM updates, it runs the same scan. The scan must be
    safe to run twice.

  The runtime cannot use static `import`s itself, because `serve` wraps `afterDOMLoaded` scripts
  in a function. Per-page `<script>` tags are never used, because v5's DOM morph can swap one
  page's script for another's without running it.
- **Styling is imported plain CSS that follows ADR-0003.** A widget `import`s its `.css`, the way
  any bundler expects. It follows the library-CSS rules in
  [ADR-0003](../../../../../docs/adr/0003-library-css-in-plugins-application-css-at-the-site.md):
  BEM naming, and skin taken only from custom properties. The widget library enforces these rules.
  Widgets in a vault are advised to follow them. `cgc-mdx` does not compile SCSS, so it never
  forces sass on its users.
- **The Preact runtime rides in a shared chunk**, bundled with the per-widget chunks described in
  [ADR-0001](./0001-widgets-are-real-imports-the-body-stays-quartzs.md), so a page with several
  islands loads it once.

## Amendment, 2026-09-24: proven on game-of-life

Proven with the `game-of-life` port on
[Prove the widget contract with `game-of-life`](https://github.com/chaoticgoodcomputing/blog/issues/35).
Specs cover hydration, unmounting on navigation (the widget's timer stops), rehydrating exactly
once on the way back, `client:visible`, and islands inside a popover staying static. The
lifecycle below survived unchanged. What the implementation fixed:

- **The marker.** Each island is a `<div>` (a `<span>` when inline) with class
  `cgc-mdx-island`, holding the build-time HTML. It carries `data-cgc-entry`, `data-cgc-css`,
  `data-cgc-hydrate` (`load` or `visible`) and `data-cgc-props` (JSON). The runtime marks it
  `data-cgc-hydrated` once mounted. The `cgc-` class makes everything inside an owned element
  for the no-bleed spec.
- **The entry re-exports Preact.** Each browser entry exports the widget as `default` next to
  Preact's `h`, `hydrate` and `render`, so the runtime drives the same Preact the widget
  imports, and it needs no static import of its own.
- **Widget CSS is in the served head.** On a hard load it arrives as a persisted `<link>` through
  the emitter's `additionalHead` ([Head.tsx:100-106](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/components/Head.tsx#L100-L106),
  which emitters may feed: [plugins/index.ts:11](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/index.ts#L11)). So the
  build-time markup is styled on first paint. A page reached by SPA navigation never gets a new
  head link, so there the runtime adds a persisted `<link>` and waits for it before hydrating.
- **Widget CSS lands in the widget layer.** _Closed by the amendment below;_ this bullet originally
  recorded widget CSS as unlayered and open.

## Amendment, 2026-09-25: the widget layer

_From [Which cascade layer does widget CSS land in?](https://github.com/chaoticgoodcomputing/blog/issues/45)._

Unlayered widget CSS outranked every layer on the page, the site's included, so a widget beat the
site that embeds it. `cgc-mdx` now wraps each widget's CSS bundle in `@layer cgc.mdx.widgets {…}`
as it emits it.

- **All widget CSS is library CSS, whatever its source.** The widget library, a stranger's npm
  package and a vault's own widgets are treated alike, and `cgc-mdx` never asks where an import
  came from. So widget CSS ranks with the family: above core and themes, below the site. A site
  that wants a vault widget to look different overrides it from its own layer.
- **A sublayer of the package's layer, not the package's layer itself.** `cgc-mdx`'s own CSS, if
  it ever has any, stays apart from CSS it only hosts, and a site can still rank the two
  separately. No stack declaration needs an edit, because the `cgc` entry already ranks
  everything under it.
- **Nothing a widget ships escapes the wrapper.** A widget's own `@layer foo` nests to
  `cgc.mdx.widgets.foo`. A remote `@import`, which esbuild leaves in place and which can't sit
  inside a block, is hoisted ahead of the wrapper as `@import url(…) layer(cgc.mdx.widgets);`.
- **Rule 9 of ADR-0003 does not reach widgets.** A `<link>` can never get inside `quartz-base`, so
  a widget has no vendor-layer escape hatch. A widget namespaces any third-party CSS it ships.
- **No `cgc-styles` dependency.** See [ADR-0003](./0003-no-opinionated-dependencies.md).
