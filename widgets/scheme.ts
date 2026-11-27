// Colours for widgets that paint in script (a canvas, a chart), shared by the vault's widgets.
//
// A widget's CSS names its skin as custom properties on its root, taken from the theme's own
// (`var(--light)`, `var(--secondary)`…), so it follows the site's palette in either colour scheme.
// Script can't paint a `var()`, so it reads each one through the page's own CSS, and reads them again
// when the reader switches scheme on a loaded page.

/** Any colour value CSS accepts (a hex, `var(--x)`, `light-dark(…)`), as the canvas can paint it. */
export function resolveColour(within: Element, value: string): string {
  const probe = document.createElement("span")
  probe.style.display = "none"
  probe.style.color = value
  within.appendChild(probe)
  const colour = getComputedStyle(probe).color
  probe.remove()
  return colour
}

/** The colour a custom property on `el` holds right now. */
export const skin = (el: Element, property: string) => resolveColour(el, getComputedStyle(el).getPropertyValue(property).trim())

/** Calls `redraw` whenever the reader switches colour scheme; returns what stops it. */
export function onSchemeChange(redraw: () => void): () => void {
  document.addEventListener("themechange", redraw)
  return () => document.removeEventListener("themechange", redraw)
}

/** Whether text on `background` should be the darker of two inks, by the background's luminance. */
export function isLight(colour: string): boolean {
  const [r, g, b] = (colour.match(/[\d.]+/g) ?? []).map(Number)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 140
}
