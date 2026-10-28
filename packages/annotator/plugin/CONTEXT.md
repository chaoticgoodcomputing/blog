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
What kind of annotated document a note's target is (a PDF, an EPUB, a web page or a video), from its
`annotation-target-type` property, or from the extension of its address when the note has none.
_Avoid_: file type, format

**Annotation record**:
The part of an annotation that is Hypothesis's own JSON for it, in an `annotation-json` block,
hidden in a comment. The rest of the annotation is written from it, for reading.
_Avoid_: annotation JSON, metadata

**Passage**:
The text of the annotated document an annotation was made on, with a little of the text either side
of it to find it again by.
_Avoid_: highlight (that is the passage as a reader marks it), selection, quote

**Annotation mode**:
An annotation note shown as its annotated document with the sidebar beside it, in place of its
Markdown. A note opens in one or the other.
_Avoid_: annotator view, PDF mode

**Sidebar**:
The Hypothesis client as the Annotator runs it, beside the annotated document, where
annotations are made and read.
_Avoid_: panel, Hypothesis

### Working offline

**Saved resource**:
A page, script or response of the Hypothesis services, or a library they serve, saved with the
Annotator so it runs without them. Each keeps its own license.
_Avoid_: asset, vendored file, cache

**Modified resource**:
A saved resource that upstream changed from the copy it saved, as `Modified Resources.md` lists.
A change to one has to be made again whenever it is saved afresh.

**Fake service**:
The Annotator's stand-in for the Hypothesis API, which answers the sidebar from the annotation note
in place of the Hypothesis servers.
_Avoid_: mock API, local server
