// Reading a drawn graph the ways a reader can, for the specs beside it:
//
// - its **text alternative**, the list of nodes and edges the plugin writes inside each canvas for
//   whoever can't see it (docs/adr/0002);
// - the **tooltip** a canvas shows while the pointer is over a node: that node's label.
import { expect } from "../../../tests/harness/test.mjs"

/** The local graph, in the page's layout, and the global graph, in its dialog. */
export const localGraph = (page) => page.locator(".cgc-graph__local")
export const globalGraph = (page) => page.locator(".cgc-graph__global")

/**
 * The graph a container shows, from its text alternative: each node by id, with its label, whether
 * it is the current page or a private one, and the ids of the nodes it has an edge to. Waits for the
 * graph to be drawn.
 */
export async function drawnGraph(container) {
  await expect(container.locator(".cgc-graph__nodes")).toBeAttached()
  return container.locator(".cgc-graph__canvas").evaluate((canvas) => {
    const nodes = {}
    for (const item of canvas.querySelectorAll(".cgc-graph__node")) {
      const link = item.querySelector(".cgc-graph__node-link")
      nodes[item.dataset.node] = {
        label: link.textContent,
        href: link.getAttribute("href"),
        current: link.getAttribute("aria-current") === "page",
        private: item.querySelector(".cgc-graph__node-private") !== null,
        edges: [...item.querySelectorAll(".cgc-graph__edge")].map((edge) => edge.dataset.node),
      }
    }
    return nodes
  })
}

/**
 * Where the node labelled `label` is drawn, in viewport pixels, once the layout has settled: the
 * centre of the points where the canvas's tooltip names it. Found by moving a pointer over the
 * canvas inside the page, which is fast enough to sweep it whole.
 */
export async function nodePosition(container, label) {
  const canvas = container.locator(".cgc-graph__canvas")
  let last = null
  for (let attempt = 0; attempt < 60; attempt++) {
    const at = await canvas.evaluate((canvas, label) => {
      const rect = canvas.getBoundingClientRect()
      let [x, y, hits] = [0, 0, 0]
      for (let py = rect.top + 1; py < rect.bottom; py += 2) {
        for (let px = rect.left + 1; px < rect.right; px += 2) {
          canvas.dispatchEvent(
            new MouseEvent("mousemove", { clientX: px, clientY: py, bubbles: true }),
          )
          if (canvas.title === label) [x, y, hits] = [x + px, y + py, hits + 1]
        }
      }
      canvas.dispatchEvent(new MouseEvent("mouseleave"))
      return hits ? { x: x / hits, y: y / hits } : null
    }, label)
    // Settled: where it was a moment ago.
    if (at && last && Math.hypot(at.x - last.x, at.y - last.y) < 1) return at
    last = at
    await canvas.page().waitForTimeout(200)
  }
  throw new Error(`no node labelled "${label}" settled in the graph`)
}
