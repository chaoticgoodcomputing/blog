// Prints a note's cross-post: its page's body as Markdown, for a site it is posted to by hand
// (src/lib/feed-content.ts). Made from the page as the last build wrote it, so build first:
//
//   pnpm run crosspost /content/notes/dashes
//
// What only works on the page (a widget, a diagram, an annotated document's annotations) is a quote
// that links to the page, a drawing its PNG where it has one, a callout a plain quote, and every
// link a whole address.

import fs from "node:fs"
import { fileURLToPath } from "node:url"
import { getDrawingPngs } from "../src/lib/drawings.ts"
import { crosspostMarkdown } from "../src/lib/feed-content.ts"
import { getNotes } from "../src/lib/notes.ts"

const SITE = new URL("https://blog.chaoticgood.computer")
const dist = fileURLToPath(new URL("../dist/", import.meta.url))

const addresses = process.argv.slice(2)
if (addresses.length === 0) {
  console.error("Name a note by its page's address: pnpm run crosspost /content/notes/dashes")
  process.exit(1)
}

const notes = getNotes()
const pngs = getDrawingPngs()
for (const given of addresses) {
  const address = given.startsWith("http") ? new URL(given).pathname : `/${given.replace(/^\/|\.md$|\.html$/g, "")}`
  const note = notes.find((each) => each.url === address)
  if (!note || note.isPrivate) {
    console.error(`No public note is at ${address}.`)
    process.exit(1)
  }
  const html = fs.readFileSync(`${dist}${decodeURI(note.url).slice(1)}.html`, "utf8")
  console.log(`# ${note.title}\n\n${crosspostMarkdown(note, html, SITE, pngs)}`)
}
