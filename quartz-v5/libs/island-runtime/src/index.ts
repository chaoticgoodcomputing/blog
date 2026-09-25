// Islands for Quartz plugins: a component rendered to HTML at build time and hydrated in the
// browser. Holds the three parts of the contract a plugin needs to ship one: the marker it renders,
// the entry module the marker names, and the runtime that hydrates markers. See CONTEXT.md.
//
// The runtime is imported as text through an import attribute, which the consuming plugin's
// esbuild honours with no loader configuration of its own.
import runtime from "./runtime.inline.js" with { type: "text" }

/** When an island hydrates: as soon as its page is shown, or once it scrolls into view. */
export type Directive = "load" | "visible"

/** What the runtime needs to hydrate one island. */
export interface Island {
  /** Site-relative path of the island's entry module, e.g. `static/cgc-mdx/GameOfLife-XXXX.js`. */
  entry: string
  /** Site-relative path of a stylesheet the island needs before it hydrates, if any. */
  css?: string
  /** Defaults to `load`. */
  directive?: Directive
  /** The component's props. Plain data, since they are written into the page as JSON. */
  props: Record<string, unknown>
}

/**
 * The attributes that make an element a marker, besides the plugin's own `cgc-` class that the
 * plugin's runtime selects on. Attribute names, so they suit a Preact element and a hast element's
 * `properties` alike. The element's children are the island's build-time HTML.
 */
export function islandAttributes(island: Island): Record<string, string> {
  return {
    "data-cgc-entry": island.entry,
    ...(island.css ? { "data-cgc-css": island.css } : {}),
    "data-cgc-hydrate": island.directive ?? "load",
    "data-cgc-props": JSON.stringify(island.props),
  }
}

/**
 * The source of an island's entry module: the component as `default`, beside the `h`, `hydrate`
 * and `render` of the Preact it resolves, so the runtime drives the component's own Preact and needs
 * no import of its own. `from` is the module exporting the component, `imported` the export's name.
 */
export function islandEntrySource(from: string, imported = "default"): string {
  return `export { ${imported} as default } from ${JSON.stringify(from)}\nexport { h, hydrate, render } from "preact"\n`
}

/**
 * The island runtime for one plugin's markers: a script to ship as a component's `afterDOMLoaded`.
 * `selector` must match that plugin's markers and nothing else, normally its own `cgc-` class, so
 * that several plugins can each ship a runtime on one page without hydrating each other's islands.
 */
export function islandRuntime(selector: string): string {
  // The header comment is for readers of the source, not for every page.
  const fn = runtime.replace(/^(?:\s*\/\/[^\n]*\n)+/, "").trim()
  return `;(${fn})(${JSON.stringify(selector)});\n`
}
