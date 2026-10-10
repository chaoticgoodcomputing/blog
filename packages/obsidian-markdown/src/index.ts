// Obsidian Markdown for Sätteri, in three layers:
//
//   syntax    what the author wrote, as mdast nodes: wikilinks, embeds, comments, highlights, tags,
//             block ids, callouts. Knows no vault.                               (./syntax)
//   metadata  what a note holds, read from that tree, and across a vault the links between notes:
//             Obsidian's `CachedMetadata` and `MetadataCache`.                   (./metadata, ./vault)
//   resolve   where each link goes on a site, given the vault, and what an embedded note shows.
//                                                                       (./resolve, ./embed)
//
// And for what two of Obsidian's community plugins write into a note: Excalidraw's drawings
// (./excalidraw) and Annotator's annotations (./annotator).

export { obsidianSyntax, obsidianFeatures, CALLOUT, HIGHLIGHT, TAG, WIKILINK, blockAnchor } from "./syntax/index.ts"
export type { SyntaxOptions } from "./syntax/index.ts"
export { obsidianMetadata, parseMetadata, getAllTags, parseFrontMatterAliases, METADATA_KEY } from "./metadata.ts"
export type { ParseOptions } from "./metadata.ts"
export { Vault, MetadataCache } from "./vault.ts"
export type { VaultOptions, LinkCounts, SubpathResult } from "./vault.ts"
export { obsidian, obsidianResolve, isImageFile } from "./resolve.ts"
export type { ObsidianOptions, ResolveOptions } from "./resolve.ts"
export { obsidianExcalidraw, isExcalidraw, excalidrawExports, withoutExcalidrawBackground } from "./excalidraw.ts"
export type { ExcalidrawOptions, ExcalidrawExport } from "./excalidraw.ts"
export { obsidianAnnotator, annotationTarget, parseAnnotations, ANNOTATION, ANNOTATIONS } from "./annotator.ts"
export type { AnnotatorOptions, Annotation, ParsedAnnotations } from "./annotator.ts"
export {
  parseLinktext,
  getLinkpath,
  parseWikilink,
  decodeLinkUrl,
  defaultDisplayText,
  isExternalUrl,
  normalizeTag,
} from "./linktext.ts"
export type { ParsedWikilink } from "./linktext.ts"
export type * from "./types.ts"
