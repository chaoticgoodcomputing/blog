/**
 * Type definitions for annotation viewer
 */

export interface PDFPageData {
  pageNum: number
  text: string
  positions: CharacterPosition[]
  textItems: any[]
  viewport: any
  startOffset: number
  endOffset: number
}

export interface CharacterPosition {
  char: string
  x: number
  y: number
  width: number
  height: number
  absoluteOffset: number
}

export interface TextPosition {
  pageNum: number
  y: number
  text: string
}

export interface Annotation {
  id: string
  target: AnnotationTarget[]
  [key: string]: any
}

export interface AnnotationTarget {
  selector?: AnnotationSelector[]
  [key: string]: any
}

export interface AnnotationSelector {
  type: string
  start?: number
  end?: number
  [key: string]: any
}

declare global {
  interface Window {
    pdfjsLib: any
    pdfTextData: PDFPageData[]
    pdfScale: number
    annotationsData: Annotation[]
    renderHighlights: (annotation: Annotation) => void
    renderAllHighlights: (activeAnnotationId?: string) => void
    setActiveHighlight: (annotationId: string) => void
  }
}

export {}
