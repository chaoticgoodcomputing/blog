---
title: Quartz Improved Tag List
tags:
  - projects/site/plugins
  - engineering/languages/typescript
  - engineering/frontend
description: An improved tag list plugin for Quartz 5 sites.
date: 2026-09-27
---
Lists a page's tags under its title as badges, each with the tag's icon in a bubble rimmed in the tag's color. Icons are drawn inline at build time, so the page fetches nothing. A replacement for `@quartz-community/tag-list`.

## Installation

```bash
npm install @chaoticgoodcomputing/quartz-tag-list
```

Requires [[/plugins/quartz-tags|Quartz Tags]] and [[/plugins/quartz-styles|Quartz Styles]]. Disable `@quartz-community/tag-list`.

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

## License

MIT
