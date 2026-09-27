# @chaoticgoodcomputing/island-runtime

A library for shipping Preact islands from a Quartz 5 plugin. A Preact component renders to HTML at
build time and hydrates in the browser, and it survives Quartz's SPA navigation. `quartz-mdx` uses it
for widgets, and `quartz-annotator` for its Viewer. It ships as TypeScript source, and a consuming
plugin's build inlines it (ADR-0005). Inherits the family vocabulary in
[`quartz/CONTEXT.md`](../../CONTEXT.md). The lifecycle was decided in `quartz-mdx`'s
[ADR-0002](../../plugins/quartz-mdx/docs/adr/0002-widgets-are-islands.md), before this library was
extracted from it.

## Language

**Island**:
One Preact component on one page: its build-time HTML inside a marker, which an island runtime
hydrates in the browser.
_Avoid_: widget instance, mount point, embed

**Marker**:
The element that holds an island. It carries the plugin's own `cgc-` class, which is what that
plugin's runtime selects, plus the `data-cgc-*` attributes naming the island's entry, stylesheet,
directive and props (`islandAttributes()`). Its children are the build-time HTML.
_Avoid_: placeholder, container, root

**Entry**:
The browser module a marker names. It exports the component as `default`, beside the `h`,
`hydrate` and `render` of the Preact the component imports, so the runtime drives that same Preact
and needs no import of its own (`islandEntrySource()`).
_Avoid_: chunk (an entry may load chunks), bundle, script

**Island runtime**:
The script a plugin ships as a Quartz Component's `afterDOMLoaded` (`islandRuntime(selector)`). It
hydrates its plugin's markers on `nav` and `render`, unmounts them on `prenav`, and drops any
hydration a newer navigation has overtaken. Each plugin ships its own, and each touches only the
markers its selector matches, so two plugins' islands share a page without either hydrating the
other's. An island's own Preact component never listens to Quartz's navigation events.
_Avoid_: loader, hydrator, widget script

**Directive**:
When an island hydrates: `load` (the default), as soon as its page is shown, or `visible`, once it
scrolls into view. Islands inside a popover never hydrate. `quartz-mdx` spells it `client:load` or
`client:visible` on a widget's element.
_Avoid_: hydration mode, strategy

## Constraints

- **The runtime is plain browser script with no static imports.** `serve` wraps `afterDOMLoaded`
  scripts in a function, so it can't be a module.
- **It is imported as text through an import attribute** (`with { type: "text" }`), which esbuild
  honours, so a consuming plugin's build needs no loader configuration for it.
- **Props are data.** They are written into the marker as JSON.
