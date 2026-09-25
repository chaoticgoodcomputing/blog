// A card's status in place of what it shows: why there is nothing to show, as v4 said it. The page
// as built carries the loading state (components/SocialMedia.tsx).

/** An element of this package's block, `cgc-social__<element>`, holding `text` if given. */
export function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  name: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag)
  el.className = name
    .split(" ")
    .map((part) => `cgc-social__${part}`)
    .join(" ")
  if (text !== undefined) el.textContent = text
  return el
}

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

/** The message of whatever a fetch rejected with. */
export const reasonOf = (error: unknown) => (error instanceof Error ? error.message : String(error))
