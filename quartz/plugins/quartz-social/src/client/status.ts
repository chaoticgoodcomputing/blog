// A card's status in place of what it shows: why there is nothing to show, as v4 said it. The page
// as built carries the loading state (components/SocialMedia.tsx).
import { element } from "./block"

/** Nothing to show, and not for a failure: "No posts found". */
export function empty(message: string): HTMLElement {
  const status = element("div", "status status--empty")
  status.append(element("p", "message", message))
  return status
}

/** A failure: what failed, then why. */
export function failed(message: string, details: string): HTMLElement {
  const status = element("div", "status status--failed")
  status.append(element("p", "message message--failed", message), element("p", "details", details))
  return status
}
