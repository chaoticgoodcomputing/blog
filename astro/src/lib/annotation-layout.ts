// The arithmetic of an annotation page's layout, apart from the page it lays out: which layout fits
// the annotation viewer's width, how wide the document is at a zoom, and where each card goes in the
// margin. The viewer (src/components/annotation-viewer) measures the page and applies what these
// return. Ported from the Quartz annotator's `src/viewer/layout.ts` (docs/cutover/annotations-audit.md),
// less the gutters either side of the page, which the site shell's column already has.

/**
 * The viewer's layouts: the cards alone, as the page is built (`static`); the document with the
 * cards in its margin; the document with the cards in a drawer.
 */
export type Layout = "static" | "margin" | "drawer"

/** Lengths the layout is worked out from, in CSS pixels. */
export interface Measures {
  /** The viewer's width: the site shell's content column. */
  available: number
  /** A card's width: the margin's, and a tablet's drawer's. */
  margin: number
  /** The narrowest the document may be at 100% beside the margin. */
  minDocument: number
  /** The root font size, which the gap and the document's cap are in. */
  rem: number
}

/** What fits: the layout, the document's width, and, for the drawer, whether it is a phone's. */
export interface Fit {
  layout: "margin" | "drawer"
  /** The document's width at this zoom: wider than the column when zoomed past it. */
  documentWidth: number
  /** The drawer covers most of the screen, and is modal: one a card wide would cover more than half. */
  mobile: boolean
}

/** A card's width: the margin's, and a tablet's drawer's. The Quartz annotator's `marginWidth`. */
export const MARGIN_WIDTH = "20rem"
/** The narrowest the document may be at 100% beside the margin. The Quartz annotator's `minDocumentWidth`. */
export const MIN_DOCUMENT_WIDTH = "36rem"

/** The gap between the document and the margin, in rem. */
export const GAP = 3
/** The widest the document is at 100% beside the margin, in rem. */
export const CAP = 60

/**
 * What fits the viewer at `zoom`. 100% is the fitted width: what the margin leaves the document, up
 * to the cap, where the margin fits beside `minDocument`, and the column's width otherwise. At zoom
 * `z` the document is `z` times that, and once the zoomed document and the margin no longer fit
 * side by side, the cards go to the drawer, where the document takes at least the column. A hidden
 * margin gives the document the column.
 */
export function fit(m: Measures, zoom: number, marginHidden: boolean): Fit {
  const mobile = m.margin > m.available / 2
  const gap = GAP * m.rem
  const desktop = m.minDocument + m.margin + gap <= m.available
  if (desktop && !marginHidden) {
    const width = zoom * Math.min(CAP * m.rem, m.available - m.margin - gap)
    if (width + m.margin + gap <= m.available) return { layout: "margin", documentWidth: width, mobile }
    // Zoomed out of the margin: the drawer's document takes the column, or more.
    return { layout: "drawer", documentWidth: Math.max(width, m.available), mobile }
  }
  return { layout: desktop ? "margin" : "drawer", documentWidth: zoom * m.available, mobile }
}

/**
 * Where each card's top goes in the margin, in its order down the page: level with its passage
 * (`desired`), or just below the card above it, so none overlap. The selected card, if any, is
 * level with its passage, and the cards above it move up to make room, as far as the top.
 */
export function stack(desired: number[], heights: number[], selected: number, gap: number): number[] {
  const tops: number[] = []
  const below = (i: number) => tops[i - 1]! + heights[i - 1]! + gap
  const down = (from: number) => {
    for (let i = from; i < desired.length; i++) tops[i] = i === 0 ? Math.max(0, desired[i]!) : Math.max(desired[i]!, below(i))
  }
  down(0)
  if (selected < 0 || selected >= desired.length) return tops
  tops[selected] = Math.max(0, desired[selected]!)
  for (let i = selected - 1; i >= 0; i--) tops[i] = Math.min(tops[i]!, tops[i + 1]! - gap - heights[i]!)
  // Pushed above the top, the cards stack from the top down, the selected one as near its passage
  // as they let it be.
  if (tops[0]! < 0) down(0)
  else for (let i = selected + 1; i < desired.length; i++) tops[i] = Math.max(desired[i]!, below(i))
  return tops
}

/** A `px` or `rem` length in pixels. */
export const toPx = (length: string, rem: number): number => (length.endsWith("rem") ? parseFloat(length) * rem : parseFloat(length))

/** The zoom's steps, from the viewer's bar and the keyboard; a pinch may land between them. */
export const ZOOMS = [0.5, 0.67, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3]

/** A zoom held to the steps' range: 100% for one that is no number. */
export const clampZoom = (zoom: number): number =>
  Math.min(ZOOMS.at(-1)!, Math.max(ZOOMS[0]!, Number.isFinite(zoom) ? zoom : 1))

/** The next step from `zoom`, in (`1`) or out (`-1`), or `zoom` itself at the end of the steps. */
export const steppedZoom = (zoom: number, by: 1 | -1): number =>
  (by > 0 ? ZOOMS.find((step) => step > zoom + 0.001) : ZOOMS.findLast((step) => step < zoom - 0.001)) ?? zoom
