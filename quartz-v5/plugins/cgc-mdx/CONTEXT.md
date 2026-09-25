# cgc-mdx

The Quartz 5 page-type plugin that renders `.mdx` pages. It ships the widget contract and no
widgets of its own. Inherits the family vocabulary in [`quartz-v5/CONTEXT.md`](../../CONTEXT.md).
A page's body runs through the site's configured pipeline, rebuilt by
[`@chaoticgoodcomputing/pipeline`](../../libs/pipeline/CONTEXT.md), and its widgets are islands
of [`@chaoticgoodcomputing/island-runtime`](../../libs/island-runtime/CONTEXT.md). Both libraries
are inlined into this plugin's build.

## Language

**Widget**:
A module an MDX page imports and renders inline, supplied by the vault or an npm package rather
than by any plugin. Resolved like any ES import, and shipped only to the pages that import it.
_Avoid_: component, MDX component, embed, shortcode

**Component**:
Reserved for Quartz's own layout plugin type (explorer, TOC, the MDX body itself). A widget is
never a Component, even though both are Preact.
_Avoid_: using it for anything an MDX page imports

**Island**:
One use of a widget on a page: its build-time HTML inside a `cgc-mdx-island` marker, which the
island runtime hydrates in the browser. An island in `island-runtime`'s sense.
_Avoid_: widget instance, mount point, embed

**Island runtime**:
This plugin's copy of `island-runtime`'s script, shipped as the body's `afterDOMLoaded`. It hydrates
`cgc-mdx-island` markers on `nav` and `render`, unmounts them on `prenav`, and leaves every other
plugin's markers alone. Widgets never touch Quartz's navigation events themselves.
_Avoid_: widget script, loader, hydrator

**Widget layer**:
`cgc.mdx.widgets`, the cascade layer every widget's CSS lands in, whatever the widget's source.
A sublayer of this package's family layer, so it ranks above core and themes and below the site.
_Avoid_: widget CSS layer, island layer

**Directive**:
The `client:load` (default) or `client:visible` attribute on a widget's element, saying when its
island hydrates. Borrowed from Astro, and never passed to the widget as a prop.
_Avoid_: hydration mode, strategy
