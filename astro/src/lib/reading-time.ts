// How long a note takes to read, in whole minutes. The note's page shows it beside its date, and
// the feed and the share card show the same number, so all of them ask here.
//
// It is counted from the note's text as the vault read it, not from its rendered page, so that
// anything with a note can ask without rendering it (docs/adr/1001).

import type { Vault } from "@chaoticgoodcomputing/obsidian-markdown"
import readingTime from "reading-time"
import type { NoteFacts } from "./notes.ts"
import { getVault } from "./vault.ts"

/** Words read in a minute: reading-time's default, and what the site has always counted by. */
const WORDS_PER_MINUTE = 200

/**
 * The minutes a note takes to read: the words a reader reads of it, its frontmatter and comments
 * left out, at two hundred a minute, with a minute begun counted whole. A note with no text takes
 * none. `vault` is the vault the note is of.
 */
export function readingMinutes(note: NoteFacts, vault: Vault = getVault()): number {
  const text = vault.readText(note.file) ?? ""
  return Math.ceil(readingTime(text, { wordsPerMinute: WORDS_PER_MINUTE }).minutes)
}
