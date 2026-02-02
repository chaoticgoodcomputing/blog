/**
 * TagIndex integration for Graph component
 * 
 * This module provides functions to load and use the centralized TagIndex
 * data within the Graph component, replacing the legacy tag processing logic.
 */

import type { SimpleSlug } from "../../../../util/path"
import type { TagIndex } from "../../../../util/tags"
import { normalizeTag } from "../../../../util/tags"

// Global variable injected by renderPage.tsx
declare const fetchTagData: Promise<any>

let cachedTagIndex: TagIndex | null = null

/**
 * Load the TagIndex from the server.
 * Results are cached to avoid redundant fetches.
 */
export async function fetchTagIndex(): Promise<TagIndex> {
  if (cachedTagIndex) {
    return cachedTagIndex
  }
  
  const data = await fetchTagData
  cachedTagIndex = data
  return data
}

/**
 * Convert a tag name to SimpleSlug format (with trailing slash) for graph compatibility.
 * The graph expects tag slugs to end with "/" for consistency.
 */
export function tagNameToGraphSlug(tagName: string): SimpleSlug {
  const slug = `tags/${tagName}`
  return slug.endsWith("/") ? (slug as SimpleSlug) : ((slug + "/") as SimpleSlug)
}

/**
 * Convert a graph slug (tags/engineering/) back to a tag name (engineering).
 */
export function graphSlugToTagName(slug: SimpleSlug): string {
  return slug.replace(/^tags\//, "").replace(/\/$/, "")
}

/**
 * Get the color for a tag from the TagIndex.
 */
export function getTagColor(tagName: string, tagIndex: TagIndex): string {
  const metadata = tagIndex.tags[tagName]
  return metadata?.color ?? "#888888"
}

/**
 * Get the icon for a tag from the TagIndex.
 */
export function getTagIcon(tagName: string, tagIndex: TagIndex): string | null {
  const metadata = tagIndex.tags[tagName]
  return metadata?.icon ?? null
}

/**
 * Build a color map for graph slugs from TagIndex.
 * 
 * @param tags - Array of tag slugs used in the graph (format: "tags/engineering/")
 * @param tagIndex - Pre-loaded TagIndex
 * @returns Map from slug to color
 */
export function buildGraphColorMap(
  tags: SimpleSlug[],
  tagIndex: TagIndex,
): Map<SimpleSlug, string> {
  const colorMap = new Map<SimpleSlug, string>()
  
  for (const tagSlug of tags) {
    const tagName = graphSlugToTagName(tagSlug)
    const color = getTagColor(tagName, tagIndex)
    colorMap.set(tagSlug, color)
  }
  
  return colorMap
}

/**
 * Build a count map for graph slugs from TagIndex.
 * 
 * @param tags - Array of tag slugs used in the graph (format: "tags/engineering/")
 * @param tagIndex - Pre-loaded TagIndex
 * @returns Map from slug to cumulative post count
 */
export function buildGraphCountMap(
  tags: SimpleSlug[],
  tagIndex: TagIndex,
): Map<SimpleSlug, number> {
  const countMap = new Map<SimpleSlug, number>()
  
  for (const tagSlug of tags) {
    const tagName = graphSlugToTagName(tagSlug)
    const metadata = tagIndex.tags[tagName]
    const count = metadata?.totalPostCount ?? 0
    countMap.set(tagSlug, count)
  }
  
  return countMap
}

/**
 * Build a count map for tag nodes based on actual connections in the filtered graph.
 * This counts tag-post connections and propagates counts upward through the hierarchy,
 * so parent tags include the count of all their descendants' posts.
 * 
 * @param graphData - The filtered graph data containing nodes and links
 * @returns Map from tag slug to cumulative post count (including descendants)
 */
export function buildFilteredTagCountMap(
  graphData: { nodes: any[]; links: any[] },
): Map<SimpleSlug, number> {
  const directCountMap = new Map<SimpleSlug, number>()
  const parentMap = new Map<SimpleSlug, SimpleSlug>()  // child -> parent
  
  // Initialize all tag nodes with count of 0
  for (const node of graphData.nodes) {
    if (node.id.startsWith("tags/")) {
      directCountMap.set(node.id, 0)
    }
  }
  
  // Build parent-child relationships from tag-tag links
  for (const link of graphData.links) {
    if (link.type === "tag-tag") {
      // tag-tag links: source is parent, target is child
      const parentId = link.source.id
      const childId = link.target.id
      parentMap.set(childId, parentId)
    }
  }
  
  // Count direct tag-post connections
  for (const link of graphData.links) {
    if (link.type === "tag-post") {
      // Tag-post links: one end is a tag, the other is a post
      const tagId = link.source.id.startsWith("tags/") ? link.source.id : link.target.id
      const currentCount = directCountMap.get(tagId) ?? 0
      directCountMap.set(tagId, currentCount + 1)
    }
  }
  
  // Propagate counts upward through the hierarchy
  const totalCountMap = new Map<SimpleSlug, number>()
  
  // Helper function to recursively calculate total count (direct + descendants)
  function getTotalCount(tagId: SimpleSlug): number {
    // If already calculated, return cached value
    if (totalCountMap.has(tagId)) {
      return totalCountMap.get(tagId)!
    }
    
    // Start with direct count
    let total = directCountMap.get(tagId) ?? 0
    
    // Add counts from all children
    for (const [childId, parentId] of parentMap.entries()) {
      if (parentId === tagId) {
        total += getTotalCount(childId)
      }
    }
    
    // Cache and return
    totalCountMap.set(tagId, total)
    return total
  }
  
  // Calculate total counts for all tags
  for (const tagId of directCountMap.keys()) {
    getTotalCount(tagId)
  }
  
  return totalCountMap
}

/**
 * Extract all unique icon identifiers from TagIndex.
 * Used for preloading icons.
 */
export function getAllIconsFromTagIndex(tagIndex: TagIndex): string[] {
  const icons = new Set<string>()
  
  for (const tagName in tagIndex.tags) {
    const icon = tagIndex.tags[tagName].icon
    if (icon) {
      icons.add(icon)
    }
  }
  
  return Array.from(icons)
}


