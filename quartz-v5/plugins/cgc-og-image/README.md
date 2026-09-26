---
title: cgc-og-image
tags:
  - projects/site/plugins
  - engineering/languages/typescript
---

`cgc-og-image` draws the card a shared link shows, for every page of a
[Quartz 5](https://quartz.jzhao.xyz/) site. It runs stock
[`og-image`](https://github.com/quartz-community/og-image) with a card of its own: each tag chip
shows the tag's last segment, the card carries your site's icon rather than Quartz's, and nothing
is drawn during `quartz build --serve`.

## What it changes

Stock `og-image` does all the work: fonts, rendering, the `.webp` files and the `og:image` tags. This
plugin only supplies the card, which differs from stock's in four ways:

- **Tag chips show the last segment.** A page tagged `writing/articles` gets `#articles`. The card
  shows a page's first three tags.
- **The icon is yours.** Stock reads its icon from inside the Quartz copy, where a site can't
  replace it without editing Quartz. Point `icon` at your own file instead.
- **No site title suffix.** The card's title is the page's own. Stock appends `pageTitleSuffix`,
  as the page's `<title>` does.
- **Nothing is drawn under `serve`.** A card per page is the slowest part of a build, and a local
  preview doesn't need them. `quartz build` and `quartz build --watch` still draw every card.

## Install

```bash
npx quartz plugin add git+https://github.com/chaoticgoodcomputing/blog.git#v<x.y.z> --subdir quartz-v5/plugins/cgc-og-image --name cgc-og-image
```

That adds the plugin's entry to `quartz.config.yaml`. Give it your icon, and disable stock
`og-image`. This plugin runs stock's code, so leave stock installed. With both enabled, the build
fails.

```yaml title="quartz.config.yaml"
plugins:
  - source: "@quartz-community/og-image"
    enabled: false
  - source:
      repo: git+https://github.com/chaoticgoodcomputing/blog.git#v<x.y.z>
      name: cgc-og-image
      subdir: quartz-v5/plugins/cgc-og-image
    enabled: true
    options:
      colorScheme: darkMode
      # A file beside quartz.config.yaml.
      icon: site-icon.png
```

## Options

| Option               | Type                        | Default                     | Description                                                                                                 |
| -------------------- | --------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `icon`               | `string`                    | stock's icon                | A PNG, JPEG or SVG for the card's corner, as a path from the Quartz root. The build fails if it can't be read. |
| `colorScheme`        | `"lightMode" \| "darkMode"` | `"lightMode"`               | Which of the theme's palettes the card uses.                                                                |
| `width`              | `number`                    | `1200`                      | Card width in pixels.                                                                                       |
| `height`             | `number`                    | `630`                       | Card height in pixels.                                                                                      |
| `excludeRoot`        | `boolean`                   | `false`                     | Stock's option, passed through.                                                                             |
| `defaultTitle`       | `string`                    | `"Untitled"`                | The title for a page without one.                                                                           |
| `defaultDescription` | `string`                    | `"No description provided"` | The description for a page without one.                                                                     |

Every option except `icon` is stock's and does what stock's does. A page with `socialImage` in its
frontmatter keeps that image, as with stock.

## More

- [`CONTEXT.md`](https://github.com/chaoticgoodcomputing/blog/blob/main/quartz-v5/plugins/cgc-og-image/CONTEXT.md)
  defines the plugin's terms.
- [ADR-0001](https://github.com/chaoticgoodcomputing/blog/blob/main/quartz-v5/plugins/cgc-og-image/docs/adr/0001-stock-og-image-under-its-own-name.md)
  explains why it runs stock `og-image` under stock's own name.
- The specs, in [`e2e/`](https://github.com/chaoticgoodcomputing/blog/tree/main/quartz-v5/plugins/cgc-og-image/e2e),
  compare cards as files: two pages that differ only in something the card must not show get
  byte-identical cards.
