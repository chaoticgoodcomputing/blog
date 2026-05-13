import { QuartzTransformerPlugin } from "../types"
import { visit } from "unist-util-visit"
import isAbsoluteUrl from "is-absolute-url"
import { FullSlug, SimpleSlug, simplifySlug } from "../../util/path"
import { Root, Element } from "hast"

const offSiteIcon: Element = {
  type: "element",
  tagName: "svg",
  properties: {
    "aria-hidden": "true",
    class: "external-icon",
    style: "max-width:0.8em;max-height:0.8em",
    viewBox: "0 0 512 512",
  },
  children: [
    {
      type: "element",
      tagName: "path",
      properties: {
        d: "M320 0H288V64h32 82.7L201.4 265.4 178.7 288 224 333.3l22.6-22.6L448 109.3V192v32h64V192 32 0H480 320zM32 32H0V64 480v32H32 456h32V480 352 320H424v32 96H64V96h96 32V32H160 32z",
      },
      children: [],
    },
  ],
}

function setClasses(node: Element, classes: string[]) {
  node.properties = node.properties ?? {}
  node.properties.className = Array.from(new Set(classes))
}

function hasExternalIcon(node: Element): boolean {
  return node.children.some(
    (child) =>
      child.type === "element" &&
      child.tagName === "svg" &&
      Array.isArray((child.properties?.className as unknown[]) ?? []) &&
      ((child.properties?.class as string) ?? "").includes("external-icon"),
  )
}

export const ExternalCrossGraph: QuartzTransformerPlugin = () => {
  return {
    name: "ExternalCrossGraph",
    htmlPlugins(ctx) {
      const urlToSlug = ctx.externalUrlMap
      const slugToUrl = new Map<FullSlug, string>()
      for (const [url, slug] of urlToSlug) {
        slugToUrl.set(slug, url)
      }

      return [
        () => {
          return (tree: Root, file) => {
            if (urlToSlug.size === 0) return

            const additionalLinks: SimpleSlug[] = []

            visit(tree, "element", (node) => {
              if (
                node.tagName !== "a" ||
                !node.properties ||
                typeof node.properties.href !== "string"
              )
                return

              const href = node.properties.href
              const classes = ((node.properties.className as string[]) ?? []).slice()

              // Forward pass: absolute URL that matches an external manifest entry.
              if (isAbsoluteUrl(href, { httpOnly: false })) {
                const slug = urlToSlug.get(href)
                if (slug !== undefined) {
                  classes.push("cross-graph")
                  setClasses(node, classes)
                  node.properties["data-slug"] = slug
                  additionalLinks.push(simplifySlug(slug))
                }
                return
              }

              // Reverse pass: internal link whose resolved slug is an external node.
              const dataSlug = node.properties["data-slug"] as FullSlug | undefined
              if (dataSlug && slugToUrl.has(dataSlug)) {
                const externalUrl = slugToUrl.get(dataSlug)!
                node.properties.href = externalUrl
                const filtered = classes.filter((c) => c !== "internal")
                filtered.push("external", "cross-graph")
                setClasses(node, filtered)
                if (!hasExternalIcon(node)) {
                  node.children.push(structuredClone(offSiteIcon))
                }
              }
            })

            if (additionalLinks.length > 0) {
              const existing = file.data.links ?? []
              file.data.links = Array.from(new Set([...existing, ...additionalLinks]))
            }
          }
        },
      ]
    },
  }
}
