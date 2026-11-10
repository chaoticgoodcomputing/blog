# Decisions

Where the spec left room, or contradicted itself, and what the package does.

- **Touching page runs merge.** §3 says runs that touch merge (`3-5, 6-8` → `[[3, 8]]`) but gives `9, 3-5, 4-8` → `[[3, 8], [9, 9]]`; the rule wins, so that is `[[3, 9]]` (`3-9`), the same set of pages.
- **An empty page list is malformed** (`annotation-pages: []`); a null value reads as absent.
- **Page numbers must be integers**: `2.5` is malformed.
- **`annotation-target-type` other than `web` is an error**, not read as a document.
- **A non-string or empty `annotation-target`** is an error naming that property.
- **Frontmatter that isn't YAML** is an `AnnotationPropertyError` for the property `frontmatter`.
- **Source only, no build target**, like the sibling libraries: whoever uses it compiles `src/`.
- **The comment comes beside the record** (`NoteAnnotation.comment`), not spliced into its body, so the record stays exactly as stored.
- **No comment is the empty string**; a comment of only blank lines is no comment.
- **The callout type is matched case-insensitively** (`[!ANNOTATION]`), as Obsidian matches callouts.
- **A callout with no block id line** is an error, and still counts as a block when placing and removing others.
- **A block id used twice** is an error on the second block.
- **Every unreadable block** stays in the note untouched; writes refuse its block id.
- **A write that changes nothing** returns the note as it was, `modified` included.
- **Updating keeps what the content leaves out**: an omitted comment, tags or target stays as it was.
- **Rewritten records keep the canonical key order**, then unknown fields in their old order; unknown fields of the target object are kept too.
- **Bodies that are neither comment reference nor tag** are kept, after them.
- **Removing a block** takes the blank line after it when another block follows, otherwise the blank line before it; a note's only block goes alone.
- **Removing a parent leaves its replies**; the caller removes them if it wants.
- **Adding to a note with no blocks** appends enough line endings for one blank line, and the new block always ends with a line ending.
- **Adding after a last block with no final line ending** adds the missing one, then the blank line.
- **Block ids are drawn again** (up to 100 times) until one isn't used anywhere in the note.
- **Writes take an optional `Mint`** (time, block id, UUID); the default uses Web Crypto and the clock.
- **A new annotation's `created` is the write's time**, not the client's.
- **A Hypothesis id the note doesn't have is an error**, not a new annotation.
- **`references` is written only for replies**; a reply whose parent is missing stops the walk there, and falls back to the note's target for its `uri`.
- **`toHypothesis` maps a whole note** and takes the note's title from the caller; the service adds user, group and the rest.
