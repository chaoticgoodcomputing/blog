// A reader's trail: the notes they came through to the note shown, oldest first, ending with it,
// at most site configuration's `trail.length`. The address carries it: the note shown is the
// page's own path, and the notes before it are `trail` in its query, oldest first, so a page
// rendered from its path alone is the note the reader sees. Pure, and run in the browser, where the
// layout reads a trail from the address and extends it as the reader follows a link.

import { trail as settings } from "../site.config.ts"

/** A trail: notes' addresses from the site's root, not encoded, oldest first, the note shown last. */
export type Trail = readonly string[]

/** The query key each note before the note shown is under. */
export const TRAIL_KEY = "trail"

// A note's address as a trail holds it: decoded, without a trailing slash.
function normal(address: string): string {
  const path = decodeURI(address).replace(/\/+$/, "")
  return path === "" ? "/" : path
}

/**
 * The trail after following a link from its last note to the note at `to`: back to that note,
 * letting the notes after it go, if the trail has it; else on to it, letting the oldest go past
 * `length`.
 */
export function follow(trail: Trail, to: string, length = settings.length): Trail {
  const note = normal(to)
  const at = trail.indexOf(note)
  if (at !== -1) return trail.slice(0, at + 1)
  return [...trail, note].slice(-length)
}

/**
 * The trail an address carries: the notes in its query, then its own page, read as if the reader
 * had followed each in turn, so a note named twice, or the page's own, is gone back to.
 */
export function trailOf(address: URL, length = settings.length): Trail {
  const notes = [...address.searchParams.getAll(TRAIL_KEY), address.pathname]
  return notes.reduce<Trail>((trail, note) => follow(trail, note, length), [])
}

/** The address of a trail's last note, carrying the notes before it. */
export function addressOf(trail: Trail): string {
  const query = new URLSearchParams(trail.slice(0, -1).map((note) => [TRAIL_KEY, note])).toString()
  return `${encodeURI(trail.at(-1) ?? "/")}${query ? `?${query}` : ""}`
}
