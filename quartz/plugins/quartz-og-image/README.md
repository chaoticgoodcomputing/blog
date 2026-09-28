---
title: Quartz Enhanced OG Images
tags:
  - projects/site/plugins
  - engineering/languages/typescript
  - engineering/frontend
date: 2026-09-27
description: A plugin for richer, stylized OG images on Quartz 5 sites.
---

Runs stock [`og-image`](https://github.com/quartz-community/og-image) with its own card: tag chips show the tag's last segment, the corner carries your site's icon, the title has no site suffix, and no cards are drawn under `quartz build --serve`.

![[public/assets/Pasted image 20260927203318.png]]
*Example from [[/content/annotations/evolutions-revolutions|Evolution and Revolution as Organizations Grow]]*

## Installation

```bash
npm install @chaoticgoodcomputing/quartz-og-image
```

## Usage

```yaml title="quartz.config.yaml"
plugins:
  - source: "@quartz-community/og-image"
    enabled: false
  - source: "@chaoticgoodcomputing/quartz-og-image"
    enabled: true
    options:
      colorScheme: darkMode
      icon: site-icon.png
```

## Configuration

| Option               | Type                        | Default                     | Description                                                               |
| -------------------- | --------------------------- | --------------------------- | ------------------------------------------------------------------------- |
| `icon`               | `string`                    | stock's icon                | A PNG, JPEG or SVG for the card's corner, as a path from the Quartz root. |
| `colorScheme`        | `"lightMode" \| "darkMode"` | `"lightMode"`               | Which of the theme's palettes the card uses.                              |
| `width`              | `number`                    | `1200`                      | Card width in pixels.                                                     |
| `height`             | `number`                    | `630`                       | Card height in pixels.                                                    |
| `excludeRoot`        | `boolean`                   | `false`                     | Stock's option, passed through.                                           |
| `defaultTitle`       | `string`                    | `"Untitled"`                | The title for a page without one.                                         |
| `defaultDescription` | `string`                    | `"No description provided"` | The description for a page without one.                                   |

## License

MIT
