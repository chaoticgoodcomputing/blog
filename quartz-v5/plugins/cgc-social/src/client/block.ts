// This package's BEM block, `.cgc-social`, built as DOM nodes: the cards are drawn with these, never
// with markup, so what an account says stays text.

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

/** The message of whatever a fetch rejected with. */
export const reasonOf = (error: unknown) => (error instanceof Error ? error.message : String(error))
