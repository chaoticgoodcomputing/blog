// Remote content a site build fetches, such as cgc-annotator's source documents, served from a
// local host instead of the network. Each host listens on a port of the OS's choosing, so any
// number of specs and suite copies can run at once.
import http from "node:http"

/** A route that accepts the request and never answers. */
export const HANG = Symbol("hang")

/**
 * Start a host. `routes` maps a path to the body it serves as a PDF, to a function returning
 * `{ body, type }` per request, to `{ redirect: path }`, or to HANG. A path with no route is a 404.
 * Routes may be added after the host has started.
 */
export async function sourceHost(routes = {}) {
  const hits = []
  const server = http.createServer((req, res) => {
    hits.push(req.url)
    const route = routes[req.url]
    if (route === undefined) return res.writeHead(404).end()
    if (route === HANG) return
    if (route.redirect) return res.writeHead(302, { location: route.redirect }).end()
    const { body, type = "application/pdf" } = typeof route === "function" ? route() : { body: route }
    res.writeHead(200, { "content-type": type }).end(body)
  })
  await new Promise((listening) => server.listen(0, "127.0.0.1", listening))
  return {
    /** The absolute URL of a path on this host. */
    url: (route) => `http://127.0.0.1:${server.address().port}${route}`,
    /** How many requests a path has had. */
    hits: (route) => hits.filter((hit) => hit === route).length,
    close: () => new Promise((closed) => (server.closeAllConnections(), server.close(closed))),
  }
}

/** A port nothing listens on: the OS handed it out, and it has been given back. */
export async function closedPort() {
  const server = http.createServer()
  await new Promise((listening) => server.listen(0, "127.0.0.1", listening))
  const { port } = server.address()
  await new Promise((closed) => server.close(closed))
  return port
}

/** Just enough of a PDF to be one: the header every PDF starts with, and a label to tell them apart. */
export const pdf = (label) =>
  `%PDF-1.4\n% ${label}\n1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj\n2 0 obj <</Type /Pages /Kids [] /Count 0>> endobj\ntrailer <</Root 1 0 R>>\n%%EOF\n`

/** Where the fixture's annotation page says its source document is: a domain that never resolves. */
export const FIXTURE_PAPER_URL = "https://cgc-fixture.invalid/paper.pdf"

/**
 * The fixture's two-page source document, at FIXTURE_PAPER_URL, a real PDF with text for the Viewer to draw and anchor
 * passages in. Written out here rather than tracked in git, where no PDF goes (#59); every offset in
 * its cross-reference table is counted as it is written.
 */
export function fixturePaper() {
  const stream = (lines) => {
    const body = lines.join("\n")
    return `<< /Length ${Buffer.byteLength(body)} >>\nstream\n${body}\nendstream`
  }
  const page = (contents) => `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contents} 0 R >>`
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [5 0 R 7 0 R] /Count 2 >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    stream([
      "BT /F1 24 Tf 72 700 Td (Fixture paper, page one) Tj ET",
      "BT /F1 14 Tf 72 660 Td (The annotator draws highlights over quoted passages.) Tj ET",
      "BT /F1 14 Tf 72 630 Td (A second sentence that a note quotes in full.) Tj ET",
      "0 0 0 1 k BT /F1 14 Tf 72 600 Td (Printed in process black, to wake the colour engine.) Tj ET",
    ]),
    page(4),
    stream([
      "BT /F1 24 Tf 72 700 Td (Fixture paper, page two) Tj ET",
      // A line a passage covers whole, from the line before it into the line after (#87).
      "BT /F1 14 Tf 72 500 Td (A line quoted whole, inside a longer passage.) Tj ET",
      "BT /F1 14 Tf 72 300 Td (Quoted on the last page, far below the fold.) Tj ET",
    ]),
    page(6),
    "<< /Title (cgc-annotator fixture paper) /Producer (written by the cgc e2e harness) >>",
  ]
  let out = "%PDF-1.4\n"
  const offsets = objects.map((object, i) => {
    const offset = Buffer.byteLength(out)
    out += `${i + 1} 0 obj\n${object}\nendobj\n`
    return offset
  })
  const xref = Buffer.byteLength(out)
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (const offset of offsets) out += `${String(offset).padStart(10, "0")} 00000 n \n`
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info ${objects.length} 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  return out
}
