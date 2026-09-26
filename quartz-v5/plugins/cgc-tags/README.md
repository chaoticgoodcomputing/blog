---
title: cgc-tags
tags:
  - projects/site/plugins
  - engineering/frontend
---

`cgc-tags` is a [Quartz 5](https://quartz.jzhao.xyz/) plugin that gives a site one dictionary of tag colours and icons, and publishes it resolved for other plugins to read. It draws nothing itself: tag badges, tag explorers and graphs are other plugins, which read what it publishes. This site's tag badges come from [cgc-tag-list](https://blog.chaoticgood.computer/plugins/cgc-tag-list).

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

Plugins in this family ship as source from [the blog's monorepo](https://github.com/chaoticgoodcomputing/blog), and a site pins a release tag:

```sh
npx quartz plugin add git+https://github.com/chaoticgoodcomputing/blog.git#v<x.y.z> --subdir quartz-v5/plugins/cgc-tags --name cgc-tags
```

Keep `--name`: without it, a plugin installed from a subdirectory is named after the repository, and every plugin in the family would install over the last. `cgc-tags` depends on [cgc-styles](https://blog.chaoticgood.computer/plugins/cgc-styles), which gives the family its cascade layer, so install that too.

> [!WARNING]
> **Depending on `cgc-styles` by name needs a change to Quartz.** Stock Quartz matches a dependency only against the exact `source:` string. Matching by plugin name is a small change to its loader, carried in this repository's copy of Quartz and proposed upstream on [chaoticgoodcomputing/blog#47](https://github.com/chaoticgoodcomputing/blog/issues/47). Until it lands, this plugin builds only against that copy.

## Configure

```yaml
plugins:
  - source: ... # as `quartz plugin add` wrote it
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

A **colour** is anything CSS accepts as a colour: a hex, a named colour, `oklch()`, `color-mix()`, a theme's `var(--secondary)` or a `light-dark()` pair. A reference to a theme property follows the theme, and a `light-dark()` pair follows the colour scheme. An **icon** is an icon id, `prefix:name`, such as `mdi:robot`. The plugin only publishes it, and the plugin that draws icons resolves it: [cgc-tag-list](https://blog.chaoticgood.computer/plugins/cgc-tag-list) fails the build on an id that no icon collection has.

The build fails on any mistake in the dictionary: a colour CSS can't read, an icon id that isn't one, or a field a tag doesn't have. It can't check that a property a colour refers to exists, since the theme defines that when the page loads. A page's `primaryTag` that isn't one of its tags fails the build too.

A tag colour is decorative. It paints marks, such as a badge's ring, an icon or a graph node, and never text, so no contrast check applies.

### What a site needs for `light-dark()`

The stylesheet reaches the browser as written. Quartz doesn't rewrite it for older browsers, as it does the CSS it bundles itself. So a `light-dark()` colour needs two things:

- a browser that supports `light-dark()`, as every major browser has since 2024;
- a `color-scheme` on the page, which [Quartz's darkmode plugin](https://github.com/quartz-community/darkmode) sets. Without one, the browser always picks the light half.

The reasoning is in the package's [ADR-0001](https://github.com/chaoticgoodcomputing/blog/blob/main/quartz-v5/plugins/cgc-tags/docs/adr/0001-the-tag-stylesheet-is-an-emitted-file.md).

## Writing a plugin that reads it

A plugin that uses tag colours or icons is a consumer of `cgc-tags`:

1. It declares the engine by **plugin name** in its `package.json`, with an `order` of 20 or more: `"quartz": { "dependencies": ["cgc-tags"] }`. The same warning applies as above.
2. It reads `fileData.cgcTags` on the server, or `static/cgcTags.json` in the browser, and never the dictionary. The types, and the resolution rule, are in the library [`@chaoticgoodcomputing/tags-core`](https://github.com/chaoticgoodcomputing/blog/tree/main/quartz-v5/libs/tags-core).
3. It paints with the tag's property, `var(--cgc-tag-…)`, so the colour follows the scheme with no script. A canvas can't use CSS, so it resolves the property with the library's `resolveTagColour()` and resolves it again on `themechange`.

A component that renders tags a page doesn't carry, such as a tag page's subtags, finds their properties in the `ancestors` of every page (`allFiles`). The reasoning is in the package's [ADR-0002](https://github.com/chaoticgoodcomputing/blog/blob/main/quartz-v5/plugins/cgc-tags/docs/adr/0002-a-page-publishes-every-tag-it-is-under.md).

## Develop

This package is the Nx project `cgc-tags`. Its specs live in [`e2e/`](https://github.com/chaoticgoodcomputing/blog/tree/main/quartz-v5/plugins/cgc-tags/e2e) and run against the shared fixture site ([ADR-0004](https://github.com/chaoticgoodcomputing/blog/blob/main/docs/adr/0004-playwright-e2e-as-the-plugin-tdd-loop.md)), with the shared suite's proof that its consumers receive what it publishes:

```sh
pnpm nx run cgc-tags:e2e
pnpm nx run cgc-tags:typecheck
```
