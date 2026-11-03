// `nx run site:tag-names`: fails when two tags of the assembled vault, dist/vault, share a name,
// the last level of each, whatever the case (src/lib/tag-names.ts). git:commit runs it, so no such
// vault is committed. Read-only.

import { tagNameClashes } from "../src/lib/tag-names.ts"
import { getNotes, tagsOf } from "../src/lib/notes.ts"

const tags = [...tagsOf(getNotes()).keys()]
const clashes = tagNameClashes(tags)
if (clashes.size > 0) {
  console.error("Tags can't share a name, since the feed and /tags/<name> name a tag by it alone:")
  for (const [name, holders] of clashes) console.error(`  ${name}: ${holders.join(", ")}`)
  process.exit(1)
}
console.log(`${tags.length} tags, each with a name of its own.`)
