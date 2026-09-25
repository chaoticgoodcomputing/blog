// site-styles: this site's application CSS (ADR-0003's site-plugin amendment, #39).
//
// A CSS-only transformer. Everything it does is `externalResources()`: one stylesheet that opens
// with the stack declaration and then carries the site's five ITCSS tiers under the `site` layer.
// It runs at `defaultOrder: -1000`, so that sheet is the first named-layer statement on the page
// after core's `index.css`, which is what fixes every layer's rank. `e2e/stack.spec.mjs` guards it.
import siteCss from "./styles/site.scss"

export default function SiteStyles() {
  return {
    name: "SiteStyles",
    // The loader skips a transformer with no hook at all, so this one has a no-op.
    textTransform(_ctx: unknown, src: string) {
      return src
    },
    externalResources() {
      return { css: [{ content: siteCss, inline: true }], js: [], additionalHead: [] }
    },
  }
}
