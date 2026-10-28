// The annotation note's format, as the Annotator reads and writes it: where its blocks are, the
// annotation each one keeps, and writing and removing them. Pure TypeScript, with no Obsidian, DOM
// or Node in it, so that the Annotator, its fake service and the site can all read notes the same.

export { parseNote, upsertAnnotation, removeAnnotation } from "./note.ts"
export type { Note, NewAnnotation, WriteOptions } from "./note.ts"
export { serializeBlock, DEFAULT_VIEW } from "./block.ts"
export type { Block, Span, ViewOptions } from "./block.ts"
export type { Annotation, Selector } from "./annotation.ts"
