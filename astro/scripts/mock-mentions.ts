// Writes made-up webmentions for the dev server, dist/mock-mentions.json, as webmention.io's API
// would give them (src/lib/mock-mentions.ts): `pnpm nx run astro:mock-mentions`, which `astro:dev`
// runs first. The dev server's loader reads them from WEBMENTIONS_FILE (src/lib/mentions.ts); a
// build never does. They mention the three newest public posts, and a note by one of its aliases.

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { aliasRedirects, publishedFiles, staticPages } from "../src/lib/aliases.ts"
import { mockMentions } from "../src/lib/mock-mentions.ts"
import { getNotes, getUnpublished, isHomeNote, newestFirst } from "../src/lib/notes.ts"

// The host is never read: a mention's note is found by its target's path (noteAddressOf).
const SITE = "https://blog.chaoticgood.computer"
const out = fileURLToPath(new URL("../../dist/mock-mentions.json", import.meta.url))

const notes = getNotes()
const posts = notes.filter((note) => !note.isPrivate && !isHomeNote(note) && note.date).sort(newestFirst)
const published = new Set(notes.filter((note) => !note.isPrivate).map((note) => note.url))
const { redirects } = aliasRedirects(notes, staticPages(), publishedFiles(), getUnpublished("tag description"))
const alias = Object.entries(redirects).find(([, to]) => published.has(to))?.[0]

const children = mockMentions({ site: SITE, notes: posts.slice(0, 3).map((note) => note.url), alias })
fs.mkdirSync(path.dirname(out), { recursive: true })
fs.writeFileSync(out, `${JSON.stringify({ type: "feed", children }, null, 2)}\n`)
console.log(`${children.length} mock webmentions written to ${path.relative(process.cwd(), out)}.`)
