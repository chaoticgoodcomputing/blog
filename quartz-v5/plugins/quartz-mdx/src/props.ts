// Island props are data, evaluated statically from the expression tree remark-mdx already parsed —
// never through `eval`, and not through JSON.parse, which live pages' unquoted keys and comments
// would fail. Anything that is not a literal fails the build (ADR-0002).
import type { Expression, Node, Property, SpreadElement } from "estree"
import type { Directive } from "@chaoticgoodcomputing/island-runtime"

export class NotData extends Error {}

type Data = null | boolean | number | string | Data[] | { [key: string]: Data }

export function evaluate(node: Node): Data {
  switch (node.type) {
    case "Literal":
      if (node.value instanceof RegExp || typeof node.value === "bigint") break
      return node.value as Data
    case "TemplateLiteral":
      if (node.expressions.length) break
      return node.quasis.map((q) => q.value.cooked ?? q.value.raw).join("")
    case "UnaryExpression": {
      const value = evaluate(node.argument)
      if (node.operator === "-" && typeof value === "number") return -value
      if (node.operator === "+" && typeof value === "number") return value
      break
    }
    case "ArrayExpression":
      return node.elements.map((el) => {
        if (el === null || el.type === "SpreadElement") throw new NotData("holes and spreads are not data")
        return evaluate(el)
      })
    case "ObjectExpression":
      return Object.fromEntries(node.properties.map((prop: Property | SpreadElement) => {
        if (prop.type !== "Property" || prop.kind !== "init" || prop.method || prop.computed) {
          throw new NotData("only plain `key: value` properties are data")
        }
        const key = prop.key.type === "Identifier" ? prop.key.name : String(evaluate(prop.key))
        return [key, evaluate(prop.value)]
      }))
  }
  throw new NotData(`\`${node.type}\` is not data`)
}

/** The props of one JSX element, from mdast-util-mdx-jsx attributes. */
export function evaluateAttributes(attributes: any[]): { props: Record<string, Data>; directive: Directive } {
  const props: Record<string, Data> = {}
  let directive = "load"
  for (const attr of attributes) {
    if (attr.type !== "mdxJsxAttribute") throw new NotData("spread attributes are not data")
    if (attr.name.startsWith("client:")) {
      directive = attr.name.slice("client:".length)
      continue
    }
    const value = attr.value
    if (value === null || value === undefined) props[attr.name] = true
    else if (typeof value === "string") props[attr.name] = value
    else {
      const program = value.data?.estree
      const statement = program?.body?.[0]
      if (statement?.type !== "ExpressionStatement") throw new NotData(`prop \`${attr.name}\` has no expression`)
      try {
        props[attr.name] = evaluate(statement.expression as Expression)
      } catch (err) {
        if (err instanceof NotData) throw new NotData(`prop \`${attr.name}\`: ${err.message}`)
        throw err
      }
    }
  }
  if (directive !== "load" && directive !== "visible") throw new NotData(`unknown directive \`client:${directive}\``)
  return { props, directive }
}
