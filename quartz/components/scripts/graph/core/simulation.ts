import type { Simulation } from "d3"
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceRadial,
  forceSimulation,
} from "d3"
import type { SimpleSlug } from "../../../../util/path"
import type { LinkData, NodeData } from "./types"
import type { NormalizedPseudoShellConfig } from "../adapters/configAdapter"
import type { GraphStyle } from "../../../Graph"

export function createNodeRadiusFunction(
  graphData: { nodes: NodeData[]; links: LinkData[] },
  baseSize: { tags: number; posts: number },
  sizeScaling: { tags: number; posts: number },
  tagFileCountMap: Map<SimpleSlug, number>,
  privatePostSizeMultiplier: number = 1,
) {
  return (d: NodeData): number => {
    const base = d.id.startsWith("tags/") ? baseSize.tags : baseSize.posts
    const scaling = d.id.startsWith("tags/") ? sizeScaling.tags : sizeScaling.posts

    if (d.id.startsWith("tags/")) {
      const fileCount = tagFileCountMap.get(d.id) || 0
      return base + scaling * Math.sqrt(fileCount)
    }

    const numLinks = graphData.links.filter((l) => l.source.id === d.id || l.target.id === d.id)
      .length
    const radius = base + scaling * Math.sqrt(numLinks)
    
    // Apply private post size multiplier if node has #private tag
    const isPrivate = d.tags.includes("private")
    return isPrivate ? radius * privatePostSizeMultiplier : radius
  }
}

export function setupSimulation(
  graphData: { nodes: NodeData[]; links: LinkData[] },
  nodeRadius: (d: NodeData) => number,
  config: { repelForce: number; centerForce: number },
  linkDistance: { tagTag: number; tagPost: number; postPost: number },
  linkStrength: { tagTag: number; tagPost: number; postPost: number },
  enableRadial: boolean,
  width: number,
  height: number,
  graphStyle?: GraphStyle,
  pseudoShellConfig?: NormalizedPseudoShellConfig,
): { simulation: Simulation<NodeData, LinkData>; shellRadius?: number } {
  // Initialize nodes along the longest axis to better fit viewport
  const useLongAxis = width > height ? 'x' : 'y'
  const longAxisLength = Math.max(width, height)
  const shortAxisLength = Math.min(width, height)
  
  graphData.nodes.forEach((node) => {
    if (useLongAxis === 'x') {
      // Spread along x-axis, random position on y
      node.x = (Math.random() - 0.5) * longAxisLength * 0.8
      node.y = (Math.random() - 0.5) * shortAxisLength * 0.3
    } else {
      // Spread along y-axis, random position on x
      node.x = (Math.random() - 0.5) * shortAxisLength * 0.3
      node.y = (Math.random() - 0.5) * longAxisLength * 0.8
    }
  })

  const simulation = forceSimulation<NodeData>(graphData.nodes)
    .force("charge", forceManyBody().strength(-100 * config.repelForce))
    .force("center", forceCenter().strength(config.centerForce))
    .force(
      "link",
      forceLink(graphData.links)
        .distance((link) => {
          const l = link as LinkData
          switch (l.type) {
            case "tag-tag":
              return linkDistance.tagTag
            case "tag-post":
              return linkDistance.tagPost
            case "post-post":
              return linkDistance.postPost
            default:
              return 30
          }
        })
        .strength((link) => {
          const l = link as LinkData
          switch (l.type) {
            case "tag-tag":
              return linkStrength.tagTag
            case "tag-post":
              return linkStrength.tagPost
            case "post-post":
              return linkStrength.postPost
            default:
              return 1.0
          }
        }),
    )
    .force("collide", forceCollide<NodeData>(nodeRadius).iterations(3))

  // Apply style-specific forces
  let shellRadius: number | undefined
  
  if (graphStyle === "pseudo-shell" && pseudoShellConfig) {
    const result = applyPseudoShellForces(simulation, graphData, pseudoShellConfig, width, height)
    shellRadius = result.shellRadius
  } else if (enableRadial) {
    // Legacy radial force for freeform style
    const radius = (Math.min(width, height) / 2) * 0.8
    simulation.force("radial", forceRadial(radius).strength(0.2))
  }

  return { simulation, shellRadius }
}

/**
 * Calculate the shell radius for pseudo-shell layout.
 * Uses sqrt scaling because area grows with r², maintaining constant node density.
 * If nodes are proportional to area, then r should be proportional to √nodes.
 */
export function calculateShellRadius(
  nodeCount: number,
  config: NormalizedPseudoShellConfig,
): number {
  return config.radiusBase + config.radiusScale * Math.sqrt(nodeCount)
}

/**
 * Apply pseudo-shell style forces to the simulation.
 * Pins specified top-level tags to a circular shell while allowing other nodes to move freely.
 */
