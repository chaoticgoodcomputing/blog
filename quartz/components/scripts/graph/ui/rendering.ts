import { Group as TweenGroup, Tween as Tweened } from "@tweenjs/tween.js"
import { LinkRenderData, NodeRenderData, LabelData } from "../core/renderTypes"
import { calculateEdgeOpacity } from "../core/graphData"
import { TweenManager } from "../core/tweenManager"
import { CanvasApp } from "./canvasSetup"

export function renderLinks(
  tweenManager: TweenManager,
  linkRenderData: LinkRenderData[],
  hoveredNodeId: string | null,
  styleMap: Record<string, string>,
) {
  tweenManager.get("link")?.stop()

  for (const l of linkRenderData) {
    let alpha = 1
    if (hoveredNodeId) {
      alpha = l.active ? 1 : 0
    }
    l.color = l.active ? styleMap["--gray"] : styleMap["--lightgray"]
    l.alpha = alpha  // Directly set alpha without tweening
  }
}

export function renderLabels(
  tweenManager: TweenManager,
  nodeRenderData: NodeRenderData[],
  hoveredNodeId: string | null,
  scale: number,
) {
  tweenManager.get("label")?.stop()
  const tweenGroup = new TweenGroup()

  const defaultScale = 1 / scale
  const activeScale = defaultScale * 1.1
  for (const n of nodeRenderData) {
    const nodeId = n.simulationData.id
    const isPrivate = n.simulationData.tags.includes("private")
    
    if (hoveredNodeId === nodeId) {
      tweenGroup.add(new Tweened<LabelData>(n.label).to({ alpha: 1, scale: activeScale }, 100))
    } else if (hoveredNodeId !== null) {
      // When a node is hovered, only show labels for active public nodes
      const targetAlpha = n.active && !isPrivate ? 1 : 0
      tweenGroup.add(new Tweened<LabelData>(n.label).to({ alpha: targetAlpha, scale: defaultScale }, 100))
    } else {
      // Reset to initial alpha when not hovered
      tweenGroup.add(new Tweened<LabelData>(n.label).to({ alpha: n.label.initialAlpha, scale: defaultScale }, 100))
    }
  }

  tweenGroup.getAll().forEach((tw) => tw.start())
  tweenManager.set("label", {
    update: tweenGroup.update.bind(tweenGroup),
    stop() {
      tweenGroup.getAll().forEach((tw) => tw.stop())
    },
  })
}

export function renderNodes(
  tweenManager: TweenManager,
  nodeRenderData: NodeRenderData[],
  hoveredNodeId: string | null,
  focusOnHover: boolean,
) {
  tweenManager.get("hover")?.stop()
  const tweenGroup = new TweenGroup()

  for (const n of nodeRenderData) {
    let alpha = 1
    if (hoveredNodeId !== null && focusOnHover) {
      alpha = n.active ? 1 : 0.2
    }
    tweenGroup.add(new Tweened<NodeRenderData>(n).to({ alpha }, 200))
  }

  tweenGroup.getAll().forEach((tw) => tw.start())
  tweenManager.set("hover", {
    update: tweenGroup.update.bind(tweenGroup),
    stop() {
      tweenGroup.getAll().forEach((tw) => tw.stop())
    },
  })
}

export function updateRenderData(
  tweenManager: TweenManager,
  linkRenderData: LinkRenderData[],
  nodeRenderData: NodeRenderData[],
  hoveredNodeId: string | null,
  styleMap: Record<string, string>,
  scale: number,
  focusOnHover: boolean,
) {
  renderLinks(tweenManager, linkRenderData, hoveredNodeId, styleMap)
  renderLabels(tweenManager, nodeRenderData, hoveredNodeId, scale)
  renderNodes(tweenManager, nodeRenderData, hoveredNodeId, focusOnHover)
}

