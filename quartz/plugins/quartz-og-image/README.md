---
title: quartz-og-image
tags:
  - projects/site/plugins
  - engineering/languages/typescript
---

Runs stock [`og-image`](https://github.com/quartz-community/og-image) with its own card: tag chips show the tag's last segment, the corner carries your site's icon, the title has no site suffix, and no cards are drawn under `quartz build --serve`.

## Installation

```bash
npm install @chaoticgoodcomputing/quartz-og-image
```

Disable `@quartz-community/og-image` but leave it installed: this plugin runs its code. With both enabled, the build fails.

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

## Documentation

See [CONTEXT.md](https://github.com/chaoticgoodcomputing/blog/blob/main/quartz/plugins/quartz-og-image/CONTEXT.md) and the [decision records](https://github.com/chaoticgoodcomputing/blog/tree/main/quartz/plugins/quartz-og-image/docs/adr).

## License

MIT
