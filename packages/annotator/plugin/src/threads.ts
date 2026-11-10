// Deleting an annotation from the sidebar. A thread is one thing to the reader: deleting its root
// deletes its replies, and theirs, which would otherwise name an annotation the note no longer has.

import { readNote, removeAnnotation } from "@chaoticgoodcomputing/web-annotations"

/** The note without annotation `blockId` and every reply under it. Throws for an id the note doesn't have. */
export function removeThread(note: string, blockId: string): string {
  const { annotations } = readNote(note)
  const gone = new Set<string>()
  const ids = new Set<string>()
  const root = annotations.find((annotation) => annotation.blockId === blockId)
  if (root) {
    gone.add(root.blockId)
    ids.add(root.record.id)
    // Replies come after their parents, so one pass in order finds every one.
    for (const annotation of annotations) {
      const { target } = annotation.record
      if (typeof target === "string" && ids.has(target)) {
        gone.add(annotation.blockId)
        ids.add(annotation.record.id)
      }
    }
  }
  let text = removeAnnotation(note, blockId)
  for (const id of gone) if (id !== blockId) text = removeAnnotation(text, id)
  return text
}
