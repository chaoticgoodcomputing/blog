---
title: Annotations on a document with no mirror
date: 2026-03-29
tags:
  - reading
annotation-target: https://example.com/papers/Unpinned.pdf
---

> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:00000000-0000-4000-8000-000000000003","type":"Annotation","motivation":"commenting","body":{"id":"#^nocopy","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://example.com/papers/Unpinned.pdf","selector":[{"type":"TextPositionSelector","start":0,"end":24},{"type":"TextQuoteSelector","exact":"A document with no copy","prefix":"","suffix":" on the site"}]},"created":"2026-03-29T10:00:00.000Z","modified":"2026-03-29T10:00:00.000Z"}
> ```
> %%
> Read from the document's own host, since the site has no copy of it.
^nocopy
