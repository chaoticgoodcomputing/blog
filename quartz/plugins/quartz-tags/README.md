---
title: quartz-tags
tags:
  - projects/site/plugins
  - engineering/frontend
---

`@chaoticgoodcomputing/quartz-tags` is a [Quartz 5](https://quartz.jzhao.xyz/) plugin that gives a site one dictionary of tag colours and icons, and publishes it resolved for other plugins to read. It draws nothing itself: tag badges, tag explorers and graphs are other plugins, which read what it publishes. This site's tag badges come from [quartz-tag-list](https://blog.chaoticgood.computer/plugins/quartz-tag-list).

A tag you don't list takes its colour and icon from its nearest listed ancestor, so the dictionary only names the tags that differ from their parent.

## What it publishes

For every page, on the page's `fileData.cgcTags`:

```ts
interface TagsData {
  tags: Record<string, TagProperties> // the page's own tags, in frontmatter order
  primary: (TagProperties & { tag: string }) | null // the tag that stands for the page
  ancestors: Record<string, TagProperties> // every tag the page is under, its own included
}
interface TagProperties {
  color: string // the tag's colour property, e.g. "--cgc-tag-engineering--ai"
  icon: string | null // its icon id, e.g. "mdi:robot", its own or its nearest ancestor's
}
```

For the browser, `static/cgcTags.json`: every tag any page carries, and every ancestor of one, mapped to its `TagProperties`.

```json
{ "engineering": { "color": "--cgc-tag-engineering", "icon": "mdi:wrench" },
  "engineering/ai": { "color": "--cgc-tag-engineering--ai", "icon": "mdi:robot" } }
```

And a stylesheet, `static/cgcTags.css`, linked from every page. It defines one custom property per tag on `:root`, in the `cgc.tags` cascade layer:

```css
@layer cgc.tags {
  :root {
    --cgc-tags-default: var(--darkgray);
    --cgc-tag-engineering: light-dark(#0070cc, #008CFF);
    --cgc-tag-engineering--ai: var(--cgc-tag-engineering);
    --cgc-tag-misc: var(--cgc-tags-default);
  }
}
```

- A tag's property is `--cgc-tag-` and the tag, with each `/` written `--`. A character a CSS name can't hold is escaped, and two tags that would share a name fail the build.
- A tag with a colour of its own gets that colour, exactly as written. A tag without one gets `var()` of its parent's property, and a top-level tag gets `var(--cgc-tags-default)`.
- So colours inherit through the cascade. Override one tag's property in your own CSS, and its descendants follow.

These three shapes are the plugin's contract, and its specs pin them.

**The primary tag** is the page's most specific tag, the deepest one. When two are equally deep, the first in the frontmatter wins. A page can name a different one with `primaryTag`, which must be one of its tags:

```yaml
tags: [engineering/ai, economics/finance]
primaryTag: economics/finance
```

## Install

The plugin is the npm package `@chaoticgoodcomputing/quartz-tags`, built, with its type declarations, and loaded by name, as Quartz's own `@quartz-community/*` plugins are. It needs [quartz-styles](https://blog.chaoticgood.computer/plugins/quartz-styles), which gives the family its cascade layer, so install that too. Install it into your Quartz site:

```sh
npm install @chaoticgoodcomputing/quartz-tags
```

and list it in `quartz.config.yaml` by its package name:

```yaml
plugins:
  - source: "@chaoticgoodcomputing/quartz-tags"
    enabled: true
```

Its peers, `@quartz-community/types`, `@quartz-community/utils` and `lightningcss`, are your site's own copies. The package isn't on npm yet: it is published after this site moves to Quartz 5 ([#90](https://github.com/chaoticgoodcomputing/blog/issues/90)).

## Configure

```yaml
plugins:
  - source: "@chaoticgoodcomputing/quartz-tags"
    enabled: true
    options:
      tags:
        engineering: { color: "light-dark(#0070cc, #008CFF)", icon: mdi:wrench }
        engineering/ai: { icon: mdi:robot }
        writing: { color: "var(--secondary)", icon: mdi:pencil }
      defaultColor: var(--darkgray)
```

| Option | Default | |
| --- | --- | --- |
| `tags` | `{}` | The dictionary. Each key is a tag, written as in frontmatter, and each value has an optional `color` and an optional `icon`. |
| `defaultColor` | `var(--darkgray)` | The colour of a tag that neither it nor any ancestor gives one. |

A **colour** is anything CSS accepts as a colour: a hex, a named colour, `oklch()`, `color-mix()`, a theme's `var(--secondary)` or a `light-dark()` pair. A reference to a theme property follows the theme, and a `light-dark()` pair follows the colour scheme. An **icon** is an icon id, `prefix:name`, such as `mdi:robot`. The plugin only publishes it, and the plugin that draws icons resolves it: [quartz-tag-list](https://blog.chaoticgood.computer/plugins/quartz-tag-list) fails the build on an id that no icon collection has.

The build fails on any mistake in the dictionary: a colour CSS can't read, an icon id that isn't one, or a field a tag doesn't have. It can't check that a property a colour refers to exists, since the theme defines that when the page loads. A page's `primaryTag` that isn't one of its tags fails the build too.

A tag colour is decorative. It paints the rim of a tag's bubble, the circle that holds its icon wherever the site draws one, and never the bubble's circle or icon, which are the theme's `--lightgray` and `--dark`, and never text, so no contrast check applies. The tag explorer's icons, which are not bubbles, are the one mark it paints whole.

### What a site needs for `light-dark()`

The stylesheet reaches the browser as written. Quartz doesn't rewrite it for older browsers, as it does the CSS it bundles itself. So a `light-dark()` colour needs two things:

- a browser that supports `light-dark()`, as every major browser has since 2024;
- a `color-scheme` on the page, which [Quartz's darkmode plugin](https://github.com/quartz-community/darkmode) sets. Without one, the browser always picks the light half.

The reasoning is in the package's [ADR-0001](https://github.com/chaoticgoodcomputing/blog/blob/main/quartz/plugins/quartz-tags/docs/adr/0001-the-tag-stylesheet-is-an-emitted-file.md).

## Writing a plugin that reads it

A plugin that uses tag colours or icons is a consumer of `quartz-tags`:

1. It declares the engine by its full **package name** in its `package.json`, with an `order` of 20 or more: `"quartz": { "dependencies": ["@chaoticgoodcomputing/quartz-tags"] }`. Quartz matches a dependency against the whole package name, so `quartz-tags` alone, or the manifest name `cgc-tags`, finds nothing.
2. It reads `fileData.cgcTags` on the server, or `static/cgcTags.json` in the browser, and never the dictionary. The types, and the resolution rule, are in the library [`@chaoticgoodcomputing/tags-core`](https://github.com/chaoticgoodcomputing/blog/tree/main/quartz/libs/tags-core).
3. It paints with the tag's property, `var(--cgc-tag-…)`, so the colour follows the scheme with no script. A canvas can't use CSS, so it resolves the property with the library's `resolveTagColour()` and resolves it again on `themechange`.

A component that renders tags a page doesn't carry, such as a tag page's subtags, finds their properties in the `ancestors` of every page (`allFiles`). The reasoning is in the package's [ADR-0002](https://github.com/chaoticgoodcomputing/blog/blob/main/quartz/plugins/quartz-tags/docs/adr/0002-a-page-publishes-every-tag-it-is-under.md).

## Develop

This package is the Nx project `quartz-tags`, in `quartz/plugins/quartz-tags/`. Its manifest name is still `cgc-tags`, which names its CSS, so the class names and properties above keep it. Its specs live in [`e2e/`](https://github.com/chaoticgoodcomputing/blog/tree/main/quartz/plugins/quartz-tags/e2e) and run against the shared fixture site ([ADR-0004](https://github.com/chaoticgoodcomputing/blog/blob/main/docs/adr/0004-playwright-e2e-as-the-plugin-tdd-loop.md)), with the shared suite's proof that its consumers receive what it publishes:

```sh
pnpm nx run quartz-tags:e2e
pnpm nx run quartz-tags:typecheck
```
