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

export function createNodeRadiusFunction(
  graphData: { nodes: NodeData[]; links: LinkData[] },
  baseSize: { tags: number; posts: number },
  sizeScaling: { tags: number; posts: number },
  tagFileCountMap: Map<SimpleSlug, number>,
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
    return base + scaling * Math.sqrt(numLinks)
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
): Simulation<NodeData, LinkData> {
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

  if (enableRadial) {
    const radius = (Math.min(width, height) / 2) * 0.8
    simulation.force("radial", forceRadial(radius).strength(0.2))
  }

  return simulation
}
