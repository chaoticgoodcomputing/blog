import { PDFPageData, TextPosition } from "./types"

/**
 * Extract text content from a PDF page (simplified - TextLayer handles positioning)
 */
export async function extractPageText(
  page: any,
  pageNum: number,
  scale: number,
  cumulativeOffset: number,
): Promise<PDFPageData> {
  const viewport = page.getViewport({ scale })
  // normalizeWhitespace matches the option Hypothesis sets when creating TextPositionSelector
  // offsets — without it the extracted string diverges from the one used at annotation time.
  const textContent = await page.getTextContent({ normalizeWhitespace: true })
  const pageText = textContent.items.map((item: any) => item.str).join("")

  return {
    pageNum,
    text: pageText,
    positions: [], // No longer needed - TextLayer provides positioning
    textItems: textContent.items,
    viewport,
    startOffset: cumulativeOffset,
    endOffset: cumulativeOffset + pageText.length,
  }
}

/**
 * Find which page contains a character offset
 */
export function findPageForOffset(charOffset: number): number | null {
  if (!window.pdfTextData) return null

  const pageData = window.pdfTextData.find(
    (p) => charOffset >= p.startOffset && charOffset < p.endOffset,
  )

  return pageData?.pageNum ?? null
}
