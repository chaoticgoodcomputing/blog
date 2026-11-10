# Web annotations

Annotation notes as W3C Web Annotations: a library the Annotator plugin, its local service and the
site share. MIT, unlike its AGPL siblings: it was written clean-room from its spec, without
Obsidian Annotator's code.

## Language

**Annotation note**:
A note whose frontmatter names an annotation target. Its annotations live in its body, one block
each.
_Avoid_: annotation file, highlights note

**Annotation properties**:
What a note's frontmatter says about what it annotates: its target, its target type, and its page
range.
_Avoid_: settings, metadata

**Page range**:
The set of pages of a document the note annotates, numbered from 1. Absent means every page.
_Avoid_: page filter, pages list

**Annotation block**:
One annotation's callout in the note, followed by its block id line.
_Avoid_: annotation callout, entry

**Record**:
The W3C annotation itself, as one line of JSON-LD hidden inside the block.
_Avoid_: payload, metadata, JSON

**Comment**:
The Markdown an annotation says about its passage, written as note text in the block. It is the
record's body, which the record names by a reference to the block.
_Avoid_: note, body text, annotation text

**Block id**:
The `^id` after a block: its anchor in the note, and the annotation's id as the Hypothesis client
knows it.
_Avoid_: anchor, Hypothesis id

**Highlight**:
An annotation with neither comment nor tags: a passage marked and nothing said.

**Reply**:
An annotation that answers another, its parent, rather than a passage. It sits after its parent's
thread.
_Avoid_: response, child

**Preface**:
Everything in the note's body before its first annotation block.

**Epilogue**:
Everything after its last annotation block. Text between two blocks belongs to neither.

**Hypothesis JSON**:
The annotation as the Hypothesis client sends and expects it, which the plugin's local service
speaks. The note keeps only what it needs of it.
_Avoid_: API format, client format
