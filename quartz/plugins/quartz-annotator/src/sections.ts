// An annotation page's own markdown, around its annotations: the **preface** and the **epilogue**
// (CONTEXT.md), in the interim format of docs/adr/0005. The page is cut by H1 markers whose text is
// exactly `Preface`, `Epilogue` or `Annotations`, ignoring case; text before any marker is the
// preface. The markers aren't rendered, and prose under `Annotations` that isn't an annotation block
// is left out.
//
// Both stay in the page's own tree, which the site's whole pipeline renders as it renders any note's
// body, so what they link to and say is counted as a note's is. The markdown pass puts them in order
// with an empty element between them, where the page body cuts the rendered tree in two.

/** The hast property of the element that marks where the epilogue starts. */
export const EPILOGUE_MARK = "dataCgcAnnotatorEpilogue"

type Section = "preface" | "epilogue" | "annotations"

interface MdastNode {
  type: string
  depth?: number
  value?: string
  children?: MdastNode[]
  data?: Record<string, unknown>
}

const text = (node: MdastNode): string => node.value ?? (node.children ?? []).map(text).join("")

// The section an H1 marker opens, or none for any other node.
function marker(node: MdastNode): Section | undefined {
  if (node.type !== "heading" || node.depth !== 1) return undefined
  const name = text(node).trim().toLowerCase()
  return name === "preface" || name === "epilogue" || name === "annotations" ? name : undefined
}

export interface Cut {
  /** The page's nodes in order: the preface, the epilogue mark, then the epilogue. */
  children: MdastNode[]
  /** Whether there was prose under `Annotations`, which is left out. */
  stray: boolean
  /** The markers that appear more than once, whose text joins their first section. */
  repeated: string[]
}

/** Cuts a page's top-level nodes, its annotation blocks already taken out, into its sections. */
export function cut(children: MdastNode[]): Cut {
  const sections: Record<Section, MdastNode[]> = { preface: [], epilogue: [], annotations: [] }
  const seen = new Set<Section>()
  const repeated = new Set<string>()
  let current: Section = "preface"
  for (const node of children) {
    const opens = marker(node)
    if (opens) {
      if (seen.has(opens)) repeated.add(opens)
      seen.add(opens)
      current = opens
    } else sections[current].push(node)
  }
  const mark: MdastNode = { type: "cgcAnnotatorEpilogue", data: { hName: "div", hProperties: { [EPILOGUE_MARK]: "" } } }
  return {
    children: [...sections.preface, mark, ...sections.epilogue],
    stray: sections.annotations.length > 0,
    repeated: [...repeated].map((name) => name[0].toUpperCase() + name.slice(1)),
  }
}

interface HastNode {
  type: string
  properties?: Record<string, unknown>
  children?: HastNode[]
}

/** A page's rendered tree cut at the epilogue mark: the preface's nodes, and the epilogue's. */
export function split(tree: { children?: HastNode[] } | undefined): { preface: HastNode[]; epilogue: HastNode[] } {
  const children = tree?.children ?? []
  const at = children.findIndex((node) => node.type === "element" && node.properties?.[EPILOGUE_MARK] !== undefined)
  return at === -1 ? { preface: children, epilogue: [] } : { preface: children.slice(0, at), epilogue: children.slice(at + 1) }
}

/** Whether a section has anything to show: an element, or text that isn't only whitespace. */
export const hasContent = (nodes: HastNode[]) =>
  nodes.some((node) => node.type === "element" || (node.type === "text" && ((node as { value?: string }).value ?? "").trim() !== ""))
