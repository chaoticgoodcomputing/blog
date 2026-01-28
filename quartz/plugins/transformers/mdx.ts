import { QuartzTransformerPlugin } from "../types"
import remarkMdx from "remark-mdx"
import { visit } from "unist-util-visit"
import { getWidget } from "../../widgets/registry"
import { getContentWidget } from "../../../content/public/widgets/registry"
import { renderToString } from "preact-render-to-string"
import type { WidgetDefinition } from "../../widgets/types"

/**
 * MDX transformer plugin for Quartz.
 * 
 * Features:
 * - Parses .mdx files using remark-mdx
 * - Detects widget imports (e.g., import { PDFViewer } from '@widgets/pdf-viewer')
 * - Renders widget JSX to static HTML placeholders at build time
 * - Injects widget scripts into pageResources for per-page loading
 * 
 * Usage in quartz.config.ts:
 * ```typescript
 * transformers: [
 *   Plugin.FrontMatter(),
 *   Plugin.MDX(), // Add after FrontMatter
 *   // ...
 * ]
 * ```
 */

/**
 * Get a widget from either the global or content registry.
 */
function getWidgetFromAnyRegistry(importPath: string): WidgetDefinition | undefined {
  // Try global widgets first
  const globalWidget = getWidget(importPath)
  if (globalWidget) return globalWidget
  
  // Try content widgets
  const contentWidget = getContentWidget(importPath)
  if (contentWidget) return contentWidget
  
  return undefined
}

export const MDX: QuartzTransformerPlugin = () => {
  return {
    name: "MDX",
    markdownPlugins(ctx) {
      // Use remarkMdx for ALL files (.md and .mdx)
      // MDX properly handles standard HTML elements like <iframe> when
      // remark-rehype is configured with passThrough option
      return [
        remarkMdx,
        () => {
          return (tree, file) => {
            // Only process widgets in .mdx files
            const filePath = file.path?.toString() || ""
            if (!filePath.endsWith(".mdx")) {
              return
            }

            const usedWidgets = new Set<string>()
            const importNodesToRemove: any[] = []
            const componentNameToWidgetPath = new Map<string, string>()
            
            // Track widget imports (both global and vault-specific)
            visit(tree, "mdxjsEsm", (node: any, index, parent) => {
              // Look for imports from @widgets/* or @content/widgets/*
              if (node.data?.estree?.body) {
                for (const statement of node.data.estree.body) {
                  if (statement.type === "ImportDeclaration") {
                    const source = statement.source.value
                    if (typeof source === "string" && 
                        (source.startsWith("@widgets/") || source.startsWith("@content/widgets/"))) {
                      usedWidgets.add(source)
                      
                      // Map imported component names to their widget paths
                      // e.g., import { Counter } from '@widgets/counter' → Map("Counter" => "@widgets/counter")
                      for (const specifier of statement.specifiers) {
                        if (specifier.type === "ImportSpecifier") {
                          const componentName = specifier.imported?.name || specifier.local?.name
                          if (componentName) {
                            componentNameToWidgetPath.set(componentName, source)
                          }
                        }
                      }
                      
                      // Mark this import node for removal
                      if (parent && index !== undefined) {
                        importNodesToRemove.push({ node, index, parent })
                      }
                    }
                  }
                }
              }
            })

            // Remove widget import statements by filtering the root children
            // (Don't use indices from visit since tree structure changes)
            if (importNodesToRemove.length > 0) {
              const nodesToRemove = new Set(importNodesToRemove.map(n => n.node))
              for (const {parent} of importNodesToRemove) {
                parent.children = parent.children.filter((child: any) => !nodesToRemove.has(child))
              }
            }

            // Collect widget JSX elements to transform
            const jsxNodesToReplace: Array<{
              node: any
              index: number
              parent: any
              html: string
            }> = []

            // Find and render all widget JSX elements
            visit(tree, "mdxJsxFlowElement", (node: any, index, parent) => {
              if (!parent || index === undefined) return

              const widgetName = node.name
              if (!widgetName) return
              
              // Check if this JSX element corresponds to an imported widget
              const widgetPath = componentNameToWidgetPath.get(widgetName)
              if (!widgetPath) return
              
              const widget = getWidgetFromAnyRegistry(widgetPath)
              if (!widget) return

              // Render widget component to static HTML
              const props: Record<string, any> = {}
              
              if (node.attributes) {
                for (const attr of node.attributes) {
                  if (attr.type === "mdxJsxAttribute") {
                    const name = attr.name
                    let value = attr.value

                    // Handle different value types
                    if (value && typeof value === "object" && value.type === "mdxJsxAttributeValueExpression") {
                      // Expression value - try to evaluate
                      value = value.data?.estree?.body?.[0]?.expression?.value
                    }

                    props[name] = value
                  }
                }
              }

              // Render the widget placeholder component
              const html = renderToString(widget.Component(props))
              
              // Store replacement information
              jsxNodesToReplace.push({ node, index, parent, html })
            })

            // Apply all replacements after traversal is complete
            for (const { index, parent, html } of jsxNodesToReplace) {
              parent.children[index] = {
                type: "html",
                value: html,
              } as any
            }

            // Add widget scripts to page resources
            if (usedWidgets.size > 0) {
              file.data.pageResources ??= {}
              file.data.pageResources.js ??= []

              for (const widgetPath of usedWidgets) {
                const widget = getWidgetFromAnyRegistry(widgetPath)
                if (widget) {
                  file.data.pageResources.js.push({
                    src: `/static/widgets/${widget.scriptName}.js`,
                    loadTime: "afterDOMReady",
                    contentType: "external",
                    spaPreserve: false,
                  })

                  // Add CSS if the widget has it
                  if (widget.css) {
                    file.data.pageResources.css ??= []
                    file.data.pageResources.css.push({
                      content: `/static/widgets/${widget.scriptName}.css`,
                    })
                  }
                }
              }
            }
          }
        },
      ]
    },
  }
}
