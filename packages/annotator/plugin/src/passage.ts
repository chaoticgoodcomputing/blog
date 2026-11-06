// The address of a passage of a web page: the page's, with a text fragment for the passage, which a
// browser that has them scrolls to and marks (https://wicg.github.io/scroll-to-text-fragment/). The
// site makes the same one (@chaoticgoodcomputing/obsidian-markdown's passageAddress).

/** A passage as its quote names it: the text, and the words either side that tell one quote of it from another. */
export interface Passage {
  exact?: string
  prefix?: string
  suffix?: string
}

/** A long passage is named by its first and last words; the words either side of it say which it is. */
export function passageAddress(page: string, { exact, prefix, suffix }: Passage): string {
  const words = (text: string | undefined) => (text ?? "").trim().split(/\s+/).filter(Boolean)
  // A text fragment's own delimiters, `-`, `,` and `&`, are written percent-encoded.
  const encode = (list: string[]) => encodeURIComponent(list.join(" ")).replace(/-/g, "%2D")
  const quote = words(exact)
  if (quote.length === 0) return page
  const text = quote.length > 10 ? `${encode(quote.slice(0, 5))},${encode(quote.slice(-5))}` : encode(quote)
  const before = words(prefix).slice(-3)
  const after = words(suffix).slice(0, 3)
  const parts = [before.length ? `${encode(before)}-` : "", text, after.length ? `-${encode(after)}` : ""].filter(Boolean)
  return `${page.replace(/#.*$/, "")}#:~:text=${parts.join(",")}`
}
