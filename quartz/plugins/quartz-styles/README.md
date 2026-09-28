---
title: Quartz Style Library
tags:
  - projects/site/plugins
  - engineering/languages/typescript
  - engineering/frontend
description: A library plugin for Quartz 5 sites to integrate plugin styling into the central style system
date: 2026-09-27
---

Gives the `@chaoticgoodcomputing` plugin family its own cascade layer, `cgc`, ranked above Quartz's core styles and themes but below any unlayered site CSS. It emits one line, `@layer cgc;`, and every family plugin that ships CSS depends on it.

A general prerequisite to most of the other [[/tags/projects/site/plugins|CGC plugins]]

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

## License

MIT
