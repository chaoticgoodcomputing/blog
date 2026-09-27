---
title: Withdrawn paper
tags:
  - fixture
  - annotations
annotation-target: https://cgc-fixture.invalid/withdrawn.pdf
---

An annotation page whose source document can't be fetched: its `annotation-target` is on a domain
that never resolves, and nothing is pinned for it. It builds all the same, with no mirror.

>%%
>```annotation-json
>{"text":"Written against a paper whose host has gone. Back to the [[fixture-paper]].","target":[{"source":"https://cgc-fixture.invalid/withdrawn.pdf","selector":[{"type":"TextPositionSelector","start":10,"end":52},{"type":"TextQuoteSelector","exact":"a passage from a document no one can fetch","prefix":"","suffix":""}]}],"created":"2024-04-01T12:00:00.000Z","updated":"2024-04-01T12:00:00.000Z","document":{"title":"cgc-annotator fixture paper","link":[{"href":"https://cgc-fixture.invalid/withdrawn.pdf"}]},"uri":"https://cgc-fixture.invalid/withdrawn.pdf"}
>```
>%%
>*%%PREFIX%%%%HIGHLIGHT%% ==a passage from a document no one can fetch== %%POSTFIX%%*
>%%LINK%%[[#^gone|show annotation]]
>%%COMMENT%%
>Written against a paper whose host has gone. Back to the [[fixture-paper]].
>%%TAGS%%
>
^gone


>%%
>```annotation-json
>{"target":[{"source":"https://cgc-fixture.invalid/withdrawn.pdf","selector":[{"type":"TextPositionSelector","start":90,"end":117},{"type":"TextQuoteSelector","exact":"and a second, later passage","prefix":"","suffix":""}]}],"created":"2024-04-02T12:00:00.000Z","updated":"2024-04-02T12:00:00.000Z","document":{"title":"cgc-annotator fixture paper","link":[{"href":"https://cgc-fixture.invalid/withdrawn.pdf"}]},"uri":"https://cgc-fixture.invalid/withdrawn.pdf"}
>```
>%%
>*%%PREFIX%%%%HIGHLIGHT%% ==and a second, later passage== %%POSTFIX%%*
>%%LINK%%[[#^alsogone|show annotation]]
>%%COMMENT%%
>
>%%TAGS%%
>
^alsogone
