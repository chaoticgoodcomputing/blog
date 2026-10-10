// The graph index, at /graph.json: every published note, its date, its tags and the notes it links
// to, which every graph is drawn from in the reader's browser (src/lib/graph-index.ts). A private
// page is in it, flagged.
import type { APIRoute } from "astro"
import { graphIndex } from "../lib/graph-index.ts"

export const GET: APIRoute = () => Response.json(graphIndex())
