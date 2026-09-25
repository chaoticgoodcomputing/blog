// cgc-social: sidebar cards for a GitHub user's year of contributions and a Bluesky account's latest
// posts (v4's SocialMediaGitHub and SocialMediaBlueSky, #42, #44, #80). The component is in
// ./components; this is the plugin's transformer half, which exists to ship the stylesheet.
//
// ADR-0003 rule 11: a package's own CSS goes in its family layer, `@layer cgc.social`, emitted from
// externalResources(). A component's `css` would land in core's `quartz-base` layer. The stylesheet
// holds the post card's rules too, from the Bluesky renderer the cards' script inlines, and the
// calendar's colours when the site sets them.
import type { QuartzTransformerPlugin } from "@quartz-community/types"
import { stylesheet } from "cgc-social:client"
import { resolveOptions, type SocialMediaOptions } from "./options"

export type { SocialMediaOptions, GitHubCardOptions, BlueskyCardOptions } from "./options"

const SocialMediaStyles: QuartzTransformerPlugin<Partial<SocialMediaOptions>> = (opts) => {
  const { github } = resolveOptions(opts)
  // Checked colour values (options.ts), one custom property per level, after the defaults they replace.
  const levels = github?.levelColors
    ? `@layer cgc.social {\n  .cgc-social {\n${github.levelColors
        .map((value, level) => `    --cgc-social-level-${level}: ${value};\n`)
        .join("")}  }\n}\n`
    : ""
  return {
    name: "cgc-social",
    // A transformer with no hook at all is skipped by the loader, stylesheet and all (ADR-0003).
    htmlPlugins: () => [],
    externalResources: () => ({ css: [{ content: stylesheet + levels, inline: true }] }),
  }
}

export default SocialMediaStyles
