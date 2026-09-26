// Rule 5, "ship structure, consume skin": what in a declaration's value is a colour or font literal.
//
// A colour value that refers to the theme (`var(--secondary)`), mixes theme colours
// (`color-mix(in srgb, var(--a) 25%, var(--b))`) or splits them by scheme
// (`light-dark(var(--a), var(--b))`) follows the theme, so it passes. A literal asserts its own
// colour wherever it sits, inside one of those functions included: a hex, a colour function, a named
// colour or a system colour. `currentColor` and `transparent` assert none.

// CSS Color 4's named colours and its system colours, the deprecated ones included, since browsers
// still paint them: https://www.w3.org/TR/css-color-4/#named-colors,
// https://www.w3.org/TR/css-color-4/#css-system-colors and
// https://www.w3.org/TR/css-color-4/#deprecated-system-colors.
const NAMED = new Set(
  `aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet
  brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue
  darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange
  darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise
  darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia
  gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo
  ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan
  lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue
  lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon
  mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue
  mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin
  navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen
  paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red
  rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue
  slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white
  whitesmoke yellow yellowgreen
  accentcolor accentcolortext activetext buttonborder buttonface buttontext canvas canvastext field
  fieldtext graytext highlight highlighttext linktext mark marktext selecteditem selecteditemtext
  visitedtext
  activeborder activecaption appworkspace background buttonhighlight buttonshadow captiontext
  inactiveborder inactivecaption inactivecaptiontext infobackground infotext menu menutext scrollbar
  threeddarkshadow threedface threedhighlight threedlightshadow threedshadow window windowframe
  windowtext`.split(/\s+/),
)

// Properties whose words are never colours, so a word that spells one is something else: a
// property (`transition: background 0.2s`), a name (`grid-area: tomato`) or a system font
// (`font: menu`, which the font rule reports). A hex or a colour function still counts in them.
const WORDS_NOT_COLOURS =
  /^(?:transition(?:-property)?|will-change|font(?:-family)?|animation-name|counter-(?:reset|increment|set)|list-style-type|grid-(?:area|row|column)(?:-start|-end)?|container(?:-name)?|anchor-name|position-anchor|view-transition-(?:name|class)|timeline-scope|(?:scroll|view)-timeline(?:-name)?)$/i

const HEX = /#[0-9a-f]{3,8}\b/gi
const COLOUR_FUNCTION = /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|device-cmyk)\(/gi
// A whole identifier that isn't part of a longer one, a number's unit, a custom property's name or a
// function's name (`tan(`).
const IDENT = /(?<![\w#-])-?[a-z_][\w-]*(?![\w(-])/gi

// A value with its strings, URLs and grid line names (`[tomato]`) emptied: none holds a colour.
const withoutText = (/** @type {string} */ value) =>
  value
    .replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, '""')
    .replace(/\burl\([^)]*\)/gi, "url()")
    .replace(/\[[^\]]*\]/g, "[]")

/**
 * Every colour literal in a declaration's value.
 * @param {string} prop
 * @param {string} value
 * @returns {string[]}
 */
export function colourLiterals(prop, value) {
  const text = withoutText(value)
  const words = WORDS_NOT_COLOURS.test(prop) ? [] : (text.match(IDENT) ?? [])
  return [
    ...(text.match(HEX) ?? []),
    ...(text.match(COLOUR_FUNCTION) ?? []),
    ...words.filter((/** @type {string} */ ident) => NAMED.has(ident.toLowerCase())),
  ]
}

// Rule 6's four documented font families, the only fonts a stylesheet takes: a property of its own
// could hold any family at all.
export const THEME_FONTS = ["--titleFont", "--headerFont", "--bodyFont", "--codeFont"]
const FAMILY = String.raw`var\(\s*(?:${THEME_FONTS.join("|")})\s*\)`
const REFERENCE = new RegExp(`^${FAMILY}$`)
// The `font` shorthand, written out up to its family: style, variant, weight and width keywords, a
// size (a length, a percentage, a keyword or a math function), an optional line height, then the
// family. Nothing before the family may be a var(), since one could carry a family in.
const KEYWORD = String.raw`(?:normal|italic|oblique(?: -?[\d.]+deg)?|small-caps|bold|bolder|lighter|\d+|(?:(?:ultra|extra|semi)-)?(?:condensed|expanded))`
const MATH = String.raw`(?!var\()[a-z-]+\([^()]*\)`
const SIZE = String.raw`(?:[\d.]+(?:[a-z]+|%)?|(?:xx?x?-)?(?:small|large)|medium|larger|smaller|math|${MATH})`
const LINE_HEIGHT = String.raw`(?:normal|[\d.]+(?:[a-z]+|%)?|${MATH})`
const SHORTHAND = new RegExp(
  String.raw`^(?:${KEYWORD} )*${SIZE}(?: ?/ ?${LINE_HEIGHT})? ${FAMILY}$`,
)

/**
 * The font family a declaration sets, when it is anything but one of the theme's.
 * @param {string} prop
 * @param {string} value
 * @returns {string | undefined}
 */
export function fontLiteral(prop, value) {
  const text = value.trim().replace(/\s+/g, " ")
  switch (prop.toLowerCase()) {
    case "font-family":
      return REFERENCE.test(text) ? undefined : text
    case "font":
      return SHORTHAND.test(text) && text.match(/\bvar\(/g)?.length === 1 ? undefined : text
    default:
      return undefined
  }
}

// Properties that put a name into one of the page's global namespaces, and which of their words
// are names: every custom identifier, or only the dashed ones (`--menu`).
const NAMING = {
  "anchor-name": "dashed",
  "container-name": "custom",
  container: "custom", // `<name> / <type>`: only what comes before the slash
  "view-transition-name": "custom",
  "view-transition-class": "custom",
  "scroll-timeline-name": "dashed",
  "scroll-timeline": "dashed",
  "view-timeline-name": "dashed",
  "view-timeline": "dashed",
  "timeline-scope": "dashed",
}
const KEYWORDS = new Set([
  "none",
  "auto",
  "all",
  "match-element",
  "inherit",
  "initial",
  "unset",
  "revert",
  "revert-layer",
])

/**
 * The names a declaration defines in one of the page's global namespaces, as written.
 * @param {string} prop
 * @param {string} value
 * @returns {string[]}
 */
export function definedNames(prop, value) {
  const kind = NAMING[/** @type {keyof typeof NAMING} */ (prop.toLowerCase())]
  if (!kind) return []
  let text = value.replace(/\bvar\([^)]*\)/gi, " ")
  if (prop.toLowerCase() === "container") text = text.split("/")[0]
  const words = text.match(/-{0,2}[a-z_][\w-]*/gi) ?? []
  return kind === "dashed"
    ? words.filter((word) => word.startsWith("--"))
    : words.filter((word) => !KEYWORDS.has(word.toLowerCase()))
}
