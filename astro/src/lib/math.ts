// Math, typeset by KaTeX when the site builds, so a reader's browser runs no script for it: it needs
// KaTeX's stylesheet and fonts, and only on a page with math (src/components/MathStylesheet.astro).
//
// The library marks math as remark-math does, `<code class="language-math math-inline">` or
// `math-display`, with a block's inside a `<pre>`, having decided by Obsidian's rule which dollar
// signs are math. This plugin replaces each with KaTeX's HTML, as rehype-katex does on the unified
// pipeline: Astro 7's way to such a rehype plugin is a Sätteri HAST plugin of the same job.

import GithubSlugger from "github-slugger"
import katex from "katex"
import { defineHastPlugin, htmlToHast, type HastNode, type HastVisitorContext } from "satteri"

/** The key a rendered note's frontmatter carries, true when the note has math. */
const HAS_MATH = "hasMath"

/** Whether a note has math, from the frontmatter its render hands back (`remarkPluginFrontmatter`). */
export const hasMath = (frontmatter: Record<string, unknown> | undefined): boolean => frontmatter?.[HAS_MATH] === true

const HEADING = /^h[1-6]$/

type Element = HastNode & { type: "element"; tagName: string; properties?: Record<string, unknown> }
const isElement = (node: HastNode): node is Element => node.type === "element"
const childrenOf = (node: HastNode): HastNode[] => ("children" in node ? (node.children as HastNode[]) : [])
const isMath = (node: HastNode): boolean => {
  const classes = isElement(node) ? node.properties?.className : undefined
  return node.type === "element" && node.tagName === "code" && Array.isArray(classes) && classes.includes("language-math")
}
const textOf = (node: HastNode): string =>
  node.type === "text" ? (node as { value: string }).value : childrenOf(node).map(textOf).join("")
const has = (node: HastNode, test: (node: HastNode) => boolean): boolean =>
  test(node) || childrenOf(node).some((child) => has(child, test))

/**
 * Every heading's anchor, in a note where a heading has math: Astro gives a heading with no id the
 * slug of its text once every plugin has run, and by then a formula's text is KaTeX's, its MathML,
 * its TeX and its glyphs run together. So here, before the math is typeset, each heading with no id
 * is given the one Astro would give it from its text with the math as written, which is the anchor
 * a link to the heading is given. Every heading, so each is numbered among the others as Astro
 * numbers them; one that already has an id, an embedded note's, is passed over, as Astro passes it.
 */
function identifyHeadings(root: HastNode, ctx: HastVisitorContext): void {
  const headings: Element[] = []
  const collect = (node: HastNode) => {
    if (isElement(node) && HEADING.test(node.tagName)) headings.push(node)
    else childrenOf(node).forEach(collect)
  }
  collect(root)
  if (!headings.some((heading) => has(heading, isMath))) return
  const slugger = new GithubSlugger()
  for (const heading of headings) {
    if (typeof heading.properties?.id === "string") continue
    ctx.setProperty(heading, "id", slugger.slug(textOf(heading)))
  }
}

/** KaTeX's HTML, as elements. Its `<math>` carries no `xmlns`: HTML puts it in MathML's namespace. */
function typeset(html: string): HastNode[] {
  const fragment = htmlToHast(html, { fragment: true }) as HastNode & { children: HastNode[] }
  const strip = (node: HastNode) => {
    if (isElement(node) && node.tagName === "math" && node.properties) {
      const { ":xmlns": _namespaced, xmlns: _plain, ...properties } = node.properties
      node.properties = properties
    }
    childrenOf(node).forEach(strip)
  }
  fragment.children.forEach(strip)
  return fragment.children
}

export function math() {
  return defineHastPlugin({
    name: "math",
    before: identifyHeadings,
    element: {
      filter: ["code"],
      visit(node, ctx) {
        if (!isMath(node)) return
        const displayMode = (node.properties.className as string[]).includes("math-display")
        // A mistake in a note's math is shown in place, in KaTeX's error colour, not a failed build.
        const html = katex.renderToString(ctx.textContent(node), { displayMode, throwOnError: false })

        // HTML parsed into elements here, since an MDX note can hold no raw HTML.
        const parent = ctx.parent(node)
        const block = parent?.type === "element" && parent.tagName === "pre"
        ctx.replaceNode(block ? parent : node, typeset(html))

        // Astro hands a plugin the note's frontmatter, and the page reads it back after rendering.
        const frontmatter = ctx.data.astro?.frontmatter
        if (frontmatter) frontmatter[HAS_MATH] = true
      },
    },
  })
}
