// cgc-styles: the engine that owns the family layer's position (ADR-0003's family-layer amendment,
// #30). Its published artifact is the family position, and all it emits is the statement that fixes
// it: `@layer cgc;`, with no rules.
//
// A layer ranks by the first place its name appears among its siblings. Core's `index.css` comes
// first on every page, so `cgc` always ranks above `quartz-base`. Every plugin's
// `externalResources()` stylesheet follows in plugin order, so this plugin's `order` decides where
// `cgc` sits among other plugins' layers. It is 15, above any theme's (`@quartz-themes/core` is 10)
// and as low as it can be, because a consumer may not be ordered before its engine and for a
// transformer that order is also its place in the pipeline (docs/adr/0001).
//
// Consumers, the `cgc-*` packages that emit CSS from `externalResources()`, write into their own
// sublayer, `@layer cgc.<package> {…}`, and list this plugin as `dependencies: ["cgc-styles"]` so
// the loader refuses to build them in front of it.
import type { QuartzTransformerPlugin } from "@quartz-community/types"

const CgcStyles: QuartzTransformerPlugin = () => ({
  name: "CgcStyles",
  // CSS only. The loader skips a transformer with no hook, and warns rather than fails, so it needs
  // a no-op one.
  htmlPlugins: () => [],
  externalResources: () => ({ css: [{ content: "@layer cgc;", inline: true }] }),
})

export default CgcStyles
