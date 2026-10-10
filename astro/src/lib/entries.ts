// A note joined to its collection entry, for a page that renders the note's body. Everything else
// a page asks about a note, it asks the notes query (./notes.ts).

import { getCollection, getEntry, type CollectionEntry } from "astro:content"
import { getNote, type Note, type NoteFacts } from "./notes.ts"

export type NoteEntry = CollectionEntry<"notes">

/** Every published note with its collection entry: what a route's `getStaticPaths` maps over. */
export async function getNoteEntries(): Promise<Array<{ note: Note; entry: NoteEntry }>> {
  const entries = await getCollection("notes")
  return entries.flatMap((entry) => {
    const note = getNote(entry.id)
    return note ? [{ note, entry }] : []
  })
}

/** A note's collection entry, published or not: an unpublished note's body is still rendered somewhere. */
export async function entryOf(note: NoteFacts): Promise<NoteEntry> {
  const entry = await getEntry("notes", note.id)
  if (!entry) throw new Error(`The note ${note.file.path} has no entry in the notes collection.`)
  return entry
}
