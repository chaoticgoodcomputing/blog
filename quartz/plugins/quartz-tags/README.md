---
title: quartz-tags
tags:
  - projects/site/plugins
  - engineering/frontend
---

Holds a site's dictionary of tag colours and icons, and publishes it for other plugins to draw with. It renders nothing itself. A tag you don't list inherits from its nearest listed ancestor.

It publishes:

- `fileData.cgcTags` on each page: its tags, its primary tag and every tag it's under.
- `static/cgcTags.json`, every tag's colour property and icon, for the browser.
- `static/cgcTags.css`, one custom property per tag, such as `--cgc-tag-engineering--ai`. Override one in your own CSS and its subtags follow.

## Installation

```bash
npm install @chaoticgoodcomputing/quartz-tags
```

Requires [quartz-styles](https://blog.chaoticgood.computer/plugins/quartz-styles).

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

A page's primary tag is its deepest tag. Name another with `primaryTag:` in its frontmatter.

## Configuration

| Option         | Type                                | Default           | Description                                                           |
| -------------- | ----------------------------------- | ----------------- | --------------------------------------------------------------------- |
| `tags`         | `Record<string, { color?, icon? }>` | `{}`              | The dictionary. A colour is any CSS colour; an icon is `prefix:name`. |
| `defaultColor` | `string`                            | `var(--darkgray)` | The colour of a tag with no colour in its lineage.                    |

Mistakes in the dictionary fail the build. `light-dark()` colours need a `color-scheme` on the page, which Quartz's darkmode plugin sets.

## Documentation

See [CONTEXT.md](https://github.com/chaoticgoodcomputing/blog/blob/main/quartz/plugins/quartz-tags/CONTEXT.md), the [decision records](https://github.com/chaoticgoodcomputing/blog/tree/main/quartz/plugins/quartz-tags/docs/adr) and [`@chaoticgoodcomputing/tags-core`](https://github.com/chaoticgoodcomputing/blog/tree/main/quartz/libs/tags-core) for the published types.

## License

MIT
