import type { ContentDetails } from "../../../../plugins/emitters/contentIndex"
import { SimpleSlug } from "../../../../util/path"
import type { NodeData, SimpleLinkData, LinkData } from "./types"
import type { TagIndex } from "../../../../util/tags"
import { tagNameToGraphSlug } from "./tagIndex"

export function calculateEdgeOpacity(
  actualDistance: number,
  targetDistance: number,
  minOpacity: number,
  maxOpacity: number,
): number {
  const minDist = targetDistance * 0.5
  const maxDist = targetDistance * 2.0
  const clampedDist = Math.max(minDist, Math.min(maxDist, actualDistance))
  const t = (clampedDist - minDist) / (maxDist - minDist)
  return maxOpacity - t * (maxOpacity - minOpacity)
}

/**
 * Build links and tags for the graph using pre-computed TagIndex data.
 * This replaces the legacy approach of dynamically computing tag hierarchy.
 */
export function buildLinksAndTags(
  data: Map<SimpleSlug, ContentDetails>,
  tagIndex: TagIndex,
  showTags: boolean,
  removeTags: string[],
): { links: SimpleLinkData[]; tags: SimpleSlug[] } {
  const links: SimpleLinkData[] = []
  const tagSlugs = new Set<SimpleSlug>()
  const validLinks = new Set(data.keys())
  const parentChildPairs = new Set<string>()

  // Build post-to-post links
  for (const [source, details] of data.entries()) {
    const outgoing = details.links ?? []

    for (const dest of outgoing) {
      if (validLinks.has(dest)) {
        links.push({ source, target: dest, type: "post-post" })
      }
    }
  }

  if (!showTags) {
    return { links, tags: [] }
  }

  // Build tag-related links using TagIndex
  const processedTags = new Set<string>()
  
  for (const [source, details] of data.entries()) {
    const postTags = (details.tags ?? []).filter((tag) => !removeTags.includes(tag))

    for (const tagName of postTags) {
      const tagMetadata = tagIndex.tags[tagName]
      if (!tagMetadata) continue

      // Add this tag and all its ancestors
      const tagsToAdd = [tagName, ...tagMetadata.ancestors]
      
      for (const tag of tagsToAdd) {
        const tagSlug = tagNameToGraphSlug(tag)
        tagSlugs.add(tagSlug)

        // Build parent-child links (only once per tag)
        if (!processedTags.has(tag)) {
          const metadata = tagIndex.tags[tag]
          if (metadata && metadata.parent) {
            const parentSlug = tagNameToGraphSlug(metadata.parent)
            const childSlug = tagNameToGraphSlug(tag)
            const pairKey = `${parentSlug}→${childSlug}`
            
            if (!parentChildPairs.has(pairKey)) {
              links.push({ source: parentSlug, target: childSlug, type: "tag-tag" })
              parentChildPairs.add(pairKey)
            }
          }
          processedTags.add(tag)
        }
      }

      // Add post-to-tag link
      const tagSlug = tagNameToGraphSlug(tagName)
      links.push({ source, target: tagSlug, type: "tag-post" })
    }
  }

  return { links, tags: Array.from(tagSlugs) }
}

export function calculateNeighborhood(
  slug: SimpleSlug,
  links: SimpleLinkData[],
  validLinks: Set<SimpleSlug>,
  tags: SimpleSlug[],
  depthLimit: number,
  showTags: boolean,
): Set<SimpleSlug> {
  const neighbourhood = new Set<SimpleSlug>()
  const wl: (SimpleSlug | "__SENTINEL")[] = [slug, "__SENTINEL"]
  let depth = depthLimit

  if (depth >= 0) {
    while (depth >= 0 && wl.length > 0) {
      const cur = wl.shift()!
      if (cur === "__SENTINEL") {
        depth--
        wl.push("__SENTINEL")
      } else {
        neighbourhood.add(cur)
        const outgoing = links.filter((l) => l.source === cur)
        const incoming = links.filter((l) => l.target === cur)
        wl.push(...outgoing.map((l) => l.target), ...incoming.map((l) => l.source))
      }
    }
  } else {
    validLinks.forEach((id) => neighbourhood.add(id))
    if (showTags) tags.forEach((tag) => neighbourhood.add(tag))
  }

  return neighbourhood
}

export function constructGraphNodes(
  neighbourhood: Set<SimpleSlug>,
  data: Map<SimpleSlug, ContentDetails>,
): NodeData[] {
  return [...neighbourhood].map((url) => {
    if (url.startsWith("tags/")) {
      const normalizedUrl = url.endsWith("/") ? url.slice(0, -1) : url
      const tagPath = normalizedUrl.substring(5)
      const parts = tagPath.split("/")
      const displayName = parts[parts.length - 1]
      return {
        id: url,
        text: "#" + displayName,
        tags: data.get(url)?.tags ?? [],
      }
    }

    return {
      id: url,
      text: data.get(url)?.title ?? url,
      tags: data.get(url)?.tags ?? [],
      external: data.get(url)?.external,
    }
  })
}

export function constructGraphData(
  nodes: NodeData[],
  links: SimpleLinkData[],
  neighbourhood: Set<SimpleSlug>,
): { nodes: NodeData[]; links: LinkData[] } {
  return {
    nodes,
    links: links
      .filter((l) => neighbourhood.has(l.source) && neighbourhood.has(l.target))
      .map((l) => ({
        source: nodes.find((n) => n.id === l.source)!,
        target: nodes.find((n) => n.id === l.target)!,
        type: l.type,
      })),
  }
}
