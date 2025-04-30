import { FullSlug } from "./path"

// Common interface that both FileTrieNode and TagTrieNode will implement
export interface TrieNode<T = any> {
  isFolder: boolean;
  children: Array<TrieNode<T>>;
  slug: FullSlug;
  slugSegment: string;
  displayName: string;
  
  // Common methods
  filter(filterFn: (node: TrieNode<T>) => boolean): void;
  map(mapFn: (node: TrieNode<T>) => void): void;
  sort(sortFn: (a: TrieNode<T>, b: TrieNode<T>) => number): void;
  getFolderPaths(): FullSlug[];
  entries(): [FullSlug, TrieNode<T>][];
  
  // Method to get content for display
  getContentNodes(): Array<{
    slug: FullSlug;
    displayName: string;
  }>;
}

// Factory function to create appropriate trie node
export function createTrie(
  useTagsAsFolders: boolean, 
  entries: [FullSlug, any][]
): TrieNode {
  if (useTagsAsFolders) {
    // Import dynamically to avoid circular dependencies
    const { TagTrieNode } = require("./tagTrie");
    const contentIndex = new Map(entries);
    return TagTrieNode.fromContentIndex(contentIndex);
  } else {
    const { FileTrieNode } = require("./fileTrie");
    return FileTrieNode.fromEntries(entries);
  }
}
