// Drawing a graph on its canvas, every frame: the ring, edges, nodes with their icons, and labels,
// and the fades a hover starts (v4 ui/canvasSetup.ts, ui/rendering.ts, core/tweenManager.ts). Colours
// come from the palette each frame, the icons' too, so a repaint is a new palette and nothing more. The layout moves in the same
// loop: each frame ticks the simulation while it is warm (still-timer.ts).
import { Group, Tween } from "@tweenjs/tween.js"
import type { Simulation } from "d3-force"
import type { IconImages } from "./icons"
import type { Palette } from "./palette"
import type { Settings } from "./settings"
import type { Label, LinkData, LinkRender, NodeData, NodeId, NodeRender, Transform } from "./types"

/** An icon's size, as a multiple of its node's radius (v4 ui/nodeFactory.ts). */
const ICON_SCALE = 1.4

export interface Canvas {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  width: number
  height: number
}

/** A canvas of `width` × `height` CSS pixels, sharp on a high-density screen. */
export function canvasOf(width: number, height: number): Canvas {
  const canvas = document.createElement("canvas")
  canvas.className = "cgc-graph__canvas"
  const ctx = canvas.getContext("2d")!
  const dpr = window.devicePixelRatio || 1
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  canvas.width = width * dpr
  canvas.height = height * dpr
  ctx.scale(dpr, dpr)
  return { canvas, ctx, width, height }
}

interface Tweening {
  update(time: number): void
  stop(): void
}

/** Every running fade, by what it fades, so a new hover stops the fade it replaces. */
export class Tweens {
  private tweens = new Map<string, Tweening>()

  set(key: string, group: Group) {
    this.tweens.get(key)?.stop()
    group.getAll().forEach((tween) => tween.start())
    this.tweens.set(key, {
      update: (time) => group.update(time),
      stop: () => group.getAll().forEach((tween) => tween.stop()),
    })
  }

  clear() {
    this.tweens.forEach((tween) => tween.stop())
    this.tweens.clear()
  }

  update(time: number) {
    this.tweens.forEach((tween) => tween.update(time))
  }
}

/**
 * After the hover changes: fade labels in and out, hide the edges away from the hovered node, and
 * dim the nodes away from it where `focusOnHover` asks (v4's `updateRenderData`).
 */
export function fadeForHover(
  tweens: Tweens,
  links: LinkRender[],
  nodes: NodeRender[],
  hovered: NodeId | null,
  settings: Settings,
) {
  for (const link of links) link.alpha = hovered === null || link.active ? 1 : 0

  const labels = new Group()
  const resting = 1 / settings.scale
  for (const node of nodes) {
    const target: Partial<Label> =
      hovered === node.node.id
        ? { alpha: 1, scale: resting * 1.1 }
        : hovered !== null
          ? // Only lit, public neighbours are labelled while something is hovered.
            { alpha: node.active && !node.node.private ? 1 : 0, scale: resting }
          : { alpha: node.label.initialAlpha, scale: resting }
    labels.add(new Tween(node.label).to(target, 100))
  }
  tweens.set("label", labels)

  const dim = new Group()
  for (const node of nodes) {
    const alpha = hovered !== null && settings.focusOnHover && !node.active ? 0.2 : 1
    dim.add(new Tween(node).to({ alpha }, 200))
  }
  tweens.set("hover", dim)
}

/**
 * An edge's opacity by how stretched it is: `max` at half its link distance or closer, `min` at
 * twice it or further.
 */
export function edgeOpacity(distance: number, target: number, min: number, max: number) {
  const [near, far] = [target * 0.5, target * 2]
  const t = (Math.max(near, Math.min(far, distance)) - near) / (far - near)
  return max - t * (max - min)
}

export interface Scene {
  canvas: Canvas
  simulation: Simulation<NodeData, LinkData>
  nodes: NodeRender[]
  links: LinkRender[]
  tweens: Tweens
  transform: Transform
  settings: Settings
  palette: () => Palette
  icons: IconImages
  current: NodeId
  shellRadius: number | null
}

