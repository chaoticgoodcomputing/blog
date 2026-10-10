// WCAG's contrast ratio, for the specs that check a colour is legible against another.

/** WCAG 2's contrast ratio between two colours as the browser computes them, `rgb(r, g, b)`. */
export function contrast(a: string, b: string): number {
  const luminance = (colour: string) => {
    const [red, green, blue] = colour.match(/\d+(\.\d+)?/g)!.map((part) => {
      const channel = Number(part) / 255
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * red! + 0.7152 * green! + 0.0722 * blue!
  }
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (lighter! + 0.05) / (darker! + 0.05)
}
