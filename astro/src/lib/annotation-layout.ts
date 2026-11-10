// The arithmetic of an annotation page's layout, apart from the page it lays out: how wide the
// document is at a zoom, and whether the drawer is a phone's. The viewer
// (src/components/annotation-viewer) measures the page and applies what these return. The document
// takes the whole of the viewer's width, on a desktop as on a phone: the cards are in the drawer,
// and beside the document only as its highlights' popovers.

/** The viewer's layouts: the cards alone, as the page is built (`static`); the document with the cards in a drawer. */
export type Layout = "static" | "drawer"

/** Lengths the layout is worked out from, in CSS pixels. */
export interface Measures {
  /** The viewer's width: the site shell's content column. */
  available: number
  /** A card's width: the drawer's, but on a phone. */
  card: number
}

/** The document's width, and whether the drawer is a phone's. */
export interface Fit {
  /** The document's width at this zoom: wider than the column when zoomed past 100%. */
  documentWidth: number
  /** The drawer covers most of the screen, and is modal: one a card wide would cover more than half. */
  mobile: boolean
}

/** A card's width: the drawer's, but on a phone. The Quartz annotator's `marginWidth`. */
export const CARD_WIDTH = "20rem"

/** What fits the viewer at `zoom`. 100% is the viewer's width; at zoom `z` the document is `z` times that. */
export const fit = (m: Measures, zoom: number): Fit => ({
  documentWidth: zoom * m.available,
  mobile: m.card > m.available / 2,
})

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
