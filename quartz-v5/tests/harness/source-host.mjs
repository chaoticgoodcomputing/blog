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
