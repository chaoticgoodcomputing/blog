// A scanned PDF for the tests, made from a scan kept as a PBM (test/fixtures/garden.pbm.gz: text
// drawn once in a browser and thresholded), so no PDF is kept in the repository. Its pages:
//
//   1. the scan as an image mask, a little rotated, as a scanned book's pages are stored;
//   2. text of its own, which needs no recognizing;
//   3. nothing;
//   4. the scan again, as a 1-bit grey image, the other way scans are stored.

import { readFileSync } from "node:fs"
import { deflateSync, gunzipSync } from "node:zlib"

export const SCAN_TEXT = [
  "A garden path should bend a little, so that",
  "whoever walks along it cannot see the end",
  "from the gate, and finds the bench by surprise.",
  "Every window wants a deep sill to sit on, and",
  "light from two sides of the room at once;",
  "a room lit from one side only feels like a",
  "corridor, however wide it is made.",
]

/** The scan: its size, and its bits, a row at a time, 1 for black. */
export function scan() {
  const pbm = gunzipSync(readFileSync(new URL("./fixtures/garden.pbm.gz", import.meta.url)))
  const [, width, height, headerLength] = /^P4\n(\d+) (\d+)\n/.exec(pbm.toString("latin1", 0, 32))!.map((x, i) => (i === 0 ? x.length : Number(x))) as [number, number, number, number]
  return { width, height, bits: pbm.subarray(headerLength) }
}

/** A PDF of one page of text of its own: nothing to recognize. */
export function textOnlyPdf(): Uint8Array {
  return pdfOf(false)
}

/** A PDF of the pages above. */
export function scannedPdf(): Uint8Array {
  return pdfOf(true)
}

function pdfOf(scanned: boolean): Uint8Array {
  const { width, height, bits } = scan()
  // The scan at 300 dpi, on a page with an inch around it.
  const w = (width / 300) * 72
  const h = (height / 300) * 72
  const pageW = w + 144
  const pageH = h + 144
  // 0.4 degrees, written out, so the PDF is the same byte for byte wherever it is made.
  const [cos, sin] = [0.99997563, 0.00698126]
  const placed = `q ${(w * cos).toFixed(4)} ${(w * sin).toFixed(4)} ${(-h * sin).toFixed(4)} ${(h * cos).toFixed(4)} 72 72 cm`
  const grey = Uint8Array.from(bits, (byte) => ~byte & 0xff)

  const objects: (string | Uint8Array)[] = []
  const add = (body: string | Uint8Array) => objects.push(body) // its number is objects.length
  const stream = (dictionary: string, data: Uint8Array | string) => {
    const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data
    const head = new TextEncoder().encode(`<< ${dictionary} /Length ${bytes.length} >>\nstream\n`)
    const tail = new TextEncoder().encode("\nendstream")
    const out = new Uint8Array(head.length + bytes.length + tail.length)
    out.set(head)
    out.set(bytes, head.length)
    out.set(tail, head.length + bytes.length)
    return out
  }
  add("<< /Type /Catalog /Pages 2 0 R >>") // 1
  add("") // 2: the page tree, once the pages are known
  add(stream(`/Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ImageMask true /BitsPerComponent 1 /Decode [1 0] /Filter /FlateDecode`, deflateSync(bits))) // 3
  add(stream(`/Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceGray /BitsPerComponent 1 /Filter /FlateDecode`, deflateSync(grey))) // 4
  add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>") // 5
  const pages: number[] = []
  const page = (content: string, resources: string) => {
    add(stream("", content))
    add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW.toFixed(2)} ${pageH.toFixed(2)}] /Contents ${objects.length} 0 R /Resources << ${resources} >> >>`)
    pages.push(objects.length)
  }
  if (scanned) page(`${placed} /Scan Do Q`, "/XObject << /Scan 3 0 R >>")
  page("BT /F1 18 Tf 72 200 Td (This page has text of its own.) Tj ET", "/Font << /F1 5 0 R >>")
  if (scanned) {
    page("", "")
    page(`${placed} /Scan Do Q`, "/XObject << /Scan 4 0 R >>")
  }
  objects[1] = `<< /Type /Pages /Kids [${pages.map((n) => `${n} 0 R`).join(" ")}] /Count ${pages.length} >>`

  const chunks: Uint8Array[] = [new TextEncoder().encode("%PDF-1.7\n")]
  let offset = chunks[0]!.length
  const offsets: number[] = []
  objects.forEach((body, i) => {
    const bytes = typeof body === "string" ? new TextEncoder().encode(body) : body
    const head = new TextEncoder().encode(`${i + 1} 0 obj\n`)
    const tail = new TextEncoder().encode("\nendobj\n")
    offsets.push(offset)
    chunks.push(head, bytes, tail)
    offset += head.length + bytes.length + tail.length
  })
  const xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}`
  chunks.push(new TextEncoder().encode(`${xref}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${offset}\n%%EOF\n`))
  const out = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0))
  let at = 0
  for (const c of chunks) {
    out.set(c, at)
    at += c.length
  }
  return out
}
