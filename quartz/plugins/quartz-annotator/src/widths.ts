// The annotation page's widths, as a site sets them in the plugin's options: `px` or `rem` only,
// since the page's script does arithmetic with them. They reach the page as `--cgc-annotator-*`
// custom properties the frame sets (the repo's ADR-0003, rule 7), and the Viewer as island props.

/** The widths the annotation page is laid out by. */
export interface Widths {
  /** A card's width: the desktop margin's, and the tablet drawer's. */
  marginWidth: string
  /** The narrowest the document may be at 100% before the annotations go to the drawer. */
  minDocumentWidth: string
  /** The top and bottom sections' width: core's `$pageWidth`. */
  textWidth: string
}

export const DEFAULT_WIDTHS: Widths = { marginWidth: "20rem", minDocumentWidth: "36rem", textWidth: "800px" }

const LENGTH = /^\d+(?:\.\d+)?(?:px|rem)$/

/**
 * The widths a site's options give, each a `px` or `rem` length, or its default. `complain` is told
 * of each one that isn't.
 */
export function widths(options: Partial<Record<keyof Widths, unknown>>, complain: (message: string) => void): Widths {
  const out = { ...DEFAULT_WIDTHS }
  for (const key of Object.keys(DEFAULT_WIDTHS) as (keyof Widths)[]) {
    const value = options[key]
    if (value === undefined) continue
    const length = typeof value === "string" ? value.trim() : typeof value === "number" && value === 0 ? "0px" : undefined
    if (length !== undefined && LENGTH.test(length)) out[key] = length
    else complain(`its ${key} option, ${JSON.stringify(value)}, isn't a length in px or rem, so it's ${DEFAULT_WIDTHS[key]}.`)
  }
  return out
}

/** The custom properties the frame sets from the widths. */
export const widthProperties = (w: Widths) =>
  `--cgc-annotator-margin-width: ${w.marginWidth}; --cgc-annotator-min-document-width: ${w.minDocumentWidth}; --cgc-annotator-text-width: ${w.textWidth};`
