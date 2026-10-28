# Annotator format

The annotation note's format, as a library the Annotator, its fake service and the site share: how
a note lays out its annotations, and how each one is kept in it. Its words are on top of the
Annotator's (`../plugin/CONTEXT.md`) and the site's (`astro/CONTEXT.md`).

## Language

**Block**:
One annotation as an annotation note keeps it: quoted lines holding its annotation record and its
view, closed by its block id on a line of its own.
_Avoid_: annotation block (where it is plain which is meant), entry, callout

**View**:
The part of a block written from its record for reading in Obsidian: the passage, a link to the
block, the comment and the tags. Where it was edited by hand, it is what is read.
_Avoid_: markdown, rendering, display

**Layout**:
Where a note's preface, blocks and epilogue are, found by position alone, with no markers of its
own.
_Avoid_: structure, sections

**Preface**:
Everything in an annotation note before its first block; all of it, when it has none.
_Avoid_: header, intro

**Epilogue**:
Everything in an annotation note after its last block. What is written between two blocks is
neither: it stays between them.
_Avoid_: footer, outro

**Separation**:
The blank lines that set a block apart from the one before it, which the Annotator writes with a new
block and removes with an old one.
_Avoid_: gap, padding
