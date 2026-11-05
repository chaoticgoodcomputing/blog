// The local service over HTTP, on 127.0.0.1, for the Annotator extension
// (packages/annotator/extension), whose local settings name http://127.0.0.1:27183/. Nothing here
// reaches Obsidian: it serves whatever API it is handed (src/vault-service.ts).
//
// Until the extension pairs with the vault (a token it is given, and must send), it is kept to the
// extension by what a browser always says of a request: its `Host`, which a web page can't make
// 127.0.0.1's by rebinding a name of its own to it; and its `Origin`, which a web page's requests
// carry as the page's own, and which the extension's carry as its own, or not at all.

/// <reference types="node" />
// The plugin's sources are typed without Node's (tsconfig.json); this one runs in Obsidian's Node.

import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http"
import type { ApiRequest, ApiResponse } from "./service.ts"

export const DEFAULT_PORT = 27183
const HOST = "127.0.0.1"

/** The largest request body read: far more than any annotation. */
const MAX_BODY = 5 * 1024 * 1024

/** An extension's origin, in Firefox, Chromium or Safari. */
const EXTENSION_ORIGIN = /^(moz|chrome|safari-web)-extension:\/\/[^/]+$/

export interface LocalService {
  port: number
  /** Where the API is, as the client calls it. */
  apiUrl: string
  close(): Promise<void>
}

export interface ServeOptions {
  /** The port to listen on; 0 for any free one. */
  port: number
  /** The API, given where it is: requests under `/api/` go to it. */
  api: (apiUrl: string) => (request: ApiRequest) => Promise<ApiResponse>
  /** Told of a request it answered, or failed to. */
  log?: (message: string) => void
}

/** What the extension opens at the service's address when it is installed. */
const WELCOME = `<!doctype html><meta charset="utf-8"><title>Annotator</title>
<style>body{font:16px/1.5 system-ui,sans-serif;max-width:32em;margin:4em auto;padding:0 1em}</style>
<h1>Annotator is serving your vault</h1>
<p>Annotations made with the Annotator extension are kept in your Obsidian vault, in each page's annotation note.</p>`

/** Starts serving on 127.0.0.1. Rejects when the port is taken. */
export function serve(options: ServeOptions): Promise<LocalService> {
  const { log = () => {} } = options
  let handle: ((request: ApiRequest) => Promise<ApiResponse>) | undefined
  let port = options.port

  const server: Server = createServer((request, response) => {
    void answer(request, response).catch((error) => {
      log(`${request.method} ${request.url}: ${error instanceof Error ? error.message : error}`)
      if (!response.headersSent) response.writeHead(500, { "Content-Type": "application/json" })
      response.end(JSON.stringify({ status: "failure", reason: "The service failed" }))
    })
  })

  async function answer(request: IncomingMessage, response: ServerResponse) {
    const host = request.headers.host
    if (host !== `${HOST}:${port}` && host !== `localhost:${port}`) {
      response.writeHead(421).end()
      return
    }
    const origin = request.headers.origin
    if (origin !== undefined && !EXTENSION_ORIGIN.test(origin)) {
      log(`Refused ${request.method} ${request.url} from ${origin}`)
      response.writeHead(403).end()
      return
    }
    const cors: Record<string, string> = origin
      ? {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE",
          "Access-Control-Allow-Headers": request.headers["access-control-request-headers"] ?? "*",
          Vary: "Origin",
        }
      : {}
    if (request.method === "OPTIONS") {
      response.writeHead(204, cors).end()
      return
    }

    const url = new URL(request.url ?? "/", `http://${HOST}:${port}`)
    if (url.pathname === "/welcome" || url.pathname === "/") {
      response.writeHead(200, { ...cors, "Content-Type": "text/html; charset=utf-8" }).end(WELCOME)
      return
    }
    if (!url.pathname.startsWith("/api/") || !handle) {
      response.writeHead(404, cors).end()
      return
    }

    const body = await readBody(request)
    const answered = await handle({ method: request.method ?? "GET", url: url.href, body })
    const empty = answered.status === 204
    response.writeHead(answered.status, { ...cors, ...(empty ? {} : { "Content-Type": "application/json" }) })
    response.end(empty ? undefined : answered.body)
  }

  return new Promise((resolve, reject) => {
    server.once("error", reject)
    server.listen(options.port, HOST, () => {
      server.off("error", reject)
      const address = server.address()
      port = typeof address === "object" && address ? address.port : options.port
      const apiUrl = `http://${HOST}:${port}/api/`
      handle = options.api(apiUrl)
      resolve({
        port,
        apiUrl,
        close: () =>
          new Promise<void>((done) => {
            server.close(() => done())
            // The extension's connections are kept alive: closing waits for none of them.
            server.closeAllConnections()
          }),
      })
    })
  })
}

async function readBody(request: IncomingMessage): Promise<string | undefined> {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of request) {
    size += (chunk as Buffer).length
    if (size > MAX_BODY) throw new Error("Request body too large")
    chunks.push(chunk as Buffer)
  }
  return chunks.length ? Buffer.concat(chunks).toString("utf8") : undefined
}
