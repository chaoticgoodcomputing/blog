// remark plugin, run after every configured transformer's markdown plugins: turns MDX syntax into
// something remark-rehype understands. Imports are recorded and removed; each imported component
// becomes an empty island element for the bundler to fill; lowercase JSX becomes plain HTML.
// remark-rehype has no handler for MDX nodes, so anything left behind would vanish silently.
import { visit, SKIP, type VisitorResult } from "unist-util-visit"
import type { VFile } from "vfile"
import { evaluateAttributes, NotData } from "./props"

/** One widget use on one page, before bundling. */
export interface IslandUse {
  specifier: string
  /** `default`, or the named export. */
  imported: string
  props: Record<string, unknown>
  directive: string
}

export class MdxError extends Error {}

const isComponent = (name: string) => /^[A-Z]/.test(name) || name.includes(".")

function toText(node: any): string {
  const out: string[] = []
  visit(node, "text", (t: any) => {
    out.push(t.value)
  })
  return out.join(" ").replace(/\s+/g, " ").trim()
}

export function collectIslands() {
  return (tree: any, file: VFile) => {
    const imports = new Map<string, { specifier: string; imported: string }>()
    const uses: IslandUse[] = []
    const fail = (message: string): never => {
      throw new MdxError(`${file.data.relativePath}: ${message}`)
    }

    visit(tree, "mdxjsEsm", (node: any, index, parent: any): VisitorResult => {
      for (const statement of node.data?.estree?.body ?? []) {
        if (statement.type !== "ImportDeclaration") fail(`only \`import\` is supported in MDX, found \`${statement.type}\``)
        for (const spec of statement.specifiers) {
          if (spec.type === "ImportNamespaceSpecifier") fail(`namespace imports are not supported (\`${statement.source.value}\`)`)
          const imported = spec.type === "ImportDefaultSpecifier" ? "default" : spec.imported.name ?? spec.imported.value
          imports.set(spec.local.name, { specifier: statement.source.value, imported })
        }
      }
      parent.children.splice(index, 1)
      return [SKIP, index!]
    })

    const onJsx = (node: any, index: number | undefined, parent: any): VisitorResult => {
      if (!parent || index === undefined) return
      const inline = node.type === "mdxJsxTextElement"
      // A fragment contributes only its children.
      if (!node.name) {
        parent.children.splice(index, 1, ...node.children)
        return [SKIP, index!]
      }
      if (!isComponent(node.name)) {
        const { props } = evaluateAttributes(node.attributes)
        node.data = { hName: node.name, hProperties: props }
        return
      }
      const source = imports.get(node.name) ?? fail(`<${node.name}> is used but never imported`)
      let evaluated
      try {
        evaluated = evaluateAttributes(node.attributes)
      } catch (err) {
        if (err instanceof NotData) fail(`<${node.name}> ${err.message}`)
        throw err
      }
      // JSX children are flattened to text (ADR-0001's known limitation).
      const text = toText(node)
      if (text) evaluated.props.children = text
      uses.push({ ...source, ...evaluated })
      parent.children[index] = {
        type: "cgcIsland",
        children: [],
        data: {
          hName: inline ? "span" : "div",
          hProperties: { className: ["cgc-mdx-island"], dataCgcUse: uses.length - 1 },
        },
      }
      return SKIP
    }
    visit(tree, "mdxJsxFlowElement", onJsx)
    visit(tree, "mdxJsxTextElement", onJsx)
    // `{…}` in the body, including `{/* comments */}`: no evaluation context, so it is dropped.
    visit(tree, (node: any) => node.type === "mdxFlowExpression" || node.type === "mdxTextExpression", (_n, index, parent: any): VisitorResult => {
      parent.children.splice(index, 1)
      return [SKIP, index!]
    })

    file.data.cgcMdxUses = uses
  }
}
