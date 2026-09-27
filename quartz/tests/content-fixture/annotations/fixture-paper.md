---
title: Fixture paper
tags:
  - fixture
  - annotations
annotation-target: https://cgc-fixture.invalid/paper.pdf
---

An annotation page whose source document the suite's harness pins into the fixture root's cache:
its `annotation-target` is on a domain that never resolves, so the build never fetches it. The
Viewer shows the pinned copy.

>%%
>```annotation-json
>{"text":"A note on the *last* page, which [[linked-note]] also mentions.","target":[{"source":"https://cgc-fixture.invalid/paper.pdf","selector":[{"type":"TextPositionSelector","start":220,"end":238},{"type":"TextQuoteSelector","exact":"far below the fold","prefix":"Quoted on the last page, ","suffix":"."}]}],"created":"2024-03-15T10:00:00.000Z","updated":"2024-03-15T10:00:00.000Z","document":{"title":"cgc-annotator fixture paper","link":[{"href":"https://cgc-fixture.invalid/paper.pdf"}]},"uri":"https://cgc-fixture.invalid/paper.pdf"}
>```
>%%
>*%%PREFIX%%Quoted on the last page, %%HIGHLIGHT%% ==far below the fold== %%POSTFIX%%.*
>%%LINK%%[[#^lastpage|show annotation]]
>%%COMMENT%%
>A note on the *last* page, which [[linked-note]] also mentions.
>%%TAGS%%
>
^lastpage


>%%
>```annotation-json
>{"text":"This passage is **highlighted**, and this note links to [[plain-note]].","target":[{"source":"https://cgc-fixture.invalid/paper.pdf","selector":[{"type":"TextPositionSelector","start":37,"end":74},{"type":"TextQuoteSelector","exact":"draws highlights over quoted passages","prefix":"per, page oneThe annotator ","suffix":".A second sentence that"}]}],"created":"2024-03-14T22:23:53.656Z","updated":"2024-03-14T22:23:53.656Z","document":{"title":"cgc-annotator fixture paper","link":[{"href":"https://cgc-fixture.invalid/paper.pdf"}]},"uri":"https://cgc-fixture.invalid/paper.pdf","tags":["reading"]}
>```
>%%
>*%%PREFIX%%per, page oneThe annotator %%HIGHLIGHT%% ==draws highlights over quoted passages== %%POSTFIX%%.A second sentence that*
>%%LINK%%[[#^highlights|show annotation]]
>%%COMMENT%%
>This passage is **highlighted**, and this note links to [[plain-note]].
>%%TAGS%%
>#reading
^highlights


>%%
>```annotation-json
>{"target":[{"source":"https://cgc-fixture.invalid/paper.pdf","selector":[{"type":"TextPositionSelector","start":75,"end":119},{"type":"TextQuoteSelector","exact":"A second sentence that a note quotes in full","prefix":"over quoted passages.","suffix":".Printed in process"}]}],"created":"2024-03-14T22:30:00.000Z","updated":"2024-03-14T22:30:00.000Z","document":{"title":"cgc-annotator fixture paper","link":[{"href":"https://cgc-fixture.invalid/paper.pdf"}]},"uri":"https://cgc-fixture.invalid/paper.pdf"}
>```
>%%
>*%%PREFIX%%over quoted passages.%%HIGHLIGHT%% ==A second sentence that a note quotes in full== %%POSTFIX%%.Printed in process*
>%%LINK%%[[#^quoteonly|show annotation]]
>%%COMMENT%%
>
>%%TAGS%%
>
^quoteonly


>%%
>```annotation-json
>{"text":"Its passage is nowhere in the document, so it has no highlight. The [[withdrawn]] paper lost its document altogether.","target":[{"source":"https://cgc-fixture.invalid/paper.pdf","selector":[{"type":"TextPositionSelector","start":150,"end":174},{"type":"TextQuoteSelector","exact":"Table 7: 0.0317 ± 0.0042","prefix":"","suffix":""}]}],"created":"2024-03-16T08:00:00.000Z","updated":"2024-03-16T08:00:00.000Z","document":{"title":"cgc-annotator fixture paper","link":[{"href":"https://cgc-fixture.invalid/paper.pdf"}]},"uri":"https://cgc-fixture.invalid/paper.pdf"}
>```
>%%
>*%%PREFIX%%%%HIGHLIGHT%% ==Table 7: 0.0317 ± 0.0042== %%POSTFIX%%*
>%%LINK%%[[#^orphan|show annotation]]
>%%COMMENT%%
>Its passage is nowhere in the document, so it has no highlight. The [[withdrawn]] paper lost its document altogether.
>%%TAGS%%
>
^orphan


>%%
>```annotation-json
>{"text":"A passage across three lines, the middle one whole: one highlight a line, laid on once.","target":[{"source":"https://cgc-fixture.invalid/paper.pdf","selector":[{"type":"TextPositionSelector","start":187,"end":258},{"type":"TextQuoteSelector","exact":"page two A line quoted whole, inside a longer passage. Quoted on the last page,","prefix":"Fixture paper, ","suffix":" far below the fold."}]}],"created":"2024-03-17T09:00:00.000Z","updated":"2024-03-17T09:00:00.000Z","document":{"title":"cgc-annotator fixture paper","link":[{"href":"https://cgc-fixture.invalid/paper.pdf"}]},"uri":"https://cgc-fixture.invalid/paper.pdf"}
>```
>%%
>*%%PREFIX%%Fixture paper, %%HIGHLIGHT%% ==page two A line quoted whole, inside a longer passage. Quoted on the last page,== %%POSTFIX%% far below the fold.*
>%%LINK%%[[#^spanning|show annotation]]
>%%COMMENT%%
>A passage across three lines, the middle one whole: one highlight a line, laid on once.
>%%TAGS%%
>
^spanning
