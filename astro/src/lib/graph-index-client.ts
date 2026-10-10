// The graph index (src/pages/graph.json.ts), as the browser fetches it: once for the document,
// however many pages the client router brings in and however many graphs a page draws. On a failure
// the next to ask asks again. The site builds the index with src/lib/graph-index.ts.

import { GRAPH_INDEX, type GraphIndex } from "./graph.ts"

let index: Promise<GraphIndex> | undefined

/** The graph index the site publishes. */
export function loadGraphIndex(): Promise<GraphIndex> {
  return (index ??= fetch(GRAPH_INDEX)
    .then((response) => {
      if (!response.ok) throw new Error(`${GRAPH_INDEX}: ${response.status}`)
      return response.json() as Promise<GraphIndex>
    })
    .catch((error) => {
      index = undefined
      throw error
    }))
}
