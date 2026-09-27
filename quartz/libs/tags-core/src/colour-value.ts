// Whether a string is a colour value (ADR-0003's colour-value amendment, #31): anything CSS accepts
// as a colour. Every colour-valued option on a family plugin is checked with this at build time, and
// a value that fails fails the build: the tag dictionary's colours in `quartz-tags`, the graph's colour
// options in `quartz-graph`, the calendar's `levelColors` in `quartz-social`. Server only.
//
// It parses with lightningcss, the parser Quartz itself runs every stylesheet through, so a value
// passes exactly when Quartz's own CSS pipeline would read it as a colour. The plugin hands in the
// host's copy, which it has as a peer: a library that imported its own could disagree with the host.
//
// A value holding a `var()` can't be resolved at build time: whether the property exists, and what
// it holds, is the theme's business at runtime. Such a value passes when it is shaped like a colour:
// one `var()`, or a colour function (`light-dark()`, `color-mix()`, `rgb()`…) that uses one, with
// every part that isn't a reference itself a colour; and when some stand-in for each reference (a
// colour, a number, a percentage, or three channels, with or without commas) makes the whole value one lightningcss reads
// as a colour, so a colour function's other arguments are checked too.
//
// `!important` never passes. The engine writes a tag's colour into its cascade layer, where an
// important declaration would outrank the site's own unlayered override of that property.

/** lightningcss's `transform`, as a plugin imports it from the host: `import { transform } from "lightningcss"`. */
export type CssTransform = (options: any) => unknown

const COLOUR_FUNCTIONS = new Set([
  "rgb",
  "rgba",
  "hsl",
  "hsla",
  "hwb",
  "lab",
  "lch",
  "oklab",
  "oklch",
  "color",
  "color-mix",
  "light-dark",
])

/** A check for colour values that parses with `transform`, the host's lightningcss. */
export function colourValueCheck(transform: CssTransform): (value: unknown) => boolean {
  const isColourValue = (value: unknown): boolean => {
    // One value, and only a value: nothing that could end the declaration it is written into, or
    // comment out the rest of the stylesheet.
    // No `!`, which only `!important` would bring.
    if (typeof value !== "string" || !value.trim() || /[;{}!]|\/\*|\*\//.test(value)) return false
    const declaration = declarationOf(value)
    if (!declaration) return false
    if (declaration.property === "color") return true
    return (
      declaration.property === "unparsed" &&
      declaration.value.propertyId.property === "color" &&
      isColourTokens(declaration.value.value) &&
      standsIn(value)
    )
  }

  // The one declaration lightningcss reads from `color: <value>`, or none.
  function declarationOf(value: string): any {
    const declarations: any[] = []
    try {
      transform({
        filename: "colour.css",
        code: new TextEncoder().encode(`a{color:${value};}`),
        errorRecovery: false,
        visitor: {
          Declaration(declaration: any) {
            declarations.push(declaration)
          },
        },
      })
    } catch {
      return undefined
    }
    return declarations.length === 1 ? declarations[0] : undefined
  }

  // Whether some choice of stand-in for each outermost `var()` makes a value lightningcss reads as a
  // colour outright. Tried in every combination up to four references, and one stand-in for all of
  // them beyond that.
  function standsIn(value: string): boolean {
    const references = outermostVars(value)
    const choices =
      references.length <= 4
        ? combinations(references.length)
        : STAND_INS.map((stand) => references.map(() => stand))
    return choices.some((chosen) => {
      let substituted = ""
      let from = 0
      references.forEach(([start, end], i) => {
        substituted += value.slice(from, start) + chosen[i]
        from = end
      })
      substituted += value.slice(from)
      return declarationOf(substituted)?.property === "color"
    })
  }

  function isColourTokens(tokens: any[]): boolean {
    const meaningful = tokens.filter((token) => !isBlank(token))
    if (meaningful.length !== 1) return false
    const [token] = meaningful
    switch (token.type) {
      case "color":
        return true
      case "var":
        return !token.value.fallback || isColourTokens(token.value.fallback)
      case "unresolved-color":
        // `light-dark()` with a reference on either side; or `rgb()`, `hsl()`… whose channels are
        // references, which only the browser can check once they substitute.
        return (
          token.value.type !== "light-dark" ||
          (isColourTokens(token.value.light) && isColourTokens(token.value.dark))
        )
      case "function":
        return (
          COLOUR_FUNCTIONS.has(token.value.name.toLowerCase()) && usesVar(token.value.arguments)
        )
      case "token":
        // Beside a reference, a named colour or a hex stays a raw token: read it on its own.
        if (token.value.type === "ident") return isColourValue(token.value.value)
        if (token.value.type === "hash" || token.value.type === "id-hash")
          return isColourValue(`#${token.value.value}`)
        return false
      default:
        return false
    }
  }

  return isColourValue
}

// What a reference might stand for inside a colour: a colour, a number, a percentage, or three
// channels, space-separated or comma-separated as legacy `rgb()` and `hsl()` take them
// (`rgba(var(--rgb), 0.5)` with `--rgb: 12, 34, 56`).
const STAND_INS = ["black", "0", "0%", "0 0 0", "0, 0, 0", "0, 0%, 0%"]

const combinations = (n: number): string[][] =>
  n === 0
    ? [[]]
    : combinations(n - 1).flatMap((rest) => STAND_INS.map((stand) => [...rest, stand]))

// The `[start, end)` of each `var(…)` not inside another, found by matching parentheses.
function outermostVars(value: string): [number, number][] {
  const found: [number, number][] = []
  const pattern = /var\(/gi
  let match: RegExpExecArray | null
  while ((match = pattern.exec(value))) {
    let depth = 0
    let end = match.index + 3
    for (; end < value.length; end++) {
      if (value[end] === "(") depth++
      else if (value[end] === ")" && --depth === 0) break
    }
    found.push([match.index, end + 1])
    pattern.lastIndex = end + 1
  }
  return found
}

const isBlank = (token: any) =>
  token.type === "token" && ["white-space", "comment"].includes(token.value.type)

const usesVar = (tokens: any[]): boolean =>
  tokens.some(
    (token) =>
      token.type === "var" || (token.type === "function" && usesVar(token.value.arguments)),
  )
