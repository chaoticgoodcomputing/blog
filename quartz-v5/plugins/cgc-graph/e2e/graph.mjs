// Reading a drawn graph the ways a reader can, for the specs beside it:
//
// - its **text alternative**, the list of nodes and edges the plugin writes inside each canvas for
//   whoever can't see it (docs/adr/0002);
// - the node under the pointer, which the text alternative marks `data-hovered` while the drawing
//   lights it up.
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

/** The label of the node the text alternative marks as under the pointer, or null. */
export const hoveredLabel = (container) =>
  container
    .locator(".cgc-graph__canvas")
    .evaluate(
      (canvas) =>
        canvas.querySelector(".cgc-graph__node[data-hovered] > .cgc-graph__node-link")
          ?.textContent ?? null,
    )

/**
 * Where the node labelled `label` is drawn, in viewport pixels, once the layout has settled: the
 * centre of the points where the text alternative marks it as under the pointer. Found by moving a
 * pointer over the canvas inside the page, which is fast enough to sweep it whole.
 */
export async function nodePosition(container, label) {
  const canvas = container.locator(".cgc-graph__canvas")
  let last = null
  for (let attempt = 0; attempt < 60; attempt++) {
    const at = await canvas.evaluate((canvas, label) => {
      const rect = canvas.getBoundingClientRect()
      const hovered = () =>
        canvas.querySelector(".cgc-graph__node[data-hovered] > .cgc-graph__node-link")?.textContent
      let [x, y, hits] = [0, 0, 0]
      for (let py = rect.top + 1; py < rect.bottom; py += 2) {
        for (let px = rect.left + 1; px < rect.right; px += 2) {
          canvas.dispatchEvent(
            new MouseEvent("mousemove", { clientX: px, clientY: py, bubbles: true }),
          )
          if (hovered() === label) [x, y, hits] = [x + px, y + py, hits + 1]
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

// The canvas's opaque pixels around a node's centre, in viewport pixels, at `radii` CSS pixels from
// it: `rings` samples eight points round each radius, `disc` every device pixel within the radius.
const pixelsNear = (container, at, shape) =>
  container.locator(".cgc-graph__canvas").evaluate(
    (canvas, { at, shape }) => {
      const rect = canvas.getBoundingClientRect()
      const k = canvas.width / rect.width
      const [cx, cy] = [(at.x - rect.left) * k, (at.y - rect.top) * k]
      const data = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data
      const pixel = (x, y) => {
        const i = (Math.round(y) * canvas.width + Math.round(x)) * 4
        return data[i + 3] === 255 ? [data[i], data[i + 1], data[i + 2]] : null
      }
      const found = []
      if (shape.rings) {
        for (const radius of shape.rings) {
          for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4
            found.push(pixel(cx + radius * k * Math.cos(angle), cy + radius * k * Math.sin(angle)))
          }
        }
      } else {
        const r = shape.disc * k
        for (let y = cy - r; y <= cy + r; y++)
          for (let x = cx - r; x <= cx + r; x++)
            if (Math.hypot(x - cx, y - cy) <= r) found.push(pixel(x, y))
      }
      return found.filter(Boolean)
    },
    { at, shape },
  )

/**
 * The colour the node labelled `label` is filled with, as `[r, g, b]`: the commonest colour round a
 * ring inside its edge, clear of the icon at its centre. Nodes must be big enough for that: the
 * fixture's local graph draws them at the real site's size (tests/quartz.config.yaml).
 */
export async function nodeFill(container, label) {
  const at = await nodePosition(container, label)
  const counts = new Map()
  for (const rgb of await pixelsNear(container, at, { rings: [8, 9] })) {
    const key = rgb.join(",")
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  const [commonest] = [...counts].sort((a, b) => b[1] - a[1])
  return commonest ? commonest[0].split(",").map(Number) : null
}

/**
 * How many of the canvas's pixels within `disc` CSS pixels of the centre of the node labelled `label`
 * are within a few levels of `rgb`: by default, where its icon is drawn, the icon's marks.
 */
export async function marksNear(container, label, rgb, disc = 5) {
  const at = await nodePosition(container, label)
  const near = ([r, g, b]) =>
    Math.max(Math.abs(r - rgb[0]), Math.abs(g - rgb[1]), Math.abs(b - rgb[2])) <= 24
  return (await pixelsNear(container, at, { disc })).filter(near).length
}

/**
 * How many of the canvas's pixels are painted within a few levels of `rgb`, at any opacity: for the
 * theme's `lightgray`, which nothing but a resting edge is drawn in, the edges' strokes.
 */
export const pixelsLike = (container, rgb) =>
  container.locator(".cgc-graph__canvas").evaluate((canvas, rgb) => {
    const data = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data
    let count = 0
    for (let i = 0; i < data.length; i += 4) {
      const off = Math.max(...[0, 1, 2].map((c) => Math.abs(data[i + c] - rgb[c])))
      if (data[i + 3] > 0 && off <= 8) count++
    }
    return count
  }, rgb)
