// Stylesheets, inlined. The plugin's pages are `blob:` documents made by Obsidian's window
// (src/frame-page.ts), and so live under Obsidian's Content Security Policy, whose `style-src`
// allows styles written into a page ('unsafe-inline') but no stylesheet from the plugin's folder.
// The Hypothesis client loads its styles as `<link rel="stylesheet">`s, into the page and into its
// shadow roots. So, before anything else runs in a page, this puts a `<style>` in place of each such
// link as it is inserted, and fills it with the stylesheet, fetched, which is allowed. The link's
// `load` event still fires, for whatever waits on it.
//
// Two things of the client's own rely on more (its src/annotator/util/shadow-root.ts):
// - It finds its stylesheet for its shadow roots by the preload of it that its boot script adds. A
//   preload of a stylesheet is refused too, so it is inserted as a preload of a fetch, which the
//   policy allows, and which the client still finds.
// - Once that stylesheet loads, it copies its `@property` rules, which apply only from a document's
//   own stylesheets, into the document, reading them from the link's `sheet`; the link here has
//   none, so this copies them.

import { absoluteUrls } from "../src/css-urls.ts"

/** The stylesheet a link loads, when it loads one; else undefined. */
const stylesheetOf = (node: unknown): HTMLLinkElement | undefined =>
  node instanceof HTMLLinkElement && /(^|\s)stylesheet(\s|$)/i.test(node.rel) && node.href ? node : undefined

const isStylePreload = (node: unknown): node is HTMLLinkElement =>
  node instanceof HTMLLinkElement && /(^|\s)preload(\s|$)/i.test(node.rel) && node.as === "style"

/** The stylesheets whose `@property` rules are in the document already, by address. */
const propertiesCopied = new Set<string>()

/** Copies a stylesheet's `@property` rules into the document, where alone they apply. */
function copyProperties(css: string, href: string) {
  if (propertiesCopied.has(href)) return
  propertiesCopied.add(href)
  const parsed = new CSSStyleSheet()
  parsed.replaceSync(css)
  const properties = new CSSStyleSheet()
  for (const rule of Array.from(parsed.cssRules)) if (rule instanceof CSSPropertyRule) properties.insertRule(rule.cssText, properties.cssRules.length)
  if (properties.cssRules.length) document.adoptedStyleSheets = [...document.adoptedStyleSheets, properties]
}

/** A `<style>` that will hold what `link` loads, and that stands in for it. */
function inlined(link: HTMLLinkElement): HTMLStyleElement {
  const style = document.createElement("style")
  for (const { name, value } of Array.from(link.attributes)) if (name.startsWith("data-")) style.setAttribute(name, value)
  const href = link.href
  fetch(href)
    .then((response) => response.text())
    .then((css) => {
      const absolute = absoluteUrls(css, href)
      style.textContent = absolute
      copyProperties(absolute, href)
      link.dispatchEvent(new Event("load"))
    })
    .catch((error) => {
      console.warn(`Annotator: could not load the stylesheet ${href}`, error)
      link.dispatchEvent(new Event("error"))
    })
  return style
}

/** A node as it is to be inserted: a stylesheet's link, swapped for its `<style>`; a stylesheet's preload, made a fetch's. */
const replacement = (node: Node): Node => {
  const link = stylesheetOf(node)
  if (link) return inlined(link)
  if (isStylePreload(node)) node.as = "fetch"
  return node
}

const appendChild = Node.prototype.appendChild
const insertBefore = Node.prototype.insertBefore
Node.prototype.appendChild = function <T extends Node>(this: Node, node: T): T {
  appendChild.call(this, replacement(node))
  return node
}
Node.prototype.insertBefore = function <T extends Node>(this: Node, node: T, child: Node | null): T {
  insertBefore.call(this, replacement(node), child)
  return node
}
for (const method of ["append", "prepend", "before", "after"] as const) {
  for (const prototype of [Element.prototype, DocumentFragment.prototype, Document.prototype, CharacterData.prototype] as any[]) {
    const original = prototype[method]
    if (!original) continue
    prototype[method] = function (this: unknown, ...nodes: (Node | string)[]) {
      return original.apply(this, nodes.map((node) => (typeof node === "string" ? node : replacement(node))))
    }
  }
}

/** Adds a stylesheet of the plugin's to the page, inlined, and resolves when it applies. */
export function addStylesheet(href: string): Promise<void> {
  const link = document.createElement("link")
  link.rel = "stylesheet"
  link.href = href
  const loaded = new Promise<void>((resolve) => {
    link.addEventListener("load", () => resolve(), { once: true })
    link.addEventListener("error", () => resolve(), { once: true })
  })
  document.head.appendChild(link)
  return loaded
}
