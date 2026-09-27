// The one colour resolver for code that can't paint with CSS: a canvas or WebGL scene, such as the
// graph (#31). Browser only.
//
// A canvas needs a real colour, and `getComputedStyle` returns a custom property as its token text,
// so a `light-dark()`, a `color-mix()` or a `var()` chain would arrive unresolved. Instead, a probe
// element takes the value as its `color`, which the browser resolves in the page's current scheme,
// and a 1×1 canvas normalises whatever colour syntax that yields to `rgba()`.
//
// The page's scheme can change under it (ADR-0003's *the scheme changes under a loaded page*
// amendment), so a result is cached per scheme and the cache is dropped on `themechange`. A consumer
// still redraws on `themechange` itself, and resolves again: it gets the new scheme's colours
// whichever listener runs first.

const cache = new Map<string, string>()
let listening = false
let pixel: CanvasRenderingContext2D | null = null

/**
 * Resolves a colour value to the colour the page shows for it right now, as `rgba(r, g, b, a)`. The
 * value is anything CSS accepts as a colour, such as a plugin's colour option. A value that doesn't
 * resolve, such as a reference to a property nothing defines, gives the page's text colour.
 */
export function resolveColour(value: string): string {
  if (!listening) {
    document.addEventListener("themechange", () => cache.clear())
    listening = true
  }
  const key = `${document.documentElement.getAttribute("saved-theme") ?? ""} ${value}`
  const cached = cache.get(key)
  if (cached !== undefined) return cached

  const probe = document.createElement("span")
  probe.style.display = "none"
  probe.style.color = value
  document.body.appendChild(probe)
  const computed = getComputedStyle(probe).color
  probe.remove()

  const resolved = toRgba(computed)
  cache.set(key, resolved)
  return resolved
}

/**
 * Resolves a tag's colour, given the property name the engine publishes for it (`TagProperties.color`
 * on `fileData`, or `color` in `static/cgcTags.json`).
 */
export const resolveTagColour = (property: string): string => resolveColour(`var(${property})`)

function toRgba(colour: string): string {
  pixel ??= Object.assign(document.createElement("canvas"), { width: 1, height: 1 }).getContext(
    "2d",
    {
      willReadFrequently: true,
    },
  )
  if (!pixel) return colour
  pixel.clearRect(0, 0, 1, 1)
  pixel.fillStyle = colour
  pixel.fillRect(0, 0, 1, 1)
  const [r, g, b, a] = pixel.getImageData(0, 0, 1, 1).data
  return `rgba(${r}, ${g}, ${b}, ${Math.round((a / 255) * 1000) / 1000})`
}
