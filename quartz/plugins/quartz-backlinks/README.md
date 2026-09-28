---
title: Quartz Improved Backlinks
tags:
  - projects/site/plugins
  - engineering/languages/typescript
  - engineering/frontend
date: 2026-09-27
description: A light Quartz v5 plugin that allows for more customization of the site's Backlinks feature
---

Lists the pages that link to the current page, with public pages first and private pages marked with a lock or left out. A replacement for `@quartz-community/backlinks`.

## Installation

```bash
npm install @chaoticgoodcomputing/quartz-backlinks
```

Requires [[public/plugins/quartz-styles|Quartz Styles]]

## Usage

```yaml title="quartz.config.yaml"
plugins:
  - source: "@chaoticgoodcomputing/quartz-backlinks"
    enabled: true
    options:
      privateTags: [private]
      excludePrivate: true
    layout:
      position: right
      priority: 50
```

## Configuration

| Option           | Type       | Default       | Description                                                       |
| ---------------- | ---------- | ------------- | ----------------------------------------------------------------- |
| `privateTags`    | `string[]` | `["private"]` | Tags that make a page private, along with their subtags.          |
| `excludePrivate` | `boolean`  | `false`       | Leave private pages out instead of listing them last with a lock. |
| `hideWhenEmpty`  | `boolean`  | `true`        | Render nothing on a page that no page links to.                   |

Give [quartz-seo](https://blog.chaoticgood.computer/plugins/quartz-seo), [quartz-graph](https://blog.chaoticgood.computer/plugins/quartz-graph) and [quartz-tag-explorer](https://blog.chaoticgood.computer/plugins/quartz-tag-explorer) the same private tags, for example through a YAML anchor.

## License

MIT
