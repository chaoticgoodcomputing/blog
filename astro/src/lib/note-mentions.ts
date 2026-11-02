// Every mention the `mentions` collection holds (./mentions.ts), asked of it once for a build, not
// once for each page that shows its note's. The dev server asks each time, so a page shows the
// mentions as the collection last loaded them.

import { getCollection } from "astro:content"
import type { Mention } from "./mentions.ts"

let all: Promise<Mention[]> | undefined

const load = async (): Promise<Mention[]> => (await getCollection("mentions")).map((entry) => entry.data)

export const getMentions = (): Promise<Mention[]> => (import.meta.env.DEV ? load() : (all ??= load()))
