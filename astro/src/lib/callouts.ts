// A callout's title begins with its kind's icon, and a callout that folds ends its title with a fold
// icon, as on the Quartz site (src/styles/prose/note-body.css colours each kind).
//
// The library makes a callout of a quote and names its type as written, `data-callout="faq"`
// (the library's callouts.ts). Obsidian draws several types as one kind, `faq` as a question and a
// type it doesn't know as a note, so this says which kind a callout is drawn as,
// `data-callout-kind`, and the stylesheet reads that alone. The icons are Material Design Icons',
// written as elements as a heading's anchor is (src/lib/icons.ts, docs/adr/3402), and hidden from a
// screen reader: the title says what the callout is. It is the site's choice how a callout is drawn,
// not Obsidian's, so it is the site's plugin and not the library's.

import { defineHastPlugin } from "satteri"
import { noteIcon } from "./icons.ts"

/** Each kind a callout is drawn as, with its icon from Material Design Icons. */
const KINDS = {
  note: "pencil-outline",
  abstract: "clipboard-text-outline",
  info: "information-outline",
  todo: "check-circle-outline",
  tip: "fire",
  success: "check",
  question: "help-circle-outline",
  warning: "alert-outline",
  failure: "close",
  danger: "lightning-bolt",
  bug: "bug-outline",
  example: "format-list-bulleted",
  quote: "format-quote-close",
} as const
type Kind = keyof typeof KINDS

/** The types Obsidian draws as another kind (Obsidian's help, "Callouts", "Supported types"). */
const ALIASES: Record<string, Kind> = {
  summary: "abstract",
  tldr: "abstract",
  hint: "tip",
  important: "tip",
  check: "success",
  done: "success",
  help: "question",
  faq: "question",
  caution: "warning",
  attention: "warning",
  fail: "failure",
  missing: "failure",
  error: "danger",
  cite: "quote",
}

/** The kind a type is drawn as: its own, the one Obsidian reads it as, or a note's. */
const kindOf = (type: string): Kind => (Object.hasOwn(KINDS, type) ? (type as Kind) : (ALIASES[type] ?? "note"))

export function calloutIcons() {
  return defineHastPlugin({
    name: "callout-icons",
    element: {
      filter: ["div", "details"],
      visit(node, ctx) {
        const classes = node.properties?.className
        const type = node.properties?.["data-callout"]
        if (!Array.isArray(classes) || !classes.includes("callout") || typeof type !== "string") return
        const title = node.children.find((child) => child.type === "element")
        if (title?.type !== "element") return

        const kind = kindOf(type)
        ctx.setProperty(node, "data-callout-kind", kind)
        ctx.prependChild(title, noteIcon(KINDS[kind], { className: "callout-icon", ariaHidden: "true" }))
        if (node.tagName === "details") {
          ctx.appendChild(title, noteIcon("chevron-down", { className: "callout-fold", ariaHidden: "true" }))
        }
      },
    },
  })
}
