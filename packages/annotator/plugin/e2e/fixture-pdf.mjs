// A small PDF for the end-to-end suite, written out byte by byte, so the suite needs no PDF of
// anyone else's: four pages of text in Helvetica, one of PDF's standard fonts, which PDF.js draws
// with the font data it ships.

/** One page's text, as lines from the top. */
export const PAGES = [
  ["The first page of the fixture.", "Annotate this sentence, please.", "A line nobody annotates."],
  ["The second page of the fixture.", "Another passage worth a comment."],
  ["The third page of the fixture.", "A passage in the middle of the book."],
  ["The fourth page of the fixture.", "The last words of all."],
]

const escape = (text) => text.replace(/[\\()]/g, (character) => `\\${character}`)

/** The PDF, as bytes. */
export function fixturePdf() {
  const objects = []
  const add = (body) => objects.push(body) // object n is objects[n - 1]

  add("<< /Type /Catalog /Pages 2 0 R >>")
  const pageIds = PAGES.map((_, index) => 4 + index * 2)
  add(`<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${PAGES.length} >>`)
  add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>")
  for (const [index, lines] of PAGES.entries()) {
    const content = ["BT", "/F1 18 Tf", "72 720 Td", "24 TL", ...lines.map((line, at) => `${at ? "T* " : ""}(${escape(line)}) Tj`), "ET"].join("\n")
    add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${pageIds[index] + 1} 0 R >>`)
    add(`<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}\nendstream`)
  }

  let pdf = "%PDF-1.4\n"
  const offsets = []
  for (const [index, body] of objects.entries()) {
    offsets.push(Buffer.byteLength(pdf, "latin1"))
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`
  }
  const xref = Buffer.byteLength(pdf, "latin1")
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  pdf += offsets.map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("")
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  return Buffer.from(pdf, "latin1")
}
