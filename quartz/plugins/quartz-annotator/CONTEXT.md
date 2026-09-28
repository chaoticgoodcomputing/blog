# quartz-annotator

`@chaoticgoodcomputing/quartz-annotator`, manifest name `cgc-annotator`, loaded by package name (#89, #94): the Quartz 5 plugin that displays annotations written with the Obsidian
[Annotator](https://github.com/elias-sundqvist/obsidian-annotator) plugin. It is that plugin's
Quartz sibling, mapping one to one: Annotator writes annotations in the vault, and `quartz-annotator`
shows them on the site. Inherits the family vocabulary in [`quartz/CONTEXT.md`](../../CONTEXT.md).
One package with three halves (#37): a transformer, a page type and an emitter. Its notes run
through [`@chaoticgoodcomputing/pipeline`](../../libs/pipeline/CONTEXT.md), and its Viewer is an
island of [`@chaoticgoodcomputing/island-runtime`](../../libs/island-runtime/CONTEXT.md). Both
libraries are inlined into this plugin's build.

## Language

**Annotation page**:
A note whose frontmatter names an `annotation-target`. It shows its annotations next to the
source document they were written against, in this plugin's own frame, `cgc-annotation`
(docs/adr/0004), under the layout key `annotation`.
_Avoid_: annotated note, PDF page

**Page header**:
The annotation page's own header: its title, date and reading time, and tags, the layout's
before-body components. It heads the top section, above where the source document comes from and
the preface.
_Avoid_: title block, heading

**Preface**:
The author's prose before the source document, from the annotation page's own markdown: whatever
comes before any marker, and under an H1 `Preface` (docs/adr/0005). Rendered by the site's
pipeline as the page's body, and counted in the page's links and text.
_Avoid_: intro, summary, description (the page's `description` is something else)

**Epilogue**:
The author's prose after the source document, from the annotation page's own markdown under an H1
`Epilogue` (docs/adr/0005), which comes before `# Annotations` in the file, since Annotator appends
new annotations at its end.
_Avoid_: conclusion, outro, afterword

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

**Static layout**:
The annotation page as it's sent: the top section, the cards in one column in document order, the
bottom section. What a reader without JavaScript keeps, and a page whose mirror is missing; the
Viewer switches the page to the margin or the drawer once the document opens (docs/adr/0004).
_Avoid_: mobile layout, fallback

**Bar**:
The strip at the top of an annotation page at every width: ☰, the site's name (the page's title once
the top section's has scrolled away), zoom, and the annotations' toggle with their count.
_Avoid_: header (that is a layout slot), toolbar

**Top section** and **bottom section**:
The text-width columns above and below the document: the page header, where the source document
comes from and the preface; then the epilogue and the site's `right` and `afterBody` components.
_Avoid_: header, footer (both are layout slots)

**☰ drawer**:
The drawer from the left that holds the site's `header` and `left` components at every width. A
host drawer, the family's `cgc-drawer` container, in which a component that would be a drawer of
its own on a narrow screen, as quartz-tag-explorer is, keeps its sidebar form.
_Avoid_: menu (in prose), sidebar

**Tab**:
The small handle on the right edge that opens the drawer, tapped or dragged. The only place a swipe
towards the drawer starts.
_Avoid_: handle, grip, button

**Card**:
One annotation as the page shows it: the passage it quotes and the note written on it. Without a
document, the cards are the page, in one column.
_Avoid_: comment, annotation (that is the thing the card shows)

**Margin**:
The desktop column beside the document where cards sit anchored to their highlights.
_Avoid_: sidebar, panel

**Drawer**:
The annotations when the margin doesn't fit, coming in from the right. (The ☰ drawer, from the left,
holds the site's own components.)
_Avoid_: sidebar, sheet

**Mirror**:
Our pinned copy of a source document, served from the site. Taken once and then kept, because
it is the document the annotations were written against.
_Avoid_: download, local copy, cached PDF

**Viewer**:
The part of an annotation page that renders the mirror with its highlights: an island over the
document, beside the annotations, which are the page's own static HTML. Every page's box is laid
out as soon as the document opens, but a page is drawn only as it comes near the screen, and let go
once it's well away, so a long document fits in a phone's canvas memory. Only the viewer degrades
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
