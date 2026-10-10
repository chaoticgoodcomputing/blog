// Every component an MDX note imports is an island: drawn when the site builds, and hydrated in the
// browser once it scrolls into view.
//
// Astro hydrates a component only where the author writes a `client:` directive on it. The vault's
// notes don't: they are written as `<GameOfLife />`, and are still built by Quartz too, which knows
// no such attribute. So this plugin writes `client:visible` for them, on each use of a component the
// note imports. A note that writes a directive of its own keeps it.

import { defineHastPlugin, type HastVisitorContext, type PluginFactoryContext } from "satteri"

/** An attribute of a component's use in an MDX note, as a hast plugin is handed it. */
export interface JsxAttribute {
  type: string
  name?: string
  value?: unknown
}

/** A component's use in an MDX note, as a hast plugin is handed it. */
export interface JsxElement {
  name: string | null
  attributes: JsxAttribute[]
}

// `import A, { B, C as D } from "…"`, read from an MDX note's import lines. An Astro component has
// no client side to hydrate, so an import of one is left out.
export function importedComponents(source: string): Set<string> {
  const names = new Set<string>()
  for (const match of source.matchAll(/^import\s+([^;]+?)\s+from\s+["']([^"']+)["']/gm)) {
    const [, clause, from] = match
    if (from!.endsWith(".astro")) continue
    for (const part of clause!.replace(/[{}]/g, ",").split(",")) {
      const name = part.trim().split(/\s+as\s+/).at(-1)?.trim()
      if (name && /^[A-Z]/.test(name)) names.add(name)
    }
  }
  return names
}

/**
 * A hast plugin per document: a Markdown note has no components, so it gets none. It runs on the
 * HTML tree because that is where Sätteri lets a plugin set a JSX element's attribute, and before
 * Astro's own plugin reads the directives, since Astro runs a site's hast plugins first.
 */
export function islands() {
  return ({ source, sourceFormat }: PluginFactoryContext) => {
    if (sourceFormat !== "mdx") return null
    const components = importedComponents(source)
    if (components.size === 0) return null

    // Sätteri calls a JSX visitor only for the component names it is given.
    const filter = [...components]
    const visit = (node: JsxElement, ctx: HastVisitorContext) => {
      if (node.attributes.some((attribute) => attribute.name?.startsWith("client:"))) return
      ctx.setProperty(node as never, "client:visible", "")
    }

    return defineHastPlugin({
      name: "mdx-islands",
      mdxJsxFlowElement: { filter, visit: (node, ctx) => visit(node as JsxElement, ctx) },
      mdxJsxTextElement: { filter, visit: (node, ctx) => visit(node as JsxElement, ctx) },
    })
  }
}
