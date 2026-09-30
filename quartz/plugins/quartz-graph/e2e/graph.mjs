// Reading a drawn graph the ways a reader can, for the specs beside it:
//
// - its **text alternative**, the list of nodes and edges the plugin writes inside each canvas for
//   whoever can't see it (docs/adr/0002);
// - the node under the pointer, which the text alternative marks `data-hovered` while the drawing
//   lights it up.
import { expect, resolvedColour } from "../../../tests/harness/test.mjs"

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
    // Settled: where it was a moment ago. The sweep lit up every node's neighbours in turn, and
    // their labels fade back out once the pointer leaves: wait for that, so what is read of the
    // canvas next is the graph at rest, not a label passing over it.
    if (at && last && Math.hypot(at.x - last.x, at.y - last.y) < 1) {
      await canvas.page().waitForTimeout(300)
      return at
    }
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
 * How many of the canvas's pixels are painted within a few levels of `rgb`, at least half opaque, in
 * the band under the node at `at` where its label is drawn: from just past the node's edge (`radius`,
 * in CSS pixels) to `depth` CSS pixels below its centre, `halfWidth` either side. With the theme's
 * `dark`, the ink of the node's label, drawn there, centred. The canvas keeps colour unpremultiplied,
 * so a label resting at a low alpha is `dark` too, but faint: the opacity floor leaves it out.
 */
export const labelInk = (container, at, rgb, { radius = 10, depth = 40, halfWidth = 60 } = {}) =>
  container.locator(".cgc-graph__canvas").evaluate(
    (canvas, { at, rgb, radius, depth, halfWidth }) => {
      const rect = canvas.getBoundingClientRect()
      const k = canvas.width / rect.width
      const [cx, cy] = [(at.x - rect.left) * k, (at.y - rect.top) * k]
      const data = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data
      let count = 0
      for (let y = Math.round(cy + radius * k); y < cy + depth * k; y++) {
        for (let x = Math.round(cx - halfWidth * k); x < cx + halfWidth * k; x++) {
          if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) continue
          const i = (y * canvas.width + x) * 4
          const off = Math.max(...[0, 1, 2].map((c) => Math.abs(data[i + c] - rgb[c])))
          if (data[i + 3] >= 128 && off <= 24) count++
        }
      }
      return count
    },
    { at, rgb, radius, depth, halfWidth },
  )

/**
 * The colour a node drawn as a disc is filled with, as `[r, g, b]`: the commonest colour round a ring
 * inside its edge. For a page with no tags, which v4's colours fill (docs/adr/0004); a node with a
 * tag is a bubble, read with `bubblePaint`. Nodes must be big enough for that: the fixture's local
 * graph draws them at the real site's size (tests/quartz.config.yaml).
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
 * The colours of the tag bubble the node labelled `label` is drawn as (tags-core's `./bubble`), each
 * as `[r, g, b]`: its `rim`, and its `circle` between the rim and the icon. Read along rays out
 * from the node's centre, each through the node's opaque pixels to the rim's anti-aliased edge: the
 * last opaque pixel on a ray is the rim's, and those from 60% to 80% of the way out are the
 * circle's, clear of the icon. The commonest colour over every ray wins, so an edge or a label a ray
 * crosses doesn't count. Wants a canvas at `deviceScaleFactor: 2`, so the rim is whole pixels.
 */
export async function bubblePaint(container, label) {
  const at = await nodePosition(container, label)
  return container.locator(".cgc-graph__canvas").evaluate((canvas, at) => {
    const rect = canvas.getBoundingClientRect()
    const k = canvas.width / rect.width
    const [cx, cy] = [(at.x - rect.left) * k, (at.y - rect.top) * k]
    const data = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data
    const pixel = (x, y) => {
      const i = (Math.round(y) * canvas.width + Math.round(x)) * 4
      return data[i + 3] === 255 ? `${data[i]},${data[i + 1]},${data[i + 2]}` : null
    }
    const [rims, circles] = [new Map(), new Map()]
    const vote = (votes, key) => votes.set(key, (votes.get(key) ?? 0) + 1)
    for (let i = 0; i < 32; i++) {
      const angle = (i * Math.PI) / 16
      const run = []
      for (let d = 0; d < 80 * k; d++) {
        const key = pixel(cx + d * Math.cos(angle), cy + d * Math.sin(angle))
        if (key === null) break
        run.push(key)
      }
      if (run.length < 8) continue
      vote(rims, run[run.length - 1])
      for (let d = Math.ceil(run.length * 0.6); d <= run.length * 0.8; d++) vote(circles, run[d])
    }
    const commonest = (votes) => {
      const [top] = [...votes].sort((a, b) => b[1] - a[1])
      return top ? top[0].split(",").map(Number) : null
    }
    return { rim: commonest(rims), circle: commonest(circles) }
  }, at)
}

/** A colour as the page resolves it now, in the scheme it shows, as `[r, g, b]`. */
export const rgbOf = async (page, value) =>
  (await resolvedColour(page, value)).match(/\d+/g).slice(0, 3).map(Number)

/** The bubble's palette as the page resolves it now: the theme's `--lightgray` and `--dark`. */
export const bubbleTheme = async (page) => ({
  circle: await rgbOf(page, "var(--lightgray)"),
  icon: await rgbOf(page, "var(--dark)"),
})

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
 * How many of the canvas's pixels are painted within a few levels of `rgb`: at any opacity, or with
 * `translucent`, only those painted partly. For the theme's `lightgray`, translucent, the edges'
 * strokes: each is drawn at its opacity, while a bubble's circle, the one other mark in `lightgray`,
 * is opaque, and its rim covers its anti-aliased edge.
 */
export const pixelsLike = (container, rgb, { translucent = false } = {}) =>
  container.locator(".cgc-graph__canvas").evaluate(
    (canvas, { rgb, translucent }) => {
      const data = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data
      let count = 0
      for (let i = 0; i < data.length; i += 4) {
        const off = Math.max(...[0, 1, 2].map((c) => Math.abs(data[i + c] - rgb[c])))
        const alpha = data[i + 3]
        if (alpha > 0 && (!translucent || alpha < 255) && off <= 8) count++
      }
      return count
    },
    { rgb, translucent },
  )
