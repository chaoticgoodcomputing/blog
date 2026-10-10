// Every page's share card, each at its page's address under /share-cards (src/lib/share-card.ts).
// A card is kept in Astro's cache directory, where the next build finds it, and drawn only when
// what it shows has changed (docs/adr/1701).
import { fileURLToPath } from "node:url"
import type { APIRoute, GetStaticPaths } from "astro"
import { cacheDir } from "astro:config/server"
import { getNote } from "../../lib/notes.ts"
import { shareCardDrawer, shareCardOf, shareCardPages } from "../../lib/share-card.ts"

const drawer = shareCardDrawer(fileURLToPath(new URL("share-cards/", cacheDir)))

type Props = { note: string } | { tag: string | undefined }

export const getStaticPaths = (() =>
  shareCardPages().map(({ card, subject }) => ({
    params: { card },
    props: ("note" in subject ? { note: subject.note.id } : subject) satisfies Props,
  }))) satisfies GetStaticPaths

export const GET: APIRoute<Props> = async ({ props, site }) => {
  // The note is asked for again here, not carried from the paths, so the dev server draws it as
  // the vault was last read.
  const note = "note" in props ? getNote(props.note) : undefined
  if ("note" in props && !note) return new Response(null, { status: 404 })
  const card = shareCardOf(note ? { note } : (props as { tag: string | undefined }))
  const png = await drawer.draw(card, site!)
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png" } })
}
