---
title: Annotations on a garden
date: 2026-10-29
tags:
  - writing/annotations
annotation-target: "https://example.com/papers/Garden.pdf"
---

A scanned document: its pages are pictures of text, with none of their own. Its text is the text
file beside its mirror, recognized as the Annotator plugin recognizes it.

>%%
>```annotation-json
>{"text":"The surprise is the point: a bench seen from the gate is a destination, and one found is a rest.","target":[{"source":"https://example.com/papers/Garden.pdf","selector":[{"type":"TextQuoteSelector","exact":"finds the bench by surprise.","prefix":"from the gate, and","suffix":"Every window"}]}],"created":"2026-10-29T10:00:00.000Z","updated":"2026-10-29T10:00:00.000Z","tags":[]}
>```
>%%
>*%%PREFIX%%from the gate, and%%HIGHLIGHT%% ==finds the bench by surprise.== %%POSTFIX%%Every window*
>%%LINK%%[[#^bench|show annotation]]
>%%COMMENT%%
>The surprise is the point: a bench seen from the gate is a destination, and one found is a rest.
>%%TAGS%%
>
^bench


### What it found

A bench, by surprise.
