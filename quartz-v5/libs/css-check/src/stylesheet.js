// ADR-0003's library-CSS rules, checked on one stylesheet. The check reads the CSS and rewrites
// nothing, so what ships is exactly what was checked.
import postcss from "postcss"
import { blocksOf, isOurs, notOurs, NAME } from "./blocks.js"
import { colourLiterals, definedNames, fontLiteral, THEME_FONTS } from "./values.js"
import { checkSelector } from "./selectors.js"

/**
 * @typedef {object} Options
 * @property {string} from  The stylesheet's path, as a problem names it.
 * @property {string | readonly string[]} block  The BEM block the stylesheet styles, such as
 *   `cgc-social`, or every block it styles. Every class it selects and every name it defines is in
 *   one of theirs.
 * @property {readonly string[]} [neighbours]  Blocks that aren't this stylesheet's but whose names
 *   one of its own blocks' namespaces would hold, such as `cgc-bluesky-post` beside `cgc-bluesky`.
 *   A name is the block's that holds it most narrowly.
 * @property {string} [layer]  The package's family sublayer, `cgc.<name>`: every rule sits in one
 *   top-level `@layer <layer> { … }` (rule 11). Without it, the stylesheet declares no layer at
 *   all, and whoever ships it places it.
 * @property {import("./selectors.js").Reach} [reach]  How far a selector may reach below an element
 *   of the block: "block" (the default), naming only the block's own classes, or "inside", anything
 *   inside it, for markup someone else writes there.
 * @property {readonly string[]} [media]  The only media queries allowed, where a package pins them.
 */

// At-rules library CSS may use, besides `@layer` (rule 11) and `@keyframes` (namespaced).
const GROUPING = new Set(["media", "supports", "container"])
// At-rules that define a name in one of the page's global namespaces, which no block holds.
const GLOBAL = new Set([
  "property",
  "font-face",
  "counter-style",
  "font-feature-values",
  "font-palette-values",
  "position-try",
])

/**
 * Checks a stylesheet against ADR-0003's library-CSS rules.
 * @param {string} css
 * @param {Options} options
 * @returns {string[]}  One line per problem, `file:line:column  message`; empty when there are none.
 */
export function checkStylesheet(css, options) {
  const { from, layer, media, reach = "block" } = options
  const blocks = blocksOf(options.block, options.neighbours)
  /** @type {string[]} */
  const problems = []
  /** @param {import("postcss").Node} node @param {string} message */
  const report = (node, message) =>
    problems.push(
      `${from}:${node.source?.start?.line ?? 0}:${node.source?.start?.column ?? 0}  ${message}`,
    )

  let root
  try {
    root = postcss.parse(css, { from })
  } catch (err) {
    return [`${from}  can't be parsed: ${err instanceof Error ? err.message : err}`]
  }

  // Rule 11: the package's own layer holds everything, or, for a stylesheet someone else places,
  // no layer at all.
  const isLayer = (/** @type {import("postcss").Node} */ node) =>
    node.type === "atrule" &&
    /** @type {import("postcss").AtRule} */ (node).name.toLowerCase() === "layer"
  if (layer) {
    for (const node of root.nodes) {
      if (node.type !== "comment" && !isLayer(node))
        report(node, `${describe(node)} is outside @layer ${layer}`)
    }
  }

  root.walkAtRules((rule) => {
    const name = rule.name.toLowerCase()
    if (enclosingRule(rule)) {
      report(rule, `${describe(rule)} is nested in a rule; write it at the top level`)
    } else if (name === "layer") {
      if (!layer)
        report(
          rule,
          `@layer ${rule.params}: this stylesheet declares no layer; whoever ships it places it`,
        )
      else if (!(rule.params === layer && rule.nodes && rule.parent === root))
        report(rule, `@layer ${rule.params}: the only layer is one top-level @layer ${layer} { … }`)
    } else if (/keyframes$/.test(name)) {
      const keyframes = rule.params.trim()
      if (!isOurs(keyframes, blocks, NAME))
        report(rule, `@keyframes ${notOurs(keyframes, keyframes, blocks, NAME)}`)
    } else if (name === "media" && media && !media.includes(rule.params)) {
      report(rule, `@media ${rule.params}: the only media queries here are ${media.join(", ")}`)
    } else if (name === "import") {
      report(rule, `@import ${rule.params} brings in CSS this check can't see`)
    } else if (GLOBAL.has(name)) {
      report(
        rule,
        `${describe(rule)} defines a name in the page's global namespace, which no block holds`,
      )
    } else if (!GROUPING.has(name)) {
      report(rule, `@${rule.name} is not allowed in library CSS`)
    }
  })

  root.walkRules((rule) => {
    if (inKeyframes(rule)) return // `from`, `to` and percentages are points in time, not selectors
    const parent = enclosingRule(rule)
    if (parent) {
      report(
        rule,
        `"${rule.selector}" is nested in "${parent.selector}"; write the full selector, so the check sees what it selects`,
      )
      return
    }
    for (const problem of checkSelector(rule.selector, blocks, reach)) report(rule, problem)
  })

  root.walkDecls((decl) => {
    const parent = decl.parent
    if (parent?.type !== "rule") {
      // Loose in a layer or a grouping rule, or inside an at-rule reported above (`@font-face`).
      const at =
        parent?.type === "atrule"
          ? /** @type {import("postcss").AtRule} */ (parent).name.toLowerCase()
          : ""
      if (parent?.type === "root" || at === "layer" || GROUPING.has(at))
        report(decl, `${decl.prop}: ${decl.value} is outside any rule`)
      return
    }
    // Rule 7: every custom property the stylesheet defines is the block's.
    if (decl.prop.startsWith("--") && !isOurs(decl.prop.slice(2), blocks, NAME))
      report(decl, notOurs(decl.prop, decl.prop.slice(2), blocks, NAME, "--"))
    // The page's other global names: anchors, containers, view transitions, timelines.
    for (const name of definedNames(decl.prop, decl.value)) {
      const bare = name.replace(/^--/, "")
      if (!isOurs(bare, blocks, NAME))
        report(decl, `${decl.prop}: ${notOurs(name, bare, blocks, NAME)}`)
    }
    // Rules 5 and 6: skin comes from the theme, fonts from its four font families.
    const literals = colourLiterals(decl.prop, decl.value)
    if (literals.length)
      report(
        decl,
        `${decl.prop}: ${decl.value} — a colour literal (${literals.join(", ")}); take colours from the theme's properties`,
      )
    const font = fontLiteral(decl.prop, decl.value)
    if (font !== undefined)
      report(
        decl,
        `${decl.prop}: ${font} — a font family of its own; take one of the theme's, ${THEME_FONTS.map((f) => `var(${f})`).join(", ")}`,
      )
  })

  return problems
}

/** @param {import("postcss").Node} node @returns {import("postcss").Rule | undefined} */
function enclosingRule(node) {
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (parent.type === "rule" && !inKeyframes(parent))
      return /** @type {import("postcss").Rule} */ (parent)
  }
  return undefined
}

/** @param {import("postcss").Node} node */
function inKeyframes(node) {
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (
      parent.type === "atrule" &&
      /keyframes$/i.test(/** @type {import("postcss").AtRule} */ (parent).name)
    )
      return true
  }
  return false
}

/** @param {import("postcss").ChildNode} node */
function describe(node) {
  switch (node.type) {
    case "rule":
      return `"${node.selector}"`
    case "atrule":
      return `@${node.name} ${node.params}`.trim()
    case "decl":
      return `${node.prop}: ${node.value}`
    default:
      return node.type
  }
}
