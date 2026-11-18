# Annotator

The Obsidian plugin the vault's annotation notes are written with: a hard fork of Obsidian
Annotator, which opens a document beside its note and keeps each annotation made on it in the note.
It is how annotations are authored; the Astro site reads the notes it writes and shows them on its
own. Where the fork came from and the licenses of the work in it are in [NOTICE.md](./NOTICE.md).

The words for the notes themselves, **Annotation target**, **Annotated document** and
**Annotation**, are the Astro site's (`astro/CONTEXT.md`), and mean the same here.

## Language

### The fork

**Annotator**:
This plugin: the fork, as it is in this repository.
_Avoid_: Obsidian Annotator (that is upstream's name), the annotator fork

**Upstream**:
Elias Sundqvist's Obsidian Annotator, which is no longer maintained, as of the fork point.
_Avoid_: original, parent

**Fork point**:
The upstream release the fork was taken from, 0.2.11, and nothing after it.

**Hypothesis client**:
Hypothesis's own annotation client, as it publishes it, which the Annotator runs as its sidebar.
Upstream ran a fork of it; the Annotator runs it unforked.
_Avoid_: Hypothesis (that is the service it was made for), the client fork

### Annotating

**Annotation note**:
A note of the vault with an annotation target, which holds the annotations made on that target.
_Avoid_: annotation file (the code's), annotated note

**Annotation target type**:
What kind of annotated document a note's target is, from its `annotation-target-type` property: a
web page (`web`), or, with none, a document such as a PDF. Any other value is malformed.
_Avoid_: file type, format

**Page range**:
The pages of a PDF an annotation note shows, from its `annotation-pages` property: the document is
opened whole, and only they are shown, so annotations on them name their passages in the whole
document. A malformed one is told of, and the annotator doesn't open.
_Avoid_: excerpt, slice, chapter

**Recognizing a document**:
Reading the text of a PDF's scanned pages, once, when the user asks, and keeping it as its text file
beside its saved copy (`packages/pdf-ocr/CONTEXT.md`), so its scans can be annotated as any text.
The site recognizes the same scans to the same text.
_Avoid_: OCR, converting

**Annotation record**:
The W3C Web Annotation an annotation's block holds, hidden in a comment, as web-annotations writes
it (`../web-annotations/CONTEXT.md`). The passage's quote is in it, not written out; the comment is
the block's Markdown.
_Avoid_: annotation JSON, metadata

**Passage**:
The text of the annotated document an annotation was made on, with a little of the text either side
of it to find it again by.
_Avoid_: highlight (that is the passage as a reader marks it), selection, quote

**Annotator region**:
Where an annotation note's editor shows the annotated document and the sidebar: in place of the
note's run of annotation blocks, between its preface and its epilogue, which are edited as any
note's text.
_Avoid_: annotation mode (upstream's view of its own, gone), widget, embed

**Sidebar**:
The Hypothesis client as the Annotator runs it, beside the annotated document, where
annotations are made and read.
_Avoid_: panel, Hypothesis

### Running the client

**Viewer page**:
The page the annotator region shows: the annotated document, drawn by PDF.js, with the Hypothesis client
loaded into it. Its sidebar is a page of its own inside it.
_Avoid_: frame, viewer (PDF.js's), Via (upstream's)

**Fake service**:
The Annotator's stand-in for the Hypothesis API, which answers the sidebar from the annotation note
in place of the Hypothesis servers.
_Avoid_: mock API, local server

### Serving the extension

**Local service**:
The fake service for the whole vault, not one note, served over HTTP on 127.0.0.1 for the
Annotator extension (`../extension/CONTEXT.md`), while the user has it on. A request about a page
goes to the page's note; one about an annotation, to the note that holds it.
_Avoid_: server (where it is plain which is meant), API, backend

**Page's note**:
The annotation note whose annotation target is a page the extension names, by any of the addresses
the client has for it: its own, its canonical link, a PDF's fingerprint. The first by path, when
several are. A PDF opened in the browser has the note Obsidian annotates it in.
_Avoid_: matching note, page note (Hypothesis's word for an annotation on a whole page)

**Making a page's note**:
What a page's first annotation in the browser does when it has no note: a note at the path the
settings' pattern makes of the page, from the settings' template for a web page or for a PDF, or
with the annotation template's properties, its annotation target the page. A web page's note has `annotation-target-type: web`; a
PDF's has none, and is a PDF's note as any other.
_Avoid_: importing, capturing

**Note path pattern**:
Where a page's new note goes, as the settings write it: a path from the vault's root, with the
page's `{title}`, `{sanitized-title}` (its title with dashes for spaces and for what a
file name can't hold), `{domain}` (its host, without `www.`), `{slug}` (its whole path, in hyphenated
lowercase), `{url}` and `{date}`, each with underscores for what a file name can't hold. The
pattern's own slashes are folders; a variable's never are.
_Avoid_: folder, file name template

**Web page's note**:
An annotation note whose target type is a web page: annotated in the browser, never in Obsidian,
which doesn't show the page. Its editor has an annotator region, between its preface and its
epilogue, as a PDF's note has, its blocks kept from edits; the region shows its annotations as
cards, not the annotator. A click on a card edits its comment alone, in a text box, wikilinks
suggested; saving writes its block again through web-annotations, never by hand. A bar under its properties opens the page in the browser.
_Avoid_: web note, bookmark, clipping

### Publishing to Hypothesis

**Public note**:
An annotation note whose `annotation-public` property is `true`: its annotations are published to
Hypothesis, in the settings' group, as well as kept in it. The note stays what is true; Hypothesis
is told of each change a moment after it is made, however it is made, and nothing comes back but
each copy's id. Highlights are not published; a reply is, beside its parent's copy.
_Avoid_: shared note, synced note

**Source copy**:
An annotation as published on its annotated document, at the document's own address: a web page's,
or a PDF's on the web. A PDF's ends with a link to the annotation's card on the note's page, and
names the PDF by its address alone, never its fingerprint, which the site's own copy shares. A PDF
whose text the plugin recognized has none: Hypothesis wouldn't find its passages.
_Avoid_: mirror (the code's word for publishing), remote annotation

**Page copy**:
A PDF's note's annotation as published on the note's page on the site, on the passage its card
quotes. A web page's note has none. Never on the site's own copy of the PDF.
_Avoid_: site copy, mirror copy

**Ledger**:
Every copy made from a note, by the note's path, in the plugin's data: how a copy whose block is
gone is found, to be removed. Lost, copies are left on Hypothesis, never removed by mistake.
_Avoid_: cache, index

**Public comment**:
A comment as published: its wikilinks made links to the notes' pages on the site, by the site's
rule for a note's address, copied from it; a note outside the site's folders, or a link to nothing,
is its text.
_Avoid_: rendered comment, export
