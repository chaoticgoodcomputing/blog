// The cascade's layer order, read back out of a loaded page (ADR-0003's family-layer and
// site-plugin amendments). Layers rank by where each name *first* appears in document order, so the
// page's stylesheets are walked in order, `@import`ed sheets included, and every layer name is
// recorded the first time it is seen, under its parent. What the browser ranks is what is asserted:
// no stylesheet source is parsed here.

// Runs in the page. `order` is keyed by parent: `""` holds the top-level names, and `"site"` (say)
// the sublayers of `site`. `sheets` holds each stylesheet's own top-level names, in its order. An
// anonymous layer is recorded as `(anonymous)`. A cross-origin sheet the page may not read is
// skipped.
function readLayers() {
  const order = {}
  const sheets = []
  let own
  const note = (parent, name) => {
    let full = parent
    for (const part of name.split(".")) {
      const siblings = (order[full] ??= [])
      if (!siblings.includes(part)) siblings.push(part)
      if (full === "" && !own.includes(part)) own.push(part)
      full = full ? `${full}.${part}` : part
    }
    return full
  }
  const readSheet = (sheet, parent) => {
    let rules
    try {
      rules = sheet.cssRules
    } catch {
      return
    }
    walk(rules, parent)
  }
  const walk = (rules, parent) => {
    for (const rule of rules) {
      if (rule instanceof CSSLayerStatementRule) {
        for (const name of rule.nameList) note(parent, name)
      } else if (rule instanceof CSSLayerBlockRule) {
        walk(rule.cssRules, note(parent, rule.name || "(anonymous)"))
      } else if (rule instanceof CSSImportRule) {
        const layer = rule.layerName === null ? parent : note(parent, rule.layerName || "(anonymous)")
        if (rule.styleSheet) readSheet(rule.styleSheet, layer)
      } else if (rule.cssRules) {
        // @media, @supports, @container, and nested style rules.
        walk(rule.cssRules, parent)
      }
    }
  }
  for (const sheet of document.styleSheets) {
    own = []
    readSheet(sheet, "")
    sheets.push(own)
  }
  return { order, sheets }
}

/** The page's cascade layers, lowest-ranked first, keyed by parent (`""` for the top level). */
export const layerOrder = async (page) => (await page.evaluate(readLayers)).order

/**
 * The site's stack declaration as the page carries it: the top-level layers of the first stylesheet
 * that names `site`, in that sheet's order, or null. Read from the sheet rather than from its first
 * `@layer` statement, because lightningcss folds a statement's last names into the blocks that
 * follow it: `@layer a, b, site; @layer site {…}` is served as `@layer a,b;@layer site{…}`.
 */
export const stackDeclaration = async (page) =>
  (await page.evaluate(readLayers)).sheets.find((names) => names.includes("site")) ?? null
