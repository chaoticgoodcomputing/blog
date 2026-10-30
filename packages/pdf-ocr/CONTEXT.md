# PDF OCR

Text for scanned PDFs. A scanned page is a picture of text, with none a reader can select, and none
an annotation's passage can be found in. This package recognizes that text once and keeps it beside
the PDF, so that the Annotator plugin (`packages/annotator/plugin`), which annotations are made in,
and the Astro site (`astro/`), which shows them, have the same text, character for character.

## Language

**Scanned page**:
A page of a PDF with no text of its own, that is one large image: a picture of the page. A blank
page, or a page with a small picture, is not one.
_Avoid_: image page, textless page (a blank page is textless too)

**Scan**:
A scanned page's image, as the PDF stores it, which is what is recognized: never a drawing of the
page, which would differ from one machine to the next.
_Avoid_: rendering, screenshot

**Recognizing**:
Reading a scan's text, with its words' places on the page, by the one pinned engine. The same scan
gives the same text wherever it is recognized.
_Avoid_: OCR-ing, extracting (a PDF's own text is extracted)

**Text file**:
A PDF's recognized text, kept beside it as `<document>.text.json`: the text of each scanned page,
and which PDF it was made from, byte for byte. A PDF with no scanned pages has one with no pages,
which says it was looked at. It is the text of that PDF only.
_Avoid_: sidecar, OCR output, transcript
