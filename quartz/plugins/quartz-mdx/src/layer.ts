// The widget layer (ADR-0002's widget-layer amendment, #45): every stylesheet the widget build emits
// lands in `@layer cgc.mdx.widgets`, whatever the widget's source, so it ranks with the family:
// above core and themes, below the site. esbuild has no option for this, so its CSS output is
// wrapped here as it is emitted.
//
// A widget's own `@layer foo {…}` needs no special handling: inside the wrapper it nests to
// `cgc.mdx.widgets.foo`. What can't sit inside a block is the preamble esbuild leaves at the top of a
// bundle: the `@import`s it did not inline (remote ones) and any `@layer` statements ordering them.
// Those stay ahead of the wrapper and are rewritten into the widget layer, so nothing escapes it:
//   @import "https://…" screen;        →  @import "https://…" layer(cgc.mdx.widgets) screen;
//   @import "https://…" layer(foo);    →  @import "https://…" layer(cgc.mdx.widgets.foo);
//   @import "https://…" layer;         →  @import "https://…" layer(cgc.mdx.widgets.anonymous-<id>);
//   @layer foo, bar;                   →  @layer cgc.mdx.widgets.foo,cgc.mdx.widgets.bar;
// One spelling per layer is not a concern here: the browser reads these files, never lightningcss.
import { createHash } from "node:crypto"

export const WIDGET_LAYER = "cgc.mdx.widgets"

const PREAMBLE_RULE = /^@(charset|import|layer|namespace)(?![\w-])/i

/** Wraps one of esbuild's CSS outputs in the widget layer. */
export function layerWidgetCss(css: string, layer: string = WIDGET_LAYER): string {
  const preamble: string[] = []
  // Names for this stylesheet's anonymous imports, which no other stylesheet's can share.
  const sheet = createHash("sha256").update(css).digest("hex").slice(0, 8)
  let anonymous = 0
  const anonymousLayer = () => `${layer}.anonymous-${sheet}-${anonymous++}`
  let i = 0
  for (;;) {
    const start = skipTrivia(css, i)
    // Comments between preamble rules (a legal notice, say) stay where they were.
    if (start > i) preamble.push(css.slice(i, start))
    i = start
    const keyword = PREAMBLE_RULE.exec(css.slice(i))?.[1]?.toLowerCase()
    if (!keyword) break
    const { end, terminator } = preludeEnd(css, i + keyword.length + 1)
    // `@layer foo {…}` is a block, and belongs inside the wrapper with everything after it.
    if (terminator !== ";") break
    const prelude = css.slice(i + keyword.length + 1, end)
    if (keyword === "import") preamble.push(`@import ${layerImport(prelude, layer, anonymousLayer)};`)
    else if (keyword === "layer") preamble.push(`@layer ${prelude.split(",").map((name) => `${layer}.${name.trim()}`).join(",")};`)
    else preamble.push(css.slice(i, end + 1))
    i = end + 1
  }
  return `${preamble.join("")}@layer ${layer}{${css.slice(i).trimEnd()}}\n`
}

// `url layer(name) conditions` with the layer moved under ours. An anonymous `layer` has no dotted
// form, so it gets a sublayer named for it alone: its rules still rank below the widget's own, as
// they did before the wrapper, rather than tying with them in the widget layer itself.
function layerImport(prelude: string, layer: string, anonymousLayer: () => string) {
  const start = skipTrivia(prelude, 0)
  const urlEnd = tokenEnd(prelude, start)
  const url = prelude.slice(start, urlEnd)
  let rest = prelude.slice(skipTrivia(prelude, urlEnd))
  let name = layer
  const named = /^layer\(/i.exec(rest)
  if (named) {
    const close = tokenEnd(rest, 0)
    name = `${layer}.${rest.slice(named[0].length, close - 1).trim()}`
    rest = rest.slice(close)
  } else if (/^layer(?![\w-])/i.test(rest)) {
    name = anonymousLayer()
    rest = rest.slice("layer".length)
  }
  rest = rest.trim()
  return `${url} layer(${name})${rest ? ` ${rest}` : ""}`
}

// Whitespace and comments.
function skipTrivia(css: string, i: number) {
  for (;;) {
    while (i < css.length && /\s/.test(css[i])) i++
    if (!css.startsWith("/*", i)) return i
    const close = css.indexOf("*/", i + 2)
    i = close < 0 ? css.length : close + 2
  }
}

// Just past a string starting at its opening quote.
function stringEnd(css: string, i: number) {
  const quote = css[i]
  for (i++; i < css.length; i++) {
    if (css[i] === "\\") i++
    else if (css[i] === quote) return i + 1
  }
  return i
}

// Just past one token: a string, a function such as `url(…)` or `layer(…)`, or a bare word.
function tokenEnd(css: string, i: number) {
  if (css[i] === '"' || css[i] === "'") return stringEnd(css, i)
  let depth = 0
  for (; i < css.length; i++) {
    const c = css[i]
    if (c === "\\") i++
    else if (c === '"' || c === "'") i = stringEnd(css, i) - 1
    else if (c === "(") depth++
    else if (c === ")") {
      if (--depth === 0) return i + 1
    } else if (depth === 0 && /[\s;{]/.test(c)) return i
  }
  return i
}

// The `;` or `{` that ends the at-rule prelude starting at `i`, outside any string, comment or
// brackets.
function preludeEnd(css: string, i: number) {
  let depth = 0
  for (; i < css.length; i++) {
    const c = css[i]
    if (c === "\\") i++
    else if (c === '"' || c === "'") i = stringEnd(css, i) - 1
    else if (css.startsWith("/*", i)) i = skipTrivia(css, i) - 1
    else if (c === "(" || c === "[") depth++
    else if (c === ")" || c === "]") depth--
    else if (depth === 0 && (c === ";" || c === "{")) return { end: i, terminator: c }
  }
  return { end: i, terminator: "" }
}
