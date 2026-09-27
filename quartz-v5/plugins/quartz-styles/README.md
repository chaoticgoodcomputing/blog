---
title: quartz-styles
tags:
  - projects/site/plugins
  - engineering/frontend
---

`@chaoticgoodcomputing/quartz-styles` is a [Quartz 5](https://quartz.jzhao.xyz/) plugin that gives our plugin family its own cascade layer, `cgc`, ranked above Quartz's core styles and above themes. It emits one line of CSS, `@layer cgc;`, and nothing else.

## Why a plugin that emits one line

Quartz wraps every component's stylesheet in `@layer quartz-base`, so a plugin's component CSS has no rank of its own: it ties with core and wins only by specificity. A plugin's `externalResources()` stylesheets aren't wrapped, and a layer ranks by the first place its name appears on the page. So whichever plugin says `cgc` first decides where the whole family sits.

`quartz-styles` is that plugin. Every package of the family that emits CSS writes it into its own sublayer, `@layer cgc.<package> {…}`, and declares `@chaoticgoodcomputing/quartz-styles` as a dependency. Quartz then refuses to build a site that orders one of them ahead of it. With it in place:

- Our CSS beats core and stock plugin CSS on the elements our plugins render, whatever the specificity.
- A theme still reskins our plugins, through the custom properties they use, but can't restructure them.
- Anything unlayered, such as a site's own `custom.scss` rules, still beats us.

The reasoning is in the family's styling decision, [ADR-0003](https://github.com/chaoticgoodcomputing/blog/blob/main/docs/adr/0003-library-css-in-plugins-application-css-at-the-site.md), and its family-layer amendment.

## Install

The plugin is the npm package `@chaoticgoodcomputing/quartz-styles`, built, with its type declarations, and loaded by name, as Quartz's own `@quartz-community/*` plugins are. Install it into your Quartz site:

```sh
npm install @chaoticgoodcomputing/quartz-styles
```

and list it in `quartz.config.yaml` by its package name:

```yaml
plugins:
  - source: "@chaoticgoodcomputing/quartz-styles"
    enabled: true
```

It takes no options. It runs on a stock copy of Quartz 5. The package isn't on npm yet: it is published after this site moves to Quartz 5 ([#90](https://github.com/chaoticgoodcomputing/blog/issues/90)).

## Where the family ranks

`quartz-styles` is a transformer with a default `order` of **15**. Quartz emits every transformer's stylesheets, sorted by `order`, before any emitter's, so the family layer, `cgc`, ranks:

- above `quartz-base`, always, because core's stylesheet comes first on every page;
- above a theme at its default order, such as [`@quartz-themes/core`](https://github.com/quartz-themes/core) at 10;
- below any layer introduced by a transformer with a higher `order`, or by any emitter whatever its order. On a stock site that includes `@quartz-community/quartz-fonts`' `quartz-fonts` layer, which only sets font variables, so it never competes with our rules.

To move the family, set `order:` on this plugin; that moves it among transformers only, never past an emitter's layer. To fix every layer on the page at once, name them all in one `@layer` statement that loads before any plugin's CSS; that overrules every plugin's `order`. The reasoning behind 15 is in the package's [ADR-0001](https://github.com/chaoticgoodcomputing/blog/blob/main/quartz-v5/plugins/quartz-styles/docs/adr/0001-the-family-ranks-just-above-themes.md).

## Writing a plugin that uses it

A plugin of the family that emits CSS from `externalResources()` does two things:

1. It puts all of its own CSS in one sublayer, spelled dotted and nowhere nested: `@layer cgc.<package> { … }`. The CSS minifier Quartz uses silently inverts sublayer order when one file spells the same sublayer both ways.
2. It declares the engine by its **plugin name**, the package name, in its `package.json`, never by a path:

   ```json
   "quartz": { "dependencies": ["@chaoticgoodcomputing/quartz-styles"] }
   ```

   Its own `order` must be 15 or more, or the build is refused.

Quartz names a plugin listed by package name by that whole name, so the dependency matches it at every site that installs the package, on a stock copy of Quartz. A path would name the engine correctly at one site only, since a local source is relative to wherever the site runs. The package's manifest name, `quartz-styles`, names nothing a dependency can match: it is kept only for the family's CSS.
