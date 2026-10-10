// What the syntax plugins share: a loose node type, and the few tree operations Sätteri's context
// doesn't have. Sätteri keeps the tree in Rust, so a plugin never edits a node in place: it reads
// nodes and records mutations on the context. A new node may hold existing nodes as children, which
// places them there.

import type { MdastVisitorContext } from "satteri"
import type { Position } from "../types.ts"

export type Ctx = MdastVisitorContext

export interface Node {
  type: string
  children?: Node[]
  value?: string
  data?: Record<string, any> | null
  position?: Position
  [key: string]: unknown
}

export const text = (value: string): Node => ({ type: "text", value })

export const isParent = (node: Node): node is Node & { children: Node[] } =>
  Array.isArray(node.children)

// The fields mdast nodes carry besides `type`, `children` and `position`. A node Sätteri hands a
// plugin has internals of its own beside these, so a copy takes the fields by name.
const FIELDS = [
  "value", "depth", "ordered", "start", "spread", "checked", "url", "title", "alt", "lang", "meta",
  "align", "identifier", "label", "referenceType", "name", "attributes", "data",
] as const

/** A new node like `node`, with `changes` made: its children only if `changes` gives them. */
export function copyOf(node: Node, changes: Partial<Node> = {}): Node {
  const copy: Node = { type: node.type }
  for (const field of FIELDS) {
    const value: unknown = node[field]
    if (value !== undefined && value !== null) (copy as Record<string, unknown>)[field] = value
  }
  return { ...copy, ...changes }
}

/** A new node like `node`, holding `children`. */
export function cloneWith(node: Node, children: Node[]): Node {
  return copyOf(node, { children })
}

/** `node.data` with `extra` merged in, `hProperties` merged one level deeper. */
export function mergeData(node: Node, extra: Record<string, any>): Record<string, any> {
  const data = node.data ?? {}
  return {
    ...data,
    ...extra,
    ...(data.hProperties || extra.hProperties
      ? { hProperties: { ...data.hProperties, ...extra.hProperties } }
      : {}),
  }
}

/**
 * Rewrite children across a whole tree, bottom-up. `rewrite` gets each parent with its children and
 * returns the new list, or undefined to leave them. A parent that is rewritten takes its changed
 * descendants along as copies, so each changed subtree is recorded as one mutation, at its top, and
 * no mutation depends on another's.
 */
export function rewriteChildren(
  root: Node,
  ctx: Ctx,
  rewrite: (parent: Node, children: Node[]) => Node[] | undefined,
  skip: (node: Node) => boolean = () => false,
): void {
  interface Visited {
    /** The node itself when nothing under it changed, otherwise a copy holding the changes. */
    value: Node
    /** The mutations that make the changes, if no ancestor is rewritten. */
    pending: (() => void)[]
  }

  const visit = (node: Node): Visited => {
    if (!isParent(node) || skip(node)) return { value: node, pending: [] }
    const original = node.children
    const visited = new Map(original.map((child) => [child, visit(child)]))
    const rewritten = rewrite(node, original)
    if (rewritten) {
      const children = rewritten.map((child) => visited.get(child)?.value ?? child)
      return {
        value: cloneWith(node, children),
        pending: [() => ctx.setProperty(node as never, "children", children as never)],
      }
    }
    const children = original.map((child) => visited.get(child)!.value)
    const changed = children.some((child, index) => child !== original[index])
    return {
      value: changed ? cloneWith(node, children) : node,
      pending: original.flatMap((child) => visited.get(child)!.pending),
    }
  }

  for (const apply of visit(root).pending) apply()
}
