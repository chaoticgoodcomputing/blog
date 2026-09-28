---
title: Quartz Annotator
tags:
  - writing/highlights
  - projects/site/plugins
  - writing/annotations
  - engineering/languages/typescript
  - engineering/frontend
date: 2026-09-27
description: How to install Quartz Annotator, a plugin for displaying highlights and annotations of PDF documents
---
Publishes notes written with Obsidian's [Annotator](https://github.com/elias-sundqvist/obsidian-annotator) plugin as annotation pages: the source PDF, with each annotated passage highlighted, beside the annotations.

![[assets/Pasted image 20260927191003.png]]

*Screencap of [[content/annotations/valve-handbook|"Working with Valves"]]*

A note becomes an annotation page when its frontmatter names the document it annotates:

```yaml
---
title: 'Working with Valves: Understanding the Structure of "Flat" Organizations'
annotation-target: https://media.steampowered.com/apps/valve/Valve_Handbook_LowRes.pdf
---
```

At build time the plugin fetches each target PDF once and serves its own copy, a **mirror**, so the viewer can read it. A document that can't be fetched never fails the build: the page shows the annotations with a link to the source instead.

## Installation

```bash
npm install @chaoticgoodcomputing/quartz-annotator
```

Requires [[/plugins/quartz-styles|Quartz Styles]].

## Usage

```yaml title="quartz.config.yaml"
plugins:
  - source: "@chaoticgoodcomputing/quartz-annotator"
    enabled: true
    options:
      mirrorDir: mirrors
```

- Keep `cacheDir` between builds, in CI too. A mirror is pinned on first fetch, since annotations are anchored to that exact file; delete it from the cache to refresh it.
- Add `Disallow: /mirrors/` (or your `mirrorDir`) to `robots.txt`, so search engines don't index other people's documents as your content.
- Annotation pages use the layout key `annotation` under `layout.byPageType`, and the plugin's own frame, `cgc-annotation`: the `header` and `left` components go in a ☰ drawer, `beforeBody` above the document, and `right` and `afterBody` after it. Exclude there what you don't want on these pages.
- Write around your annotations with H1 markers: prose under `# Preface` (or before any marker) shows above the document, prose under `# Epilogue` after it. Keep `# Annotations` last, where Annotator appends new ones.

On a wide screen the annotations sit in the document's margin, each beside its passage; on a narrower one, or zoomed in, they come out of a drawer from the right. Readers can zoom the document from the bar, or pinch it.

## Configuration

| Option         | Type       | Default                             | Description                                                                               |
| -------------- | ---------- | ----------------------------------- | ----------------------------------------------------------------------------------------- |
| `mirrorDir`    | `string`   | `"mirrors"`                         | Where mirrors are served from, relative to the site root.                                 |
| `cacheDir`     | `string`   | `node_modules/.cache/cgc-annotator` | Where mirrors are pinned between builds, relative to the Quartz root or absolute.         |
| `fetchTimeout` | `number`   | `60000`                             | Milliseconds to wait for a source document before building without it.                    |
| `denylist`     | `string[]` | whole-page transformers             | Transformers that annotation notes are rendered without. Setting it replaces the default. |
| `marginWidth`  | `string`   | `"20rem"`                           | A card's width, in the desktop margin and the tablet drawer. `px` or `rem`.               |
| `minDocumentWidth` | `string` | `"36rem"`                         | The narrowest the document may be at 100% beside the margin. `px` or `rem`.               |
| `textWidth`    | `string`   | `"800px"`                           | The width of the sections above and below the document. `px` or `rem`.                    |
