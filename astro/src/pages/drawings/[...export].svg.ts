// Every export of every drawing in the vault, each at the address an embed of its drawing names
// (src/lib/drawings.ts), and without the canvas it was drawn on (docs/adr/0301).
import type { APIRoute, GetStaticPaths } from "astro"
import { getDrawingExports, readDrawingExport } from "../../lib/drawings.ts"
import { getVault } from "../../lib/vault.ts"

const PREFIX = "/drawings/"
const SUFFIX = ".svg"

// A build fails while a note embeds a drawing with no export (docs/adr/0302). The dev server keeps
// serving the exports there are: that note's page is the one with nothing to show, and the dev
// server's log names it.
export const getStaticPaths = (() =>
  getDrawingExports({ strict: import.meta.env.PROD }).map(({ file, url }) => ({
    params: { export: url.slice(PREFIX.length, -SUFFIX.length) },
    props: { path: file.path },
  }))) satisfies GetStaticPaths

export const GET: APIRoute<{ path: string }> = ({ props }) => {
  // Asked for again here, not carried from the paths, so the dev server reads the file as the
  // vault was last read.
  const file = getVault().getFileByPath(props.path)
  if (!file) return new Response(null, { status: 404 })
  return new Response(readDrawingExport(file), { headers: { "Content-Type": "image/svg+xml" } })
}