/** Draws every frame until stopped. Returns the stop. */
export function animate(scene: Scene): () => void {
  const { canvas, nodes, links, tweens, transform, settings, simulation } = scene
  const { ctx, width, height } = canvas
  const [cx, cy] = [width / 2, height / 2]
  const currentNode = nodes.find((node) => node.node.id === scene.current)
  const period = settings.expandSelectedOscillationTime * 1000
  let stopped = false

  const frame = (time: number) => {
    if (stopped) return
    // What d3-force's own timer would do: tick while the layout is warm, or a drag is warming it.
    const cold = simulation.alphaMin()
    if (simulation.alpha() >= cold || simulation.alphaTarget() >= cold) simulation.tick()
    const palette = scene.palette()
    ctx.clearRect(0, 0, width, height)
    ctx.save()
    ctx.translate(transform.x, transform.y)
    ctx.scale(transform.k, transform.k)

    if (settings.shell?.showShell && scene.shellRadius !== null) {
      ctx.save()
      ctx.globalAlpha = settings.shell.opacity
      ctx.strokeStyle = palette.shell
      ctx.lineWidth = settings.shell.lineWidth
      ctx.setLineDash(settings.shell.lineStyle === "dotted" ? [5, 5] : [])
      ctx.beginPath()
      ctx.arc(cx, cy, scene.shellRadius, 0, 2 * Math.PI)
      ctx.stroke()
      ctx.restore()
    }

    for (const edge of links) {
      const { source, target, type: kind } = edge.link
      if (source.x == null || source.y == null || target.x == null || target.y == null) continue
      const [sx, sy, tx, ty] = [source.x + cx, source.y + cy, target.x + cx, target.y + cy]
      const { min, max } = settings.edgeOpacity[kind]
      const alpha =
        edge.active && edge.alpha === 1
          ? 1
          : edgeOpacity(Math.hypot(tx - sx, ty - sy), settings.linkDistance[kind], min, max) *
            edge.alpha
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.strokeStyle = edge.active ? palette.gray : palette.lightgray
      ctx.lineWidth = 2
      ctx.setLineDash(edge.lineStyle === "dotted" ? [2, 2] : [])
      ctx.beginPath()
      ctx.moveTo(sx, sy)
      ctx.lineTo(tx, ty)
      ctx.stroke()
      ctx.restore()
    }

    for (const node of nodes) {
      const { x, y } = node.node
      if (x == null || y == null) continue
      let radius = node.radius
      // The current page's node swells and shrinks, from its size to `expandSelectedSize` times it.
      if (node === currentNode && period > 0) {
        const wave = Math.sin(((time % period) / period) * 2 * Math.PI)
        radius *= 1 + ((wave + 1) / 2) * (settings.expandSelectedSize - 1)
      }
      ctx.save()
      ctx.globalAlpha = node.alpha
      ctx.beginPath()
      ctx.arc(x + cx, y + cy, radius, 0, 2 * Math.PI)
      ctx.fillStyle = palette.node(node.colour)
      ctx.fill()
      if (node.ring !== null) {
        ctx.strokeStyle = palette.node(node.ring)
        ctx.lineWidth = 2
        ctx.stroke()
      }
      // Its icon, centred, at v4's size, swelling with it.
      const icon = node.icon === null ? null : scene.icons.image(node.icon, palette.icon)
      if (icon) {
        const size = radius * ICON_SCALE
        ctx.drawImage(icon, x + cx - size / 2, y + cy - size / 2, size, size)
      }
      ctx.restore()
    }

    for (const { node, label, radius } of nodes) {
      if (node.x == null || node.y == null || label.alpha <= 0) continue
      ctx.save()
      ctx.globalAlpha = label.alpha
      ctx.font = `${label.fontSize * label.scale}px ${palette.font}`
      ctx.fillStyle = palette.dark
      ctx.textAlign = "center"
      ctx.textBaseline = "top"
      ctx.fillText(label.text, node.x + cx, node.y + cy + radius + 2)
      ctx.restore()
    }

    ctx.restore()
    tweens.update(time)
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
  return () => {
    stopped = true
  }
}
