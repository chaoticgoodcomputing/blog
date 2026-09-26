// The cascade's layers, read back out of a loaded page (ADR-0003's family-layer and site-plugin
// amendments). Layers rank by where each name *first* appears in document order, so the page's
// stylesheets are walked in order, `@import`ed sheets included, and every layer name is recorded the
// first time it is seen, under its parent. What the browser ranks is what is asserted: no stylesheet
// source is parsed here. One walker for every reading, re-exported by `test.mjs` for specs.

// Runs in the page. `order` is keyed by parent: `""` holds the top-level names, and `"site"` (say)
// the sublayers of `site`. `sheets` holds each stylesheet's own top-level names, in its order. With
// `withRules`, `rules` holds every style rule, nested ones included: its selector, the dotted name
// of the layer it sits in (`""` for none) and its declarations. An anonymous layer is named
// `(anonymous)`. A cross-origin sheet the page may not read, such as a font CDN's, can't be walked:
// its URL goes in `unreadable` instead, so a check can fail on it rather than pass it unseen.
function readLayers(withRules) {
  const order = {}
  const sheets = []
  const rules = []
  const unreadable = []
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
    let list
    try {
      list = sheet.cssRules
    } catch {
      unreadable.push(sheet.href)
      return
    }
    walk(list, parent)
  }
  const walk = (list, parent) => {
    for (const rule of list) {
      if (rule instanceof CSSLayerStatementRule) {
        for (const name of rule.nameList) note(parent, name)
      } else if (rule instanceof CSSLayerBlockRule) {
        walk(rule.cssRules, note(parent, rule.name || "(anonymous)"))
      } else if (rule instanceof CSSImportRule) {
        const layer = rule.layerName === null ? parent : note(parent, rule.layerName || "(anonymous)")
        if (rule.styleSheet) readSheet(rule.styleSheet, layer)
      } else {
        if (withRules && rule instanceof CSSStyleRule) {
          const style = {}
          for (const name of rule.style) style[name] = rule.style.getPropertyValue(name).trim()
          rules.push({ selector: rule.selectorText, layer: parent, style })
        }
        // @media, @supports, @container, and nested style rules.
        if (rule.cssRules) walk(rule.cssRules, parent)
      }
    }
  }
  for (const sheet of document.styleSheets) {
    own = []
    readSheet(sheet, "")
    sheets.push(own)
  }
  return { order, sheets, rules, unreadable }
}

/**
 * The page's cascade layers, lowest-ranked first, keyed by parent: `order[""]` is the top-level
 * ranking, and `order.cgc` the family layer's sublayers.
 */
export const layerOrder = async (page) => (await page.evaluate(readLayers, false)).order

/**
 * The URLs of the page's stylesheets whose rules it may not read (a cross-origin sheet served without
 * CORS), in document order. Their layers rank but are missing from every other reading here.
 */
export const unreadableSheets = async (page) => (await page.evaluate(readLayers, false)).unreadable

/**
 * The site's stack declaration as the page carries it: the top-level layers of the first stylesheet
 * that names `site`, in that sheet's order, or null. Read from the sheet rather than from its first
 * `@layer` statement, because lightningcss folds a statement's last names into the blocks that
 * follow it: `@layer a, b, site; @layer site {…}` is served as `@layer a,b;@layer site{…}`.
 */
export const stackDeclaration = async (page) =>
  (await page.evaluate(readLayers, false)).sheets.find((names) => names.includes("site")) ?? null

/**
 * Every style rule on the page, in document order, as `{ selector, layer, style }`: the layer is
 * dotted (`cgc.tags`), `""` for an unlayered rule, and `style` maps each declared property to its
 * value as the browser parsed it.
 */
export const styleRules = async (page) => (await page.evaluate(readLayers, true)).rules

/** The layer of every style rule whose selector mentions `name`, such as a package's BEM block. */
export const layersOf = async (page, name) =>
  (await styleRules(page)).filter(({ selector }) => selector.includes(name)).map(({ layer }) => layer)
