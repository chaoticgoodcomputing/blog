# quartz-annotator

`@chaoticgoodcomputing/quartz-annotator`, manifest name `cgc-annotator`, loaded by package name (#89, #94): the Quartz 5 plugin that displays annotations written with the Obsidian
[Annotator](https://github.com/elias-sundqvist/obsidian-annotator) plugin. It is that plugin's
Quartz sibling, mapping one to one: Annotator writes annotations in the vault, and `cgc-annotator`
shows them on the site. Inherits the family vocabulary in [`quartz-v5/CONTEXT.md`](../../CONTEXT.md).
One package with three halves (#37): a transformer, a page type and an emitter. Its notes run
through [`@chaoticgoodcomputing/pipeline`](../../libs/pipeline/CONTEXT.md), and its Viewer is an
island of [`@chaoticgoodcomputing/island-runtime`](../../libs/island-runtime/CONTEXT.md). Both
libraries are inlined into this plugin's build.

## Language

**Annotation page**:
A note whose frontmatter names an `annotation-target`. It shows its annotations next to the
source document they were written against, in the `full-width` frame, under the layout key
`annotation`.
_Avoid_: annotated note, PDF page

**Page header**:
The annotation page's own header: its title, date and reading time, and tags, which the layout
places before the body. A frame that sees the body's `takesPageHeader` hands it to the body as
children, and the body puts it at the top of the annotations panel, over where the source document
comes from (docs/adr/0003). Under any other frame it stays above the page.
_Avoid_: title block, heading (that is the panel's "Annotations")

**Source document**:
The file at an annotation page's `annotation-target` URL. Owned by someone else, and always
addressed by URL, even when it is our own work.
_Avoid_: target, PDF, original

**Annotation**:
One passage of the source document, as its `TextQuoteSelector` quotes it, with what was written
about it: its note, tags and date. Annotator keeps each one as a JSON block in the annotation page,
which this plugin takes out of the page's body.
_Avoid_: highlight (that is the Viewer's mark over a passage), comment

**Note**:
The markdown written on an annotation. Rendered through the site's configured pipeline minus the
denylist, as a passage of its page, and counted in the page's links and text (docs/adr/0002).
_Avoid_: comment, annotation text (in prose), body

**Denylist**:
The transformers a note is rendered without, by transformer name, as `@chaoticgoodcomputing/pipeline`
defines it. By default the ones that act on a whole page. This plugin's own transformer is always
left out.
_Avoid_: blocklist, excluded plugins

**Mirror**:
Our pinned copy of a source document, served from the site. Taken once and then kept, because
it is the document the annotations were written against.
_Avoid_: download, local copy, cached PDF

**Viewer**:
The part of an annotation page that renders the mirror with its highlights: an island over the
document, beside the annotations, which are the page's own static HTML. Only the viewer degrades
when the mirror is unavailable. The annotations themselves always render.
_Avoid_: PDF viewer, reader

**Highlight**:
The Viewer's mark over the characters of an annotation's passage, where it finds them in the
document: one box per line, laid on once. A line's pieces of text are joined into its box, and
nothing is covered twice (#87). An annotation whose passage it can't find has none.
_Avoid_: annotation, selection

**Slice**:
Reserved. A page range taken from a mirror, so that several annotation pages can share one source
document. Not a feature yet.
_Avoid_: excerpt, chapter
