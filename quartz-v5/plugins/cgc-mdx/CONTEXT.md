# cgc-mdx

The Quartz 5 page-type plugin that renders `.mdx` pages. It ships the widget contract and no
widgets of its own. Inherits the family vocabulary in [`quartz-v5/CONTEXT.md`](../../CONTEXT.md).

## Language

**Widget**:
A module an MDX page imports and renders inline, supplied by the vault or an npm package rather
than by any plugin. Resolved like any ES import, and shipped only to the pages that import it.
_Avoid_: component, MDX component, embed, shortcode

**Component**:
Reserved for Quartz's own layout plugin type (explorer, TOC, the MDX body itself). A widget is
never a Component, even though both are Preact.
_Avoid_: using it for anything an MDX page imports
