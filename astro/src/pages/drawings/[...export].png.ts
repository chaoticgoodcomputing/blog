// The PNG the Excalidraw plugin exports beside a drawing's SVG, where it has one, at the SVG's
// address with `.png` for `.svg` (src/lib/drawings.ts). No page shows it: the feed does, where an SVG
// may not be shown (src/lib/feed-content.ts). It keeps the canvas it was drawn on, since a feed's
// reader may show it on any background.
import fs from "node:fs"
import path from "node:path"
import type { APIRoute, GetStaticPaths } from "astro"
import { getDrawingExports } from "../../lib/drawings.ts"
import { getVault } from "../../lib/vault.ts"

const PREFIX = "/drawings/"
const SUFFIX = ".png"

export const getStaticPaths = (() =>
  getDrawingExports({ strict: false }).flatMap(({ png }) =>
    png ? [{ params: { export: png.url.slice(PREFIX.length, -SUFFIX.length) }, props: { path: png.file.path } }] : [],
  )) satisfies GetStaticPaths

export const GET: APIRoute<{ path: string }> = ({ props }) => {
  const file = getVault().getFileByPath(props.path)
  if (!file) return new Response(null, { status: 404 })
  return new Response(fs.readFileSync(path.join(getVault().root, file.path)), { headers: { "Content-Type": "image/png" } })
}
