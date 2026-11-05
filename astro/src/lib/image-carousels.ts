// Images written on adjacent lines, two or more with no blank line between them, are one carousel:
// a slide each, one in view at a time. Images with a blank line between them stay stacked, so a note
// says which it wants by how it is written; images on one line stay side by side, as Obsidian draws
// them.
//
// Adjacent lines are one paragraph, so a run is found in its paragraph. What else the paragraph says,
// a line of text before the images or after them, stays a paragraph of its own either side of the
// carousel, and the paragraph's block id stays on whichever part comes first.
//
// The carousel is the `<content-carousel>` element the site's other carousels are
// (src/components/Carousel.astro), with the same controls, so the same script steps through it
// (src/components/content-carousel.ts). Its look is a note's, src/styles/prose/image-carousels.css.
// Where nothing of the site runs, a feed reader or a Markdown copy, the buttons are left out and the
// images are what is left, stacked (src/lib/markdown-copies.ts, `NOT_TEXT`).

import { defineHastPlugin, type HastNode } from "satteri"
import { noteIcon } from "./icons.ts"

type Element = Extract<HastNode, { type: "element" }>
type ElementContent = Element["children"][number]
type Properties = NonNullable<Element["properties"]>

/** The class of an image carousel, beside its element's name. */
export const IMAGE_CAROUSEL = "image-carousel"

/** The fewest images that are a carousel. */
const FEWEST = 2

const isImage = (node: ElementContent): boolean => node.type === "element" && node.tagName === "img"

/** Whether `node` can stand between two images on adjacent lines: white space, or a line break. */
const isSpacing = (node: ElementContent): boolean =>
  (node.type === "text" && node.value.trim() === "") || (node.type === "element" && node.tagName === "br")

/** Whether what stands between two images puts them on separate lines. */
const breaksLine = (nodes: ElementContent[]): boolean =>
  nodes.some((node) => (node.type === "text" && node.value.includes("\n")) || (node.type === "element" && node.tagName === "br"))

/** A part of a paragraph: its images that are a carousel, or what else it says. */
type Part = { images: ElementContent[] } | { content: ElementContent[] }

/** The parts of a paragraph's children, or none when it has no run of images. */
function partsOf(children: ElementContent[]): Part[] | undefined {
  const parts: Part[] = []
  let content: ElementContent[] = []
  let found = false

  let at = 0
  while (at < children.length) {
    const images = [children[at]!]
    let end = at + 1
    if (isImage(children[at]!)) {
      // Past the spacing after the last image, to another image on the next line.
      for (;;) {
        let next = end
        while (next < children.length && isSpacing(children[next]!)) next++
        if (next >= children.length || !isImage(children[next]!) || !breaksLine(children.slice(end, next))) break
        images.push(children[next]!)
        end = next + 1
      }
    }

    if (images.length >= FEWEST) {
      if (content.length) parts.push({ content })
      parts.push({ images })
      content = []
      found = true
    } else {
      content.push(...children.slice(at, end))
    }
    at = end
  }
  if (content.length) parts.push({ content })
  return found ? parts : undefined
}

/** `nodes` without the white space at either end, which was the line break beside a carousel. */
function trimmed(nodes: ElementContent[]): ElementContent[] {
  const result = [...nodes]
  const first = result[0]
  if (first?.type === "text") result[0] = { ...first, value: first.value.replace(/^\s+/, "") }
  const last = result.at(-1)
  if (last?.type === "text") result[result.length - 1] = { ...last, value: last.value.replace(/\s+$/, "") }
  return result.filter((node) => !(node.type === "text" && node.value === "") && !(node.type === "element" && node.tagName === "br"))
}

const button = (properties: Properties, children: ElementContent[] = []): Element => ({
  type: "element",
  tagName: "button",
  properties: { type: "button", ...properties },
  children,
})

/** A carousel of `images`, with `properties` of its own: the block id of the paragraph it was. */
export function imageCarousel(images: ElementContent[], properties: Properties = {}): Element {
  const count = images.length
  const arrow = (step: number, label: string, icon: string) =>
    button({ "data-step": String(step), "aria-label": label, title: label }, [
      noteIcon(icon, { width: "20", height: "20", "aria-hidden": "true" }),
    ])
  const dots = images.map((_, index) => {
    const label = `Image ${index + 1} of ${count}`
    return button({ className: ["dot"], "data-index": String(index), "aria-label": label, title: label })
  })
  const slides = images.map(
    (image, index): Element => ({
      type: "element",
      tagName: "div",
      properties: { className: ["slide"], role: "group", "aria-roledescription": "slide", "aria-label": `${index + 1} of ${count}` },
      children: [image],
    }),
  )

  return {
    type: "element",
    tagName: "content-carousel",
    properties: {
      ...properties,
      className: [IMAGE_CAROUSEL, ...(Array.isArray(properties.className) ? properties.className : [])],
      role: "region",
      "aria-roledescription": "carousel",
      "aria-label": "Images",
    },
    children: [
      {
        type: "element",
        tagName: "div",
        properties: { className: ["controls"] },
        children: [
          arrow(-1, "Previous image", "chevron-left"),
          { type: "element", tagName: "div", properties: { className: ["dots"] }, children: dots },
          arrow(1, "Next image", "chevron-right"),
        ],
      },
      { type: "element", tagName: "div", properties: { className: ["track"] }, children: slides },
    ],
  }
}

export function imageCarousels() {
  return defineHastPlugin({
    name: "image-carousels",
    element: {
      filter: ["p"],
      visit(node, ctx) {
        const parts = partsOf(node.children)
        if (!parts) return

        // The paragraph's own attributes, its block id, go to its first part.
        const own = node.properties ?? {}
        const replacement: Element[] = []
        for (const part of parts) {
          const properties = replacement.length === 0 ? own : {}
          if ("images" in part) {
            replacement.push(imageCarousel(part.images, properties))
          } else {
            const content = trimmed(part.content)
            if (content.length) replacement.push({ type: "element", tagName: "p", properties, children: content })
          }
        }
        ctx.replaceNode(node, replacement)
      },
    },
  })
}
