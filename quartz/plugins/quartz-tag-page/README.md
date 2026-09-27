---
title: quartz-tag-page
tags:
  - projects/site/plugins
  - engineering/frontend
---

Runs stock [`tag-page`](https://github.com/quartz-community/tag-page) but shows only the tag's description on each tag page, dropping stock's list of pages. It also gives tag pages to tags that only non-Markdown pages carry, such as `.mdx` pages.

## Installation

```bash
npm install @chaoticgoodcomputing/quartz-tag-page
```

Disable `@quartz-community/tag-page` but leave it installed: this plugin runs its code. With both enabled, the build fails.

## Usage

```yaml title="quartz.config.yaml"
plugins:
  - source: "@quartz-community/tag-page"
    enabled: false
  - source: "@chaoticgoodcomputing/quartz-tag-page"
    enabled: true
    options:
      prefixTags: true
```

A tag's description lives at `tags/<tag>.md`, for example `tags/engineering/ai.md`.

> [!WARNING]
> Not `tags/<tag>/index.md`: that gets a page of its own, and the tag gets a second, generated page.

## Configuration

| Option       | Type      | Default | Description                                                           |
| ------------ | --------- | ------- | --------------------------------------------------------------------- |
| `prefixTags` | `boolean` | `false` | Title a tag with no description file `Tag: <tag>` instead of `<tag>`. |

## Documentation

See [CONTEXT.md](https://github.com/chaoticgoodcomputing/blog/blob/main/quartz/plugins/quartz-tag-page/CONTEXT.md) and the [decision records](https://github.com/chaoticgoodcomputing/blog/tree/main/quartz/plugins/quartz-tag-page/docs/adr).

## License

MIT
