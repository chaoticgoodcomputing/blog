// Rules 1, 2 and 4: what a selector may reach.
//
// Every selector starts at an element of the block: its leftmost compound carries one of the
// block's classes, so nothing above the block (`:root .x`, `.sidebar .x`) decides what it selects.
// From there it may go down, into the block, but never beside it: a sibling combinator (`+`, `~`)
// must land on another element of the block. The same holds inside `:has()`, whose argument starts
// at the element, and inside `:is()`, `:where()`, `:not()` and the `of S` of `:nth-child()` and
// `:nth-last-child()`, whose argument is a selector of its own once it has a combinator in it.
//
// What a selector may name on the way down depends on its reach:
// - "block": every class, tag, id or attribute it names, anywhere, is the block's. For a package
//   that renders all of its markup itself.
// - "inside": anything inside an element of the block, for markup someone else writes there, such
//   as PDF.js's text layer.
import selectorParser from "postcss-selector-parser"
import { CLASS, isOurs, notOurs } from "./blocks.js"

/** @typedef {import("./blocks.js").Blocks} Blocks */
/** @typedef {"block" | "inside"} Reach */
/** @typedef {import("postcss-selector-parser").Selector} Selector */
/** @typedef {import("postcss-selector-parser").Node} Node */

// Pseudo-classes whose argument is a selector list matched against the element itself.
const LOGICAL = new Set([":is", ":where", ":not", ":matches", ":-webkit-any", ":-moz-any"])
// Pseudo-classes whose argument may end in `of S`, a selector list matched against the element and
// the siblings it counts: `:nth-child(2n of .x__item)`.
const NTH_OF = new Set([":nth-child", ":nth-last-child"])
// Pseudo-classes and -elements whose argument is made of selectors at all. Any other argument
// (`:nth-child(2n + 1)`, `:lang(en)`) is not, whatever the parser makes of it.
const SELECTOR_ARGUMENT = new Set([
  ...LOGICAL,
  ":has",
  ":host",
  ":host-context",
  "::slotted",
  "::cue",
])

/**
 * The selectors a pseudo-class or -element takes as its argument, if it takes any.
 * @param {Node} node
 * @returns {Selector[]}
 */
function selectorArguments(node) {
  if (node.type !== "pseudo") return []
  const name = node.value.toLowerCase()
  if (SELECTOR_ARGUMENT.has(name)) return /** @type {Selector[]} */ (node.nodes)
  if (NTH_OF.has(name)) {
    // The parser reads `2n of .x` as tags and combinators; An+B never spells `of`, so the first
    // `of` starts the selector list.
    const of = node.nodes
      .map(String)
      .join(",")
      .match(/\bof\s([\s\S]*)$/i)
    if (of) return selectorParser().astSync(of[1]).nodes
  }
  return []
}

// How a problem names a pseudo's selector argument.
const argumentOf = (/** @type {Node} */ node, /** @type {Selector} */ argument) =>
  NTH_OF.has((node.value ?? "").toLowerCase())
    ? `${node.value}(… of ${String(argument).trim()})`
    : `${node.value}(${String(argument).trim()})`

const hop = (/** @type {Node} */ node) => (node.value ?? "").trim()
// Descendant (` `) and child (`>`) go down. Anything else leaves the element's subtree.
const goesDown = (/** @type {Node} */ node) => hop(node) === "" || hop(node) === ">"
const text = (/** @type {Node[]} */ nodes) => nodes.map(String).join("").trim()

/**
 * A complex selector cut at its combinators: each compound with the combinator before it.
 * @param {Selector} selector
 */
function compounds(selector) {
  /** @type {{ combinator?: Node, nodes: Node[] }[]} */
  const out = [{ nodes: [] }]
  for (const node of selector.nodes) {
    if (node.type === "combinator") out.push({ combinator: node, nodes: [] })
    else out[out.length - 1].nodes.push(node)
  }
  return out
}

/**
 * Every problem with one rule's selector list, each as a message.
 * @param {string} selectorList
 * @param {Blocks} blocks
 * @param {Reach} reach
 * @returns {string[]}
 */
export function checkSelector(selectorList, blocks, reach) {
  /** @type {string[]} */
  const problems = []
  const quoted = (/** @type {Selector} */ s) => `"${String(s).trim()}"`
  const carries = (/** @type {Node[]} */ nodes) =>
    nodes.some((node) => node.type === "class" && isOurs(node.value, blocks, CLASS))
  const blockNames = blocks.own.map((b) => `.${b}`).join(" or ")

  // A selector's compounds, from the element it starts at or, for a relative one, the element
  // before it: a hop beside must land on the block.
  const checkHops = (/** @type {Selector} */ selector, /** @type {Selector} */ top) => {
    for (const { combinator, nodes } of compounds(selector)) {
      if (combinator && !goesDown(combinator) && !carries(nodes)) {
        problems.push(
          `${quoted(top)} reaches a sibling that isn't an element of the block: ${hop(combinator)} ${text(nodes)}`,
        )
      }
    }
  }

  const checkPseudo = (/** @type {Node} */ node, /** @type {Selector} */ top) => {
    const name = node.type === "pseudo" ? node.value.toLowerCase() : ""
    const matchesElement = LOGICAL.has(name) || NTH_OF.has(name)
    for (const argument of selectorArguments(node)) {
      if (name === ":has") checkHops(argument, top)
      else if (matchesElement && argument.nodes.some((n) => n.type === "combinator")) {
        if (!carries(compounds(argument)[0].nodes))
          problems.push(
            `${quoted(top)} reaches above the element through ${argumentOf(node, argument)}`,
          )
        checkHops(argument, top)
      }
      for (const inner of argument.nodes) checkPseudo(inner, top)
    }
  }

  // "block" reach: every name, in the selector and in selector arguments, is the block's.
  const checkNames = (/** @type {Node[]} */ nodes, /** @type {Selector} */ top) => {
    for (const node of nodes) {
      if (node.type === "class" && !isOurs(node.value, blocks, CLASS)) {
        problems.push(
          `${quoted(top)}: ${notOurs(`.${node.value}`, node.value, blocks, CLASS, ".")}`,
        )
      } else if (["tag", "id", "attribute", "universal"].includes(node.type)) {
        problems.push(
          `${quoted(top)}: ${String(node).trim()} selects what this package does not own`,
        )
      } else {
        for (const argument of selectorArguments(node)) checkNames(argument.nodes, top)
      }
    }
  }

  try {
    selectorParser((list) => {
      list.each((selector) => {
        let nesting = false
        selector.walkNesting(() => {
          nesting = true
        })
        if (nesting) {
          problems.push(
            `${quoted(selector)}: & — a nested selector; write the full one, so the check sees what it selects`,
          )
          return
        }
        const [first] = compounds(selector)
        if (!carries(first.nodes))
          problems.push(`${quoted(selector)} doesn't start at an element of ${blockNames}`)
        checkHops(selector, selector)
        for (const node of selector.nodes) checkPseudo(node, selector)
        if (reach === "block") checkNames(selector.nodes, selector)
      })
    }).processSync(selectorList)
  } catch (err) {
    problems.push(`"${selectorList}" can't be parsed: ${err instanceof Error ? err.message : err}`)
  }
  return problems
}
