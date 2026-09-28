// The arithmetic of the annotation page's layout, apart from the page it lays out: which layout fits
// the page's width, how wide the document is, and where each card goes in the margin. The reader
// (./reader) measures the page and applies what these return. No media query decides any of it
// (docs/adr/0004): the page's width and the zoom do.

/** The page's layouts: the cards alone, the document with a margin, the document with a drawer. */
export type Layout = "static" | "margin" | "drawer"

/** Lengths the layout is worked out from, in CSS pixels. */
export interface Measures {
  /** The page's width. */
  available: number
  /** A card's width: the margin's, and the tablet drawer's. */
  margin: number
  /** The narrowest the document may be at 100% beside the margin. */
  minDocument: number
  /** The root font size, which the gutters and the document's cap are in. */
  rem: number
}

/** What fits: the layout, the document's width, and, for the drawer, whether it's a phone's. */
export interface Fit {
  layout: "margin" | "drawer"
  /** The document's width at this zoom: wider than its column when zoomed past it. */
  documentWidth: number
  /** The drawer covers most of the screen and is modal: a `marginWidth` drawer would cover more than half. */
  mobile: boolean
}

/** The gutter each side of the page, in rem, beside a margin. */
export const GUTTER = 2
/** The gap between the document and the margin, in rem. */
export const GAP = 3
/** The gutter each side of the document where it takes the page's width, in rem. */
export const EDGE = 0.75
/** The widest the document is at 100% beside the margin, in rem. */
export const CAP = 60

/** Everything beside the document and the margin, in pixels. */
export const gutters = (m: Measures) => (2 * GUTTER + GAP) * m.rem

/**
 * What fits the page at `zoom`. 100% is the fitted width: the width the margin leaves the document,
 * up to the cap, where the margin fits beside `minDocument` at 100%, and the page's width otherwise.
 * At zoom `z` the document is `z` times that, and once the zoomed document and the margin no longer
 * fit, the annotations go to the drawer, where the document takes at least the page's width. A
 * hidden margin gives the document the page's width.
 */
export function fit(m: Measures, zoom: number, marginHidden: boolean): Fit {
  const mobile = m.margin > m.available / 2
  const desktop = m.minDocument + m.margin + gutters(m) <= m.available
  if (desktop && !marginHidden) {
    const width = zoom * Math.min(CAP * m.rem, m.available - m.margin - gutters(m))
    if (width + m.margin + gutters(m) <= m.available) return { layout: "margin", documentWidth: width, mobile }
    // Zoomed out of the margin: the drawer's document takes the page's width, or more.
    return { layout: "drawer", documentWidth: Math.max(width, m.available - 2 * EDGE * m.rem), mobile }
  }
  const edge = desktop ? GUTTER : EDGE
  return { layout: desktop ? "margin" : "drawer", documentWidth: zoom * (m.available - 2 * edge * m.rem), mobile }
}

/**
 * Where each card's top goes in the margin, in its order down the page: level with its passage
 * (`desired`), or just below the card above it, so none overlap. The selected card, if any, is
 * level with its passage, and the cards above it move up to make room, as far as the top.
 */
export function stack(desired: number[], heights: number[], selected: number, gap: number): number[] {
  const tops: number[] = []
  const down = (from: number) => {
    for (let i = from; i < desired.length; i++) tops[i] = i === 0 ? Math.max(0, desired[i]) : Math.max(desired[i], tops[i - 1] + heights[i - 1] + gap)
  }
  down(0)
  if (selected < 0 || selected >= desired.length) return tops
  tops[selected] = Math.max(0, desired[selected])
  for (let i = selected - 1; i >= 0; i--) tops[i] = Math.min(tops[i], tops[i + 1] - gap - heights[i])
  // Pushed above the top, the cards stack from the top down, the selected one as near its passage
  // as they let it be.
  if (tops[0] < 0) down(0)
  else for (let i = selected + 1; i < desired.length; i++) tops[i] = Math.max(desired[i], tops[i - 1] + heights[i - 1] + gap)
  return tops
}

/** A `px` or `rem` length in pixels. */
export const toPx = (length: string, rem: number) => (length.endsWith("rem") ? parseFloat(length) * rem : parseFloat(length))
