// The graph's text alternative (docs/adr/0002): everything a canvas draws, as a list inside it. A
// canvas's content is never rendered, but it is what assistive technology reads in the drawing's
// place, as HTML asks of a canvas. One item per node, linking to its page, with the nodes it has an
// edge to; the current page is marked as such, and a private page says so.
//
// The links are out of the tab order: nothing shows where they are, so a sighted keyboard user would
// be tabbing through invisible stops. A screen reader lists and follows them as any other links.
import type { GraphData, NodeData } from "./types"
import { element } from "./dom"

export function describe(
  canvas: HTMLCanvasElement,
  data: GraphData,
  current: string,
  global: boolean,
) {
  const here = data.nodes.find((node) => node.id === current)
  canvas.setAttribute(
    "aria-label",
    global ? "Graph of every page" : `Graph of the pages around ${here?.text ?? "this page"}`,
  )

  const targets = new Map<string, NodeData[]>()
  for (const { source, target } of data.links) {
    if (!targets.has(source.id)) targets.set(source.id, [])
    targets.get(source.id)!.push(target)
  }

  const list = element("ul", "cgc-graph__nodes")
  for (const node of data.nodes) {
    const item = element("li", "cgc-graph__node")
    item.dataset.node = node.id
    const link = element("a", "cgc-graph__node-link", node.text)
    link.href = node.href
    link.tabIndex = -1
    if (node.id === current) link.setAttribute("aria-current", "page")
    item.append(link)
    if (node.private) item.append(element("span", "cgc-graph__node-private", " (private)"))
    const edges = targets.get(node.id) ?? []
    if (edges.length > 0) {
      const nested = element("ul", "cgc-graph__edges")
      nested.setAttribute("aria-label", `${node.text} links to`)
      for (const target of edges) {
        const edge = element("li", "cgc-graph__edge", target.text)
        edge.dataset.node = target.id
        nested.append(edge)
      }
      item.append(nested)
    }
    list.append(item)
  }
  canvas.replaceChildren(list)
}
