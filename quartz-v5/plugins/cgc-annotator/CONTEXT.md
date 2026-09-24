# cgc-annotator

The Quartz 5 plugin that displays annotations written with the Obsidian
[Annotator](https://github.com/elias-sundqvist/obsidian-annotator) plugin. It is that plugin's
Quartz sibling, mapping one to one: Annotator writes annotations in the vault, and `cgc-annotator`
shows them on the site. Inherits the family vocabulary in [`quartz-v5/CONTEXT.md`](../../CONTEXT.md).

## Language

**Annotation page**:
A note whose frontmatter names an `annotation-target`. It shows its annotations next to the
source document they were written against.
_Avoid_: annotated note, PDF page

**Source document**:
The file at an annotation page's `annotation-target` URL. Owned by someone else, and always
addressed by URL, even when it is our own work.
_Avoid_: target, PDF, original

**Mirror**:
Our pinned copy of a source document, served from the site. Taken once and then kept, because
it is the document the annotations were written against.
_Avoid_: download, local copy, cached PDF

**Viewer**:
The part of an annotation page that renders the mirror with its highlights. Only the viewer
degrades when the mirror is unavailable. The annotations themselves always render.
_Avoid_: PDF viewer, reader

**Slice**:
Reserved. A page range taken from a mirror, so that several annotation pages can share one source
document. Not a feature yet.
_Avoid_: excerpt, chapter
