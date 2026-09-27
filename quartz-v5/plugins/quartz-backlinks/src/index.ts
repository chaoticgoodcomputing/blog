// cgc-backlinks: the pages that link to a page, public ones first, each private one marked with a
// lock or, with `excludePrivate`, left out (v4's Backlinks fork, #44, #78, #85). It reads only what
// stock Quartz leaves on every page, and takes the private tags as its own option, so it needs no
// tag engine. The component is in ./components; this is the plugin's transformer half, which
// exists to ship the component's stylesheet.
//
// ADR-0003 rule 11: a package's own CSS goes in its family layer, `@layer cgc.backlinks`, emitted
// from externalResources(). A component's `css` would land in core's `quartz-base` layer instead.
import type { QuartzTransformerPlugin } from "@quartz-community/types"
import style from "./style.css"

export type { BacklinksOptions } from "./components/Backlinks"

const BacklinksStyles: QuartzTransformerPlugin = () => ({
  name: "cgc-backlinks",
  // A transformer with no hook at all is skipped by the loader, stylesheet and all (ADR-0003).
  htmlPlugins: () => [],
  externalResources: () => ({ css: [{ content: style, inline: true }] }),
})

export default BacklinksStyles
