---
title: Quartz Tag Metadata Library
tags:
  - projects/site/plugins
  - engineering/languages/typescript
  - engineering/frontend
  - engineering/data
description: A Quartz 5 library plugin for rich tag metadata cross site components
date: 2026-09-27
---

A tag utility library for Quartz websites that enhance tags in a few ways:

1. Allows for nested tags. For example, [[public/tags/engineering|`engineering`]] and [[public/tags/engineering/languages|`engineering/languages`]]
2. Ability to assign tags a color and icon
3. Creates a shared asset that other plugins can use to display richer tag components across your site.

## Installation

```bash
npm install @chaoticgoodcomputing/quartz-tags
```

Requires [[public/plugins/quartz-styles|Quartz Styles]].

## Usage

```yaml title="quartz.config.yaml"
plugins:
  - source: "@chaoticgoodcomputing/quartz-tags"
    enabled: true
    options:
      tags:
        engineering: { color: "light-dark(#0070cc, #008CFF)", icon: mdi:wrench }
        engineering/ai: { icon: mdi:robot }
        writing: { color: "var(--secondary)", icon: mdi:pencil }
```

## Configuration

| Option         | Type                                | Default           | Description                                                         |
| -------------- | ----------------------------------- | ----------------- | ------------------------------------------------------------------- |
| `tags`         | `Record<string, { color?, icon? }>` | `{}`              | The dictionary. A color is any CSS color; an icon is `prefix:name`. |
| `defaultColor` | `string`                            | `var(--darkgray)` | The color of a tag with no color in its lineage.                    |

## License

MIT
