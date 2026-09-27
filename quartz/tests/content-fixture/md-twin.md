---
title: MD Twin
description: The page that decides the ticket.
tags:
  - fixture
  - mdtwin
created: 2026-01-15
---

# MD Twin

This page is `.md`. It is the control for the .mdx page, rendered by Quartz's
own pipeline.

## Transformer chain checks

A wikilink back to [[plain-note]], and one to [[index|the vault root]].

**GFM table** (github-flavored-markdown):

| Transformer | Expected |
| --- | --- |
| OFM | wikilinks above resolve |
| GFM | this table renders |

**Syntax highlighting** (shiki, via syntax-highlighting):

```ts
const answer: string = "rendered through the configured pipeline"
```

**Latex** (katex): $e^{i\pi} + 1 = 0$

> [!note] Obsidian callout
> This is OFM callout syntax, not the widget below.

## Widget check

The widget below is a Preact component compiled into the plugin bundle and
hydrated client-side:


## Footnote check

A footnote reference[^1].

[^1]: Footnote body, rendered by GFM.
