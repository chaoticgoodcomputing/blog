---
title: cgc-styles
tags:
  - projects/site
  - engineering/frontend
---

`cgc-styles` is a [Quartz 5](https://quartz.jzhao.xyz/) plugin that gives the `cgc-*` plugin family its own cascade layer, `cgc`, ranked above Quartz's core styles and above themes. It emits one line of CSS, `@layer cgc;`, and nothing else.

## Why a plugin that emits one line

Quartz wraps every component's stylesheet in `@layer quartz-base`, so a plugin's component CSS has no rank of its own: it ties with core and wins only by specificity. A plugin's `externalResources()` stylesheets aren't wrapped, and a layer ranks by the first place its name appears on the page. So whichever plugin says `cgc` first decides where the whole family sits.

`cgc-styles` is that plugin. Every `cgc-*` package that emits CSS writes it into its own sublayer, `@layer cgc.<package> {…}`, and declares `cgc-styles` as a dependency. Quartz then refuses to build a site that orders one of them ahead of it. With it in place:

- Our CSS beats core and stock plugin CSS on the elements our plugins render, whatever the specificity.
- A theme still reskins our plugins, through the custom properties they use, but can't restructure them.
- Anything unlayered, such as a site's own `custom.scss` rules, still beats us.

The reasoning is in the family's styling decision, [ADR-0003](https://github.com/chaoticgoodcomputing/blog/blob/main/docs/adr/0003-library-css-in-plugins-application-css-at-the-site.md), and its family-layer amendment.

## Install

Add it with Quartz's plugin CLI, pinned to a release tag:

```sh
npx quartz plugin add git+https://github.com/chaoticgoodcomputing/blog.git#v<x.y.z> --subdir quartz-v5/plugins/cgc-styles --name cgc-styles
```

Or add it to `quartz.config.yaml` yourself. Keep `name:`: without it, a plugin installed from a subdirectory is named after the repository, and every `cgc-*` plugin would install over the last.

```yaml
plugins:
  - source:
      repo: https://github.com/chaoticgoodcomputing/blog.git
      ref: v<x.y.z>
      subdir: quartz-v5/plugins/cgc-styles
      name: cgc-styles
    enabled: true
```

It takes no options. It runs on a stock copy of Quartz 5.

## Where the family ranks

`cgc-styles` is a transformer with a default `order` of **15**. Quartz emits plugin stylesheets in `order`, so the `cgc` layer ranks:

- above `quartz-base`, always, because core's stylesheet comes first on every page;
- above a theme at its default order, such as [`@quartz-themes/core`](https://github.com/quartz-themes/core) at 10;
- below any layer a plugin with a higher `order` introduces. On a stock site that includes `@quartz-community/quartz-fonts`' `quartz-fonts` layer, which only sets font variables, so it never competes with our rules.

To move the family, set `order:` on this plugin. To fix every layer on the page at once, name them all in one `@layer` statement that loads before any plugin's CSS; that overrules every plugin's `order`. The reasoning behind 15 is in the package's [ADR-0001](https://github.com/chaoticgoodcomputing/blog/blob/main/quartz-v5/plugins/cgc-styles/docs/adr/0001-the-family-ranks-just-above-themes.md).

## Writing a plugin that uses it

A `cgc-*` plugin that emits CSS from `externalResources()` does two things:

1. It puts all of its own CSS in one sublayer, spelled dotted and nowhere nested: `@layer cgc.<package> { … }`. The CSS minifier Quartz uses silently inverts sublayer order when one file spells the same sublayer both ways.
2. It declares the engine by **plugin name** in its `package.json`, never by a path:

   ```json
   "quartz": { "dependencies": ["cgc-styles"] }
   ```

   Its own `order` must be 15 or more, or the build is refused.

A path would name `cgc-styles` correctly at one site only: a local source is relative to wherever the site runs, and a site that installs from this repository names it by an object source. The name is the same everywhere.

> [!WARNING]
> **Declaring the engine by name needs a change to Quartz.** Stock Quartz matches a dependency only against the exact `source:` string. Matching by plugin name is a small change to its loader, carried in this repository's copy of Quartz and proposed upstream on [chaoticgoodcomputing/blog#47](https://github.com/chaoticgoodcomputing/blog/issues/47). Until it lands, a plugin that declares `cgc-styles` by name builds only against that copy. `cgc-styles` itself doesn't need it.
