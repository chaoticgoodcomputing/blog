// A quote is any of the ways a note gives words as someone else's: a blockquote, a quote callout,
// `[!QUOTE]` (or `[!CITE]`), and a paraphrase, `[!PARAPHRASE]` (src/lib/callouts.ts). However it is
// framed, its words are set alike: this marks each one `quote`, and what holds its words, the
// blockquote itself or the callout's content, `quote-body`, the one element whose text the
// stylesheet sets (src/styles/prose/note-body.css). A kind draws its frame, never its words.
//
// A quote that ends with who said it, a paragraph that begins with a dash, `-- Someone (2026)`, has
// that paragraph marked `quote-attribution`, set apart from the words above it. The dash is as the
// note wrote it: `--` or `—` written, or the `–` that typography makes of `--`.

import { defineHastPlugin } from "satteri"
import { calloutLook } from "./callouts.ts"

/** The callout kinds that are quotes (src/lib/callouts.ts). */
const QUOTE_KINDS = new Set(["quote", "paraphrase"])

/** A paragraph that says who said a quote: it begins with a dash and a space. */
const ATTRIBUTION = /^\s*(?:--|[–—])\s/

type Element = { type: "element"; tagName: string; properties?: Record<string, unknown>; children: Node[] }
type Node = Element | { type: string; value?: string; children?: Node[] }

const isElement = (node: Node): node is Element => node.type === "element"

const classesOf = (node: Element): string[] => {
  const classes = node.properties?.className
  return Array.isArray(classes) ? classes.map(String) : []
}

const withClass = (node: Element, name: string): string[] => {
  const own = classesOf(node)
  return own.includes(name) ? own : [...own, name]
}

/** The text a node holds, its own and its descendants'. */
const textOf = (node: Node): string =>
  "value" in node && typeof node.value === "string" ? node.value : (node.children ?? []).map(textOf).join("")

/** A quote's attribution: its last element, when that is a paragraph beginning with a dash. */
function attributionOf(body: Element): Element | undefined {
  const last = body.children.filter(isElement).at(-1)
  return last?.tagName === "p" && ATTRIBUTION.test(textOf(last)) ? last : undefined
}

/** A quote callout's content: the element after its title. */
const contentOf = (callout: Element): Element | undefined =>
  callout.children.filter(isElement).find((child) => classesOf(child).includes("callout-content"))

/** Whether an element is a callout that is a quote, of the type its `data-callout` names. */
function isQuoteCallout(node: Element): boolean {
  const type = node.properties?.dataCallout ?? node.properties?.["data-callout"]
  return classesOf(node).includes("callout") && typeof type === "string" && QUOTE_KINDS.has(calloutLook(type).kind)
}

/**
 * Marks a quote, its body and its attribution, on a callout another plugin makes in the same pass,
 * which `quotes` doesn't visit: a web page's passage's (src/lib/annotations.ts).
 */
export function markQuote(callout: Element): void {
  const body = contentOf(callout)
  if (!body) return
  callout.properties = { ...callout.properties, className: withClass(callout, "quote") }
  body.properties = { ...body.properties, className: withClass(body, "quote-body") }
  const attribution = attributionOf(body)
  if (attribution) attribution.properties = { ...attribution.properties, className: withClass(attribution, "quote-attribution") }
}

export function quotes() {
  return defineHastPlugin({
    name: "quotes",
    element: {
      filter: ["blockquote", "div", "details"],
      visit(node, ctx) {
        const element = node as unknown as Element
        let body: Element | undefined
        if (element.tagName === "blockquote") body = element
        else if (isQuoteCallout(element)) body = contentOf(element)
        if (!body) return

        if (body === element) ctx.setProperty(node, "className", [...withClass(element, "quote"), "quote-body"])
        else {
          ctx.setProperty(node, "className", withClass(element, "quote"))
          ctx.setProperty(body as never, "className", withClass(body, "quote-body"))
        }
        const attribution = attributionOf(body)
        if (attribution) ctx.setProperty(attribution as never, "className", withClass(attribution, "quote-attribution"))
      },
    },
  })
}
