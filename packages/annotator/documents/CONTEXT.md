# Annotator documents

Where an annotated document on the web comes from when the Annotator opens it: a library the
Annotator, and later the site, can share. Its words are on top of the Annotator's
(`../plugin/CONTEXT.md`).

## Language

**Saved copy**:
The Annotator's own copy of an annotated document on the web, kept under its host and file name in
the document folder, and opened in the document's place from then on. Always a PDF.
_Avoid_: cache, download, mirror (that is the site's copy, which it publishes)

**Document folder**:
Where the saved copies are kept: a folder the user chooses, or the plugin's own folder.
_Avoid_: cache directory, downloads

**Supplying a document**:
The user giving the Annotator the PDF of a document the web won't give it, behind a paywall or a bot
check, which becomes its saved copy.
_Avoid_: uploading, importing

**Unavailable**:
What a document on the web is when it has no saved copy and fetching it gives no PDF: the site
refused, answered with a page in its place, or couldn't be reached.
_Avoid_: missing, broken
