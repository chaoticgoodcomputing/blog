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