export function applyPseudoShellForces(
  simulation: Simulation<NodeData, LinkData>,
  graphData: { nodes: NodeData[]; links: LinkData[] },
  config: NormalizedPseudoShellConfig,
  width: number,
  height: number,
): { shellRadius: number } {
  const shellRadius = calculateShellRadius(graphData.nodes.length, config)
  
  // Create a set of pinned tag slugs for fast lookup
  // Graph tag nodes have trailing slashes (tags/engineering/)
  const pinnedTagSet = new Set(
    config.pinnedTags.map(tag => `tags/${tag}/` as SimpleSlug)
  )
  
  console.log('[PseudoShell] Initializing with:', {
    shellRadius,
    nodeCount: graphData.nodes.length,
    pinnedTags: config.pinnedTags,
    pinnedTagSet: Array.from(pinnedTagSet),
  })
  
  let tickCount = 0
  
  // Custom force to constrain pinned nodes to the shell circumference
  // This runs on every simulation tick and hard-snaps pinned nodes to the shell
  const shellForce = () => {
    tickCount++
    
    if (tickCount === 1 || tickCount % 100 === 0) {
      const pinnedNodes = graphData.nodes.filter(n => pinnedTagSet.has(n.id))
      console.log(`[PseudoShell] Tick ${tickCount}:`, {
        pinnedNodeCount: pinnedNodes.length,
        pinnedNodeIds: pinnedNodes.map(n => n.id),
        positions: pinnedNodes.map(n => ({ id: n.id, x: n.x, y: n.y })),
        shellRadius,
      })
    }
    
    // First pass: Apply radial constraint (hard snapping to shell)
    graphData.nodes.forEach((node) => {
      // Only apply to pinned tags
      if (pinnedTagSet.has(node.id)) {
        // Calculate current position vector from center
        const dx = node.x ?? 0
        const dy = node.y ?? 0
        const currentDistance = Math.sqrt(dx * dx + dy * dy)
        
        // Hard snap to shell: normalize direction vector and multiply by radius
        if (currentDistance > 0.01) {
          // Normalize the direction vector
          const directionX = dx / currentDistance
          const directionY = dy / currentDistance
          
          // Set position to be exactly on the shell
          node.x = directionX * shellRadius
          node.y = directionY * shellRadius
          
          // Zero out velocity in the radial direction to prevent drift
          // Keep only tangential velocity for sliding along the shell
          const vx = node.vx ?? 0
          const vy = node.vy ?? 0
          const radialVelocity = (vx * directionX + vy * directionY)
          node.vx = vx - radialVelocity * directionX
          node.vy = vy - radialVelocity * directionY
        } else {
          // If node is at origin, place it at a random point on the shell
          const angle = Math.random() * 2 * Math.PI
          node.x = Math.cos(angle) * shellRadius
          node.y = Math.sin(angle) * shellRadius
          node.vx = 0
          node.vy = 0
        }
      }
    })
    
    // Second pass: Apply circumferential repulsion between pinned nodes
    if (config.circumferentialRepulsion > 0) {
      const pinnedNodes = graphData.nodes.filter(n => pinnedTagSet.has(n.id))
      
      // For each pair of pinned nodes, apply tangential repulsion
      for (let i = 0; i < pinnedNodes.length; i++) {
        for (let j = i + 1; j < pinnedNodes.length; j++) {
          const nodeA = pinnedNodes[i]
          const nodeB = pinnedNodes[j]
          
          // Calculate angles for both nodes
          const angleA = Math.atan2(nodeA.y ?? 0, nodeA.x ?? 0)
          const angleB = Math.atan2(nodeB.y ?? 0, nodeB.x ?? 0)
          
          // Calculate angular distance (shortest path around circle)
          let angularDist = angleB - angleA
          if (angularDist > Math.PI) angularDist -= 2 * Math.PI
          if (angularDist < -Math.PI) angularDist += 2 * Math.PI
          
          // Repulsion strength decreases with angular distance
          // Use smooth inverse square falloff for natural, organic behavior
          const idealAngularDist = (2 * Math.PI) / pinnedNodes.length
          const distRatio = Math.abs(angularDist) / idealAngularDist
          
          // Smooth falloff: inverse square law with no hard cutoff
          // This creates organic settling as nodes gradually slow down
          // Force approaches 0 asymptotically but never hits a discontinuity
          const repulsionStrength = config.circumferentialRepulsion / (distRatio * distRatio)
          
          // Calculate tangent vectors (perpendicular to radial direction)
          const tangentXA = -(nodeA.y ?? 0) / shellRadius
          const tangentYA = (nodeA.x ?? 0) / shellRadius
          const tangentXB = -(nodeB.y ?? 0) / shellRadius
          const tangentYB = (nodeB.x ?? 0) / shellRadius
          
          // Apply forces in opposite tangential directions
          const forceDirection = angularDist > 0 ? -1 : 1
          nodeA.vx = (nodeA.vx ?? 0) + tangentXA * repulsionStrength * forceDirection
          nodeA.vy = (nodeA.vy ?? 0) + tangentYA * repulsionStrength * forceDirection
          nodeB.vx = (nodeB.vx ?? 0) - tangentXB * repulsionStrength * forceDirection
          nodeB.vy = (nodeB.vy ?? 0) - tangentYB * repulsionStrength * forceDirection
        }
      }
    }
  }
  
  // Add the shell force to the simulation
  simulation.force("shell", shellForce)
  
  // Initialize pinned nodes on the shell circumference
  let angleStep = (2 * Math.PI) / config.pinnedTags.length
  config.pinnedTags.forEach((tag, index) => {
    const tagSlug = `tags/${tag}` as SimpleSlug
    const node = graphData.nodes.find(n => n.id === tagSlug)
    if (node) {
      const angle = index * angleStep
      node.x = Math.cos(angle) * shellRadius
      node.y = Math.sin(angle) * shellRadius
    }
  })
  
  return { shellRadius }
}
