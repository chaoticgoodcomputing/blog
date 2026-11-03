// Writes a made-up discussion for the dev server, one file for each source of it, as each source's
// API would give it (src/lib/mock-mentions.ts): `pnpm nx run site:mock-mentions`, which `site:dev`
// runs first. The dev server's loaders read them, each from its own variable; a build never does:
//
//   - dist/mock-mentions.json, the webmentions, from WEBMENTIONS_FILE (src/lib/mentions.ts);
//   - dist/mock-bluesky.json, the account's posts, from BLUESKY_POSTS_FILE (src/lib/bluesky-posts.ts);
//   - dist/mock-hacker-news.json, a thread, from HACKER_NEWS_FILE (src/lib/hacker-news.ts).
//
// They are of the three newest public posts, and a note by one of its aliases.

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { aliasRedirects, publishedFiles, staticPages } from "../src/lib/aliases.ts"
import { mockBlueskyFeed, mockHackerNews, mockMentions } from "../src/lib/mock-mentions.ts"
import { getNotes, getUnpublished, isHomeNote, newestFirst } from "../src/lib/notes.ts"

// The host is read only to tell the site's pages from others': it must be the site's.
const SITE = "https://blog.chaoticgood.computer"
const dist = fileURLToPath(new URL("../../dist/", import.meta.url))

const notes = getNotes()
const posts = notes.filter((note) => !note.isPrivate && !isHomeNote(note) && note.date).sort(newestFirst)
const published = new Set(notes.filter((note) => !note.isPrivate).map((note) => note.url))
const { redirects } = aliasRedirects(notes, staticPages(), publishedFiles(), getUnpublished("tag description"))
const alias = Object.entries(redirects).find(([, to]) => published.has(to))?.[0]
const targets = { site: SITE, notes: posts.slice(0, 3).map((note) => note.url), alias }

const write = (file: string, data: unknown) => {
  fs.mkdirSync(dist, { recursive: true })
  fs.writeFileSync(path.join(dist, file), `${JSON.stringify(data, null, 2)}\n`)
  return path.relative(process.cwd(), path.join(dist, file))
}

const children = mockMentions(targets)
console.log(`${children.length} mock webmentions written to ${write("mock-mentions.json", { type: "feed", children })}.`)
const { feed } = mockBlueskyFeed(targets)
console.log(`${feed.length} mock Bluesky post written to ${write("mock-bluesky.json", { feed })}.`)
const thread = mockHackerNews(targets)
console.log(`${thread.hits.length} mock Hacker News thread written to ${write("mock-hacker-news.json", thread)}.`)
