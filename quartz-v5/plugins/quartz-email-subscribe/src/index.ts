// cgc-email-subscribe: a newsletter subscribe box that posts to Buttondown (v4's EmailSubscribe).
// The component is in ./components; this is the plugin's transformer half, which exists to ship the
// component's stylesheet.
//
// ADR-0003 rule 11: a package's own CSS goes in its family layer, `@layer cgc.email-subscribe`,
// emitted from externalResources(). A component's `css` would land in core's `quartz-base` layer.
import type { QuartzTransformerPlugin } from "@quartz-community/types"
import style from "./style.css"

export type { EmailSubscribeOptions } from "./components/EmailSubscribe"

const EmailSubscribeStyles: QuartzTransformerPlugin = () => ({
  name: "cgc-email-subscribe",
  // A transformer with no hook at all is skipped by the loader, stylesheet and all (ADR-0003).
  htmlPlugins: () => [],
  externalResources: () => ({ css: [{ content: style, inline: true }] }),
})

export default EmailSubscribeStyles