function drawNode(
  ctx: CanvasRenderingContext2D,
  node: NodeRenderData,
  x: number,
  y: number,
) {
  ctx.save()
  ctx.globalAlpha = node.alpha

  // Draw circle
  ctx.beginPath()
  ctx.arc(x, y, node.radius, 0, 2 * Math.PI)
  ctx.fillStyle = node.fillColor
  ctx.fill()

  // Draw stroke if present
  if (node.strokeColor && node.strokeWidth) {
    ctx.strokeStyle = node.strokeColor
    ctx.lineWidth = node.strokeWidth
    ctx.stroke()
  }

  // Draw icon if present
  if (node.iconImage && node.iconSize) {
    const iconX = x - node.iconSize / 2
    const iconY = y - node.iconSize / 2
    ctx.drawImage(node.iconImage, iconX, iconY, node.iconSize, node.iconSize)
  }

  ctx.restore()
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  label: LabelData,
  x: number,
  y: number,
  nodeRadius: number,
) {
  ctx.save()
  ctx.globalAlpha = label.alpha
  
  const scaledFontSize = label.fontSize * label.scale
  ctx.font = `${scaledFontSize}px ${label.fontFamily}`
  ctx.fillStyle = label.color
  ctx.textAlign = "center"
  ctx.textBaseline = "top"
  
  // Position label just below node bottom edge
  const offsetY = y + nodeRadius + 2
  ctx.fillText(label.text, x, offsetY)
  
  ctx.restore()
}

function drawLink(
  ctx: CanvasRenderingContext2D,
  link: LinkRenderData,
  sx: number,
  sy: number,
  tx: number,
  ty: number,
  finalAlpha: number,
) {
  ctx.save()
  ctx.globalAlpha = finalAlpha
  ctx.strokeStyle = link.color
  ctx.lineWidth = 2
  
  // Apply line dash for dotted style
  if (link.lineStyle === 'dotted') {
    ctx.setLineDash([2, 2])  // 1px dot, 2px gap
  } else {
    ctx.setLineDash([])  // Solid line (clear any dash pattern)
  }
  
  ctx.beginPath()
  ctx.moveTo(sx, sy)
  ctx.lineTo(tx, ty)
  ctx.stroke()
  ctx.restore()
}

export function startAnimationLoop(
  nodeRenderData: NodeRenderData[],
  linkRenderData: LinkRenderData[],
  tweenManager: TweenManager,
  app: CanvasApp,
  width: number,
  height: number,
  linkDistanceConfig: { tagTag: number; tagPost: number; postPost: number },
  edgeOpacityConfig: {
    tagTag: { min: number; max: number }
    tagPost: { min: number; max: number }
    postPost: { min: number; max: number }
  },
  transform: { x: number; y: number; k: number },
): () => void {
  const { ctx } = app
  let stopAnimation = false

  function animate(time: number) {
    if (stopAnimation) return

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    ctx.save()
    
    // Apply zoom/pan transform
    ctx.translate(transform.x, transform.y)
    ctx.scale(transform.k, transform.k)

    // Draw links first (background layer)
    for (const l of linkRenderData) {
      const linkData = l.simulationData
      const sx = linkData.source.x! + width / 2
      const sy = linkData.source.y! + height / 2
      const tx = linkData.target.x! + width / 2
      const ty = linkData.target.y! + height / 2

      const dx = tx - sx
      const dy = ty - sy
      const distance = Math.sqrt(dx * dx + dy * dy)

      const targetDistance =
        linkData.type === "tag-tag"
          ? linkDistanceConfig.tagTag
          : linkData.type === "tag-post"
            ? linkDistanceConfig.tagPost
            : linkDistanceConfig.postPost

      const opacityConfig =
        linkData.type === "tag-tag"
          ? edgeOpacityConfig.tagTag
          : linkData.type === "tag-post"
            ? edgeOpacityConfig.tagPost
            : edgeOpacityConfig.postPost

      // For active links (connected to hovered node), use full opacity
      // Otherwise, apply distance-based opacity calculation
      let finalAlpha: number
      if (l.active && l.alpha === 1) {
        finalAlpha = 1
      } else {
        const baseOpacity = calculateEdgeOpacity(
          distance,
          targetDistance,
          opacityConfig.min,
          opacityConfig.max,
        )
        finalAlpha = baseOpacity * l.alpha
      }

      drawLink(ctx, l, sx, sy, tx, ty, finalAlpha)
    }

    // Draw nodes (middle layer)
    for (const n of nodeRenderData) {
      const { x, y } = n.simulationData
      if (!x || !y) continue
      const nodeX = x + width / 2
      const nodeY = y + height / 2
      drawNode(ctx, n, nodeX, nodeY)
    }

    // Draw labels (top layer)
    for (const n of nodeRenderData) {
      const { x, y } = n.simulationData
      if (!x || !y) continue
      const labelX = x + width / 2
      const labelY = y + height / 2
      drawLabel(ctx, n.label, labelX, labelY, n.radius)
    }

    ctx.restore()

    tweenManager.updateAll(time)
    requestAnimationFrame(animate)
  }

  requestAnimationFrame(animate)

  return () => {
    stopAnimation = true
    app.destroy()
  }
}
