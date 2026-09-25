// cgc-tag-list: a page's tags as badges, each ringed in its tag's colour (v4's TagList, #69). A
// consumer of the cgc-tags engine: it reads the tags the engine publishes on each page's `fileData`,
// and paints with the engine's `--cgc-tag-*` properties. The component is in ./components; this is
// the plugin's transformer half, which exists to ship the component's stylesheet.
//
// ADR-0003 rule 11: a package's own CSS goes in its family layer, `@layer cgc.tag-list`, emitted
// from externalResources(). A component's `css` would land in core's `quartz-base` layer instead.
import type { QuartzTransformerPlugin } from "@quartz-community/types"
import style from "./style.css"

export type { TagListOptions } from "./components/TagList"

const TagListStyles: QuartzTransformerPlugin = () => ({
  name: "cgc-tag-list",
  // A transformer with no hook at all is skipped by the loader, stylesheet and all (ADR-0003).
  htmlPlugins: () => [],
  externalResources: () => ({ css: [{ content: style, inline: true }] }),
})

export default TagListStyles
