import { SharedLayout } from "../cfg"
import * as Component from "../components"

/**
 * Shared components that appear across all page types.
 * This includes the head, header, footer, and afterBody sections.
 */
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [],
  footer: Component.Footer({
    links: {
      "Contact": "https://blog.chaoticgood.computer/contact",
      "GitHub": "https://github.com/spelkington",
      "LinkedIn": "https://www.linkedin.com/in/spelkington",
      "Privacy Policy": "https://chaoticgood.computer/privacy",
      "AI Policy": "https://chaoticgood.computer/ai-policy",
    },
  }),
}
