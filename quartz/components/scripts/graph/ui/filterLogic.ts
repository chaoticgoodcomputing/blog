import type { ContentDetails } from "../../../../plugins/emitters/contentIndex"
import { SimpleSlug } from "../../../../util/path"
import type { NodeData, LinkData } from "../core/types"
import type { FilterState } from "./filters"
import { getTimePeriodCutoff } from "./filters"

/**
 * Determine if a node should be included based on the current filter state
 */
function shouldIncludeNode(
  node: NodeData,
  data: Map<SimpleSlug, ContentDetails>,
  filterState: FilterState,
): boolean {
  const nodeId = node.id

  // Tags are always included initially (they'll be filtered later based on connections)
  if (nodeId.startsWith("tags/")) {
    return true
  }

  const contentDetails = data.get(nodeId)
  if (!contentDetails) {
    return true // Keep nodes without details
  }

  // Filter by private tag
  if (!filterState.includePrivate) {
    const hasPrivateTag = contentDetails.tags.some((tag) => tag.toLowerCase() === "private")
    if (hasPrivateTag) {
      return false
    }
  }

  // Filter by time period
  const cutoffDate = getTimePeriodCutoff(filterState.timePeriod)
  if (cutoffDate && contentDetails.date) {
    const nodeDate = new Date(contentDetails.date)
    if (nodeDate < cutoffDate) {
      return false
    }
  }

  return true
}

/**
 * Filter graph data based on the current filter state
 * This removes:
 * 1. Post nodes that don't match the filter criteria
 * 2. Links involving filtered nodes
 * 3. Tag nodes that no longer have any tag-post connections
 */
export function filterGraphData(
  originalNodes: NodeData[],
  originalLinks: LinkData[],
  data: Map<SimpleSlug, ContentDetails>,
  filterState: FilterState,
): { nodes: NodeData[]; links: LinkData[] } {
  // Step 1: Filter post nodes based on filter criteria
  const includedNodeIds = new Set<SimpleSlug>()

  for (const node of originalNodes) {
    if (shouldIncludeNode(node, data, filterState)) {
      includedNodeIds.add(node.id)
    }
  }

  // Step 2: Filter links to only include those between included nodes
  const filteredLinks = originalLinks.filter(
    (link) =>
      includedNodeIds.has(link.source.id) && includedNodeIds.has(link.target.id),
  )

  // Step 3: Remove tag nodes that no longer have any tag-post connections
  const tagNodeIds = new Set<SimpleSlug>()
  const tagPostConnections = new Set<SimpleSlug>()

  // Find all tag nodes and identify which ones have tag-post connections
  for (const link of filteredLinks) {
    if (link.type === "tag-post") {
      // Tag-post connections: either source or target is a tag
      if (link.source.id.startsWith("tags/")) {
        tagPostConnections.add(link.source.id)
      }
      if (link.target.id.startsWith("tags/")) {
        tagPostConnections.add(link.target.id)
      }
    }
  }

  // Identify all tag nodes
  for (const nodeId of includedNodeIds) {
    if (nodeId.startsWith("tags/")) {
      tagNodeIds.add(nodeId)
    }
  }

  // Remove tag nodes that don't have any tag-post connections
  for (const tagId of tagNodeIds) {
    if (!tagPostConnections.has(tagId)) {
      includedNodeIds.delete(tagId)
    }
  }

  // Step 4: Re-filter links to remove those involving orphaned tags
  const finalLinks = filteredLinks.filter(
    (link) =>
      includedNodeIds.has(link.source.id) && includedNodeIds.has(link.target.id),
  )

  // Step 5: Build final node list
  const finalNodes = originalNodes.filter((node) => includedNodeIds.has(node.id))

  return {
    nodes: finalNodes,
    links: finalLinks,
  }
}
