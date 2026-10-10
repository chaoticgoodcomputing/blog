// The tag dictionary, checked against the vault when the site builds. An icon id that names no icon
// fails the build, whether or not a page shows its tag, so a misspelt id is found the day it is
// written. An entry that no note's tag is, or is under, draws nothing, and is reported: a tag that
// was renamed in the vault and not in site configuration. So is a tag of a published note with no
// entry in its lineage: a new tag that was given none.

import type { AstroIntegration } from "astro"
import { getNotes } from "../lib/notes.ts"
import { hasIcon } from "../lib/icons.ts"
import { unknownIcons, unresolvedTags, unusedEntries } from "../lib/tag-dictionary.ts"

export function tagDictionary(): AstroIntegration {
  return {
    name: "tag-dictionary",
    hooks: {
      "astro:build:start": ({ logger }) => {
        const unknown = unknownIcons(hasIcon)
        if (unknown.length > 0) {
          const each = unknown.map(([tag, icon]) => `"${tag}" has "${icon}"`).join(", ")
          throw new Error(`The tag dictionary names icons no collection has: ${each}.`)
        }
        const inUse = getNotes().flatMap((note) => note.tags)
        const unused = unusedEntries(inUse)
        if (unused.length > 0) {
          logger.warn(`${unused.length} tag dictionary entries are no note's tag, nor above one: ${unused.join(", ")}.`)
        }
        // A tag still renders with nothing in its lineage, as a bubble with no colour or icon, so the
        // build goes on; the warning is what says a new tag was given no entry.
        const unresolved = unresolvedTags(inUse)
        if (unresolved.length > 0) {
          logger.warn(`${unresolved.length} tags of published notes have no tag dictionary entry, nor one above them: ${unresolved.join(", ")}.`)
        }
      },
    },
  }
}
