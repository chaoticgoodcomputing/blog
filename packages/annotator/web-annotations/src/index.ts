// Annotation notes as W3C Web Annotations: reading and writing them, their properties, and Hypothesis's JSON.
export { readNote } from "./note.ts"
export type { AnnotationBlockError, AnnotationNote, NoteAnnotation, Span } from "./note.ts"

export { addAnnotation, AnnotationWriteError, removeAnnotation, setRecordFields, updateAnnotation } from "./write.ts"
export type { WriteResult } from "./write.ts"
export type { Mint } from "./mint.ts"

export {
  AnnotationPropertyError,
  formatPageRange,
  pageRangeIncludes,
  parsePageRange,
  readAnnotationProperties,
} from "./properties.ts"
export type { AnnotationProperties, PageRange, TargetType } from "./properties.ts"

export { ANNOTATION_CONTEXT, tagsOf } from "./record.ts"
export type {
  AnnotationContent,
  Body,
  CommentReference,
  Motivation,
  PassageTarget,
  Selector,
  TaggingBody,
  WebAnnotation,
} from "./record.ts"

export { fromHypothesis, toHypothesis } from "./hypothesis.ts"
export type { HypothesisAnnotation, HypothesisTarget } from "./hypothesis.ts"
