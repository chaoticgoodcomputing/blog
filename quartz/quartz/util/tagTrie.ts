import { ContentDetails } from "../plugins/emitters/contentIndex"
import { FullSlug, joinSegments } from "./path"
import { TrieNode } from "./itrie"

export class TagTrieNode implements TrieNode<ContentDetails> {
  isFolder: boolean
  children: Array<TagTrieNode>
  content: Set<ContentDetails>

  private slugSegments: string[]
  private displayNameOverride?: string

  constructor(segments: string[]) {
    this.children = []
    this.slugSegments = segments
    this.content = new Set()
    this.isFolder = false
    this.displayNameOverride = undefined
  }

  get displayName(): string {
    return this.displayNameOverride ?? this.slugSegment ?? ""
  }

  set displayName(name: string) {
    this.displayNameOverride = name
  }

  get slug(): FullSlug {
    const path = joinSegments(...this.slugSegments) as FullSlug
    if (this.isFolder) {
      return joinSegments(path, "index") as FullSlug
    }
    return path
  }

  get slugSegment(): string {
    return this.slugSegments[this.slugSegments.length - 1]
  }

  // Implement getContentNodes method to return contents for display
  getContentNodes(): Array<{ slug: FullSlug; displayName: string }> {
    return Array.from(this.content).map(item => ({
      slug: item.slug,
      displayName: item.title
    }))
  }

  private makeChild(path: string[]): TagTrieNode {
    const fullPath = [...this.slugSegments, path[0]]
    const child = new TagTrieNode(fullPath)
    this.children.push(child)
    return child
  }

  private insert(path: string[], contentItem: ContentDetails) {
    if (path.length === 0) {
      throw new Error("path is empty")
    }

    // If we are inserting, we are a folder
    this.isFolder = true
    const segment = path[0]
    
    if (path.length === 1) {
      // Base case, we are at the end of the path
      const existingChild = this.children.find(c => c.slugSegment === segment)
      let child: TagTrieNode
      
      if (existingChild) {
        child = existingChild
      } else {
        child = this.makeChild([segment])
      }
      
      child.content.add(contentItem)
    } else if (path.length > 1) {
      // Recursive case, we are not at the end of the path
      const child = 
        this.children.find((c) => c.slugSegment === segment) ?? this.makeChild([segment])
      
      child.insert(path.slice(1), contentItem)
    }
  }

  // Add new content item to trie based on a tag
  addContent(tag: string, contentItem: ContentDetails) {
    const tagPath = tag.split("/")
    this.insert(tagPath, contentItem)
  }

  filter(filterFn: (node: TagTrieNode) => boolean) {
    this.children = this.children.filter(filterFn)
    this.children.forEach((child) => child.filter(filterFn))
  }

  map(mapFn: (node: TagTrieNode) => void) {
    mapFn(this)
    this.children.forEach((child) => child.map(mapFn))
  }

  sort(sortFn: (a: TagTrieNode, b: TagTrieNode) => number) {
    this.children = this.children.sort(sortFn)
    this.children.forEach((e) => e.sort(sortFn))
  }

  static fromContentIndex(contentIndex: Map<FullSlug, ContentDetails>): TagTrieNode {
    const trie = new TagTrieNode([])
    
    // Add each content item to the trie for each of its tags
    for (const [_, contentItem] of contentIndex.entries()) {
      if (contentItem.tags && contentItem.tags.length > 0) {
        for (const tag of contentItem.tags) {
          trie.addContent(tag, contentItem)
        }
      } else {
        // For content with no tags, add to 'untagged' category
        trie.addContent("untagged", contentItem)
      }
    }
    
    return trie
  }

  entries(): [FullSlug, TagTrieNode][] {
    const traverse = (node: TagTrieNode): [FullSlug, TagTrieNode][] => {
      const result: [FullSlug, TagTrieNode][] = [[node.slug, node]]
      return result.concat(...node.children.map(traverse))
    }

    return traverse(this)
  }

  getFolderPaths() {
    return this.entries()
      .filter(([_, node]) => node.isFolder)
      .map(([path, _]) => path)
  }
}
