---
title: quartz-styles
tags:
  - projects/site/plugins
  - engineering/frontend
---

Gives the `@chaoticgoodcomputing` plugin family its own cascade layer, `cgc`, ranked above Quartz's core styles and themes but below any unlayered site CSS. It emits one line, `@layer cgc;`, and every family plugin that ships CSS depends on it.

## Installation

```bash
npm install @chaoticgoodcomputing/quartz-styles
```

## Usage

```yaml title="quartz.config.yaml"
plugins:
  - source: "@chaoticgoodcomputing/quartz-styles"
    enabled: true
```

It takes no options. Its default `order` of 15 ranks the family above a theme at its default order (10).

### Writing a plugin that uses it

1. Put all of the plugin's CSS in one dotted sublayer: `@layer cgc.<package> { … }`.
2. Declare the dependency by package name, with an `order` of 15 or more:

   ```json
   "quartz": { "dependencies": ["@chaoticgoodcomputing/quartz-styles"] }
   ```

## Documentation

See [CONTEXT.md](https://github.com/chaoticgoodcomputing/blog/blob/main/quartz/plugins/quartz-styles/CONTEXT.md), the [decision records](https://github.com/chaoticgoodcomputing/blog/tree/main/quartz/plugins/quartz-styles/docs/adr) and the family's [styling ADR](https://github.com/chaoticgoodcomputing/blog/blob/main/docs/adr/0003-library-css-in-plugins-application-css-at-the-site.md).

## License

MIT
