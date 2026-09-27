---
title: quartz-tag-list
tags:
  - projects/site/plugins
  - engineering/frontend
---

Lists a page's tags under its title as badges, each with the tag's icon in a bubble rimmed in the tag's colour. Icons are drawn inline at build time, so the page fetches nothing. A replacement for `@quartz-community/tag-list`.

## Installation

```bash
npm install @chaoticgoodcomputing/quartz-tag-list
```

Requires [quartz-tags](https://blog.chaoticgood.computer/plugins/quartz-tags) and [quartz-styles](https://blog.chaoticgood.computer/plugins/quartz-styles). Disable `@quartz-community/tag-list`.

## Usage

```yaml title="quartz.config.yaml"
plugins:
  - source: "@chaoticgoodcomputing/quartz-tag-list"
    enabled: true
    options:
      showSubtags: true
      showParentTag: true
      iconCollections: &iconCollections
        custom: ./icons
    layout:
      position: beforeBody
      priority: 30
```

Other family plugins that draw icons take the same `iconCollections`, so anchor it and reuse it with `*iconCollections`.

## Configuration

| Option            | Type                     | Default | Description                                                                                           |
| ----------------- | ------------------------ | ------- | ----------------------------------------------------------------------------------------------------- |
| `showSubtags`     | `boolean`                | `false` | On a tag page, list the tag's subtags instead of the page's own tags.                                 |
| `showParentTag`   | `boolean`                | `false` | On a tag page listing subtags, list the parent tag first.                                             |
| `showCount`       | `boolean`                | `true`  | Show the number of pages under each tag.                                                              |
| `iconCollections` | `Record<string, string>` | none    | Your own icon sets: with `custom: ./icons`, `custom:d20` is `./icons/d20.svg`. `mdi:` needs no entry. |

## Documentation

See [CONTEXT.md](https://github.com/chaoticgoodcomputing/blog/blob/main/quartz/plugins/quartz-tag-list/CONTEXT.md) and the [decision records](https://github.com/chaoticgoodcomputing/blog/tree/main/quartz/plugins/quartz-tag-list/docs/adr).

## License

MIT
