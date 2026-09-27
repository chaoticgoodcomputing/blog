// quartz-page-source: a link from each page to its source file in the site's repository (v4's
// ShowPageSource). The component is in ./components; this is the plugin's transformer half, which
// exists to ship the component's stylesheet.
//
// ADR-0003 rule 11: a package's own CSS goes in its family layer, `@layer cgc.page-source`, emitted
// from externalResources(). A component's `css` would land in core's `quartz-base` layer instead.
import type { QuartzTransformerPlugin } from "@quartz-community/types"
import style from "./style.css"

export type { PageSourceOptions } from "./components/PageSource"

const PageSourceStyles: QuartzTransformerPlugin = () => ({
  name: "cgc-page-source",
  // A transformer with no hook at all is skipped by the loader, stylesheet and all (ADR-0003).
  htmlPlugins: () => [],
  externalResources: () => ({ css: [{ content: style, inline: true }] }),
})

export default PageSourceStyles
