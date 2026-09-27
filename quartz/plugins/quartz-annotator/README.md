---
title: quartz-annotator
tags:
  - projects/site/plugins
  - writing/annotations
---

Publishes notes written with Obsidian's [Annotator](https://github.com/elias-sundqvist/obsidian-annotator) plugin as annotation pages: the source PDF, with each annotated passage highlighted, beside the annotations.

A note becomes an annotation page when its frontmatter names the document it annotates:

```yaml
---
title: Programming as theory building
annotation-target: https://pablo.rauzy.name/dev/naur1985programming.pdf
---
```

At build time the plugin fetches each target PDF once and serves its own copy, a **mirror**, so the viewer can read it. A document that can't be fetched never fails the build: the page shows the annotations with a link to the source instead.

## Installation

```bash
npm install @chaoticgoodcomputing/quartz-annotator
```

Requires [quartz-styles](https://blog.chaoticgood.computer/plugins/quartz-styles).

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
- Annotation pages use the layout key `annotation` under `layout.byPageType`.

## Configuration

| Option         | Type       | Default                             | Description                                                                               |
| -------------- | ---------- | ----------------------------------- | ----------------------------------------------------------------------------------------- |
| `mirrorDir`    | `string`   | `"mirrors"`                         | Where mirrors are served from, relative to the site root.                                 |
| `cacheDir`     | `string`   | `node_modules/.cache/cgc-annotator` | Where mirrors are pinned between builds, relative to the Quartz root or absolute.         |
| `fetchTimeout` | `number`   | `60000`                             | Milliseconds to wait for a source document before building without it.                    |
| `denylist`     | `string[]` | whole-page transformers             | Transformers that annotation notes are rendered without. Setting it replaces the default. |
