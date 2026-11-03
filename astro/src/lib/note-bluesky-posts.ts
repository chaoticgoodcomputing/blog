// Each note's Bluesky post, from the `blueskyPosts` collection (./bluesky-posts.ts), asked of it
// once for a build, not once for each page that links to its note's. The dev server asks each time.

import { getCollection } from "astro:content"
import type { BlueskyPost } from "./bluesky-posts.ts"

let all: Promise<Map<string, BlueskyPost>> | undefined

const load = async (): Promise<Map<string, BlueskyPost>> =>
  new Map((await getCollection("blueskyPosts")).map((entry) => [entry.data.note, entry.data]))

/** The Bluesky post of the note at `noteUrl`, if the site's account has posted it. */
export async function getBlueskyPost(noteUrl: string): Promise<BlueskyPost | undefined> {
  const posts = await (import.meta.env.DEV ? load() : (all ??= load()))
  return posts.get(noteUrl)
}
