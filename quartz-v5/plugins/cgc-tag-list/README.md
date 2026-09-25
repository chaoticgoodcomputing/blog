---
title: cgc-tag-list
tags:
  - projects/site
  - engineering/frontend
---

`cgc-tag-list` is a [Quartz 5](https://quartz.jzhao.xyz/) plugin that lists a page's tags under its title as badges, each with a ring in the tag's colour. The colours come from [cgc-tags](https://blog.chaoticgood.computer/plugins/cgc-tags), the plugin that holds the site's tag dictionary.

It is the `TagList` component from this site's Quartz 4 days, carried over as a plugin. The colours are now painted when the site builds, where v4 painted them with a script after the page loaded.

## What it renders

A list of badges, one per tag, in the order the page's frontmatter lists them:

```html
<ul class="cgc-tag-list">
  <li class="cgc-tag-list__item" data-tag="engineering/ai">
    <a class="internal cgc-tag-list__link" href="../tags/engineering/ai">
      <span class="cgc-tag-list__ring" style="color: var(--cgc-tag-engineering--ai)" title="engineering/ai"></span>
      <span class="cgc-tag-list__name">ai</span>
      <span class="cgc-tag-list__count">(12)</span>
    </a>
  </li>
</ul>
```

- **The ring** is drawn in the tag's colour, through the property `cgc-tags` publishes for it. A tag with no colour of its own gets its parent's. The colour paints the ring, and never the tag's name or count, which keep the colour of the text around them.
- **The name** is the tag's last segment, after a `#`: `engineering/ai` reads `#ai`. The ring's tooltip has the whole tag.
- **The count** is the number of pages under the tag, counting the pages of its subtags too.
- **The link** goes to the tag's page. It is an internal link, so it gets Quartz's page preview on hover.
- **On a tag page**, with `showSubtags` on, the list shows the tag's subtags instead, after its parent if `showParentTag` is on. That is how this site's tag pages let a reader move up and down the hierarchy.
- **On a narrow screen**, 800px or less, each badge shows only its ring. Pressing and holding one expands it to show the name and count, without following the link. A tap follows the link.

A page with no tags gets no list.

## Install

Plugins in this family ship as source from [the blog's monorepo](https://github.com/chaoticgoodcomputing/blog), and a site pins a release tag. This plugin needs [cgc-tags](https://blog.chaoticgood.computer/plugins/cgc-tags) and [cgc-styles](https://blog.chaoticgood.computer/plugins/cgc-styles):

```sh
npx quartz plugin add git+https://github.com/chaoticgoodcomputing/blog.git#v<x.y.z> --subdir quartz-v5/plugins/cgc-tag-list --name cgc-tag-list
```

Keep `--name`: without it, a plugin installed from a subdirectory is named after the repository, and every plugin in the family would install over the last. Disable Quartz's own `@quartz-community/tag-list`, which this plugin replaces.

> [!WARNING]
> **Depending on `cgc-tags` and `cgc-styles` by name needs a change to Quartz.** Stock Quartz matches a dependency only against the exact `source:` string. Matching by plugin name is a small change to its loader, carried in this repository's copy of Quartz and proposed upstream on [chaoticgoodcomputing/blog#47](https://github.com/chaoticgoodcomputing/blog/issues/47). Until it lands, this plugin builds only against that copy.

## Configure

```yaml
plugins:
  - source: ... # as `quartz plugin add` wrote it
    enabled: true
    options:
      showSubtags: true
      showParentTag: true
    layout:
      position: beforeBody
      priority: 30
```

| Option | Default | |
| --- | --- | --- |
| `showSubtags` | `false` | On a tag page, list the tag's subtags rather than the page's own tags. |
| `showParentTag` | `false` | On a tag page listing its subtags, list the tag's parent first. |
| `showCount` | `true` | Show the number of pages under each tag. |

One plugin has one set of options for every page, so these apply only where they make sense. Quartz 4 set them per layout, and only its tags layout turned on `showSubtags` and `showParentTag`.

## Styling

The CSS is library CSS, following [ADR-0003](https://github.com/chaoticgoodcomputing/blog/blob/main/docs/adr/0003-library-css-in-plugins-application-css-at-the-site.md):

- **Classes:** one BEM block, `.cgc-tag-list`, with the elements `__item`, `__link`, `__ring`, `__name` and `__count`, and the modifier `__link--expanded` for a badge a long press has opened. Selectors are single classes, apart from the narrow-screen rules that hide a badge's name and count.
- **Cascade layer:** the rules sit in the `cgc.tag-list` layer, above Quartz's own styles and themes, and below any unlayered site CSS.
- **Colours:** the badge's background is the theme's `--lightgray`, `--gray` on hover, and the count is `--gray`. The ring's colour is its tag's.

To change a tag's colour, change it in `cgc-tags`' dictionary, or override the tag's property, `--cgc-tag-…`, in your own CSS. The ring takes its colour from its own `color`, so a rule on the ring alone can't change it. The reasoning is in the package's [ADR-0001](https://github.com/chaoticgoodcomputing/blog/blob/main/quartz-v5/plugins/cgc-tag-list/docs/adr/0001-the-ring-carries-the-tag-colour.md).

The build checks the stylesheet and fails if a selector reaches outside the block, or if it sets a colour literal or a `font-family`.

## Develop

This package is the Nx project `cgc-tag-list`. Its specs live in [`e2e/`](https://github.com/chaoticgoodcomputing/blog/tree/main/quartz-v5/plugins/cgc-tag-list/e2e) and run against the shared fixture site ([ADR-0004](https://github.com/chaoticgoodcomputing/blog/blob/main/docs/adr/0004-playwright-e2e-as-the-plugin-tdd-loop.md)):

```sh
pnpm nx run cgc-tag-list:e2e
pnpm nx run cgc-tag-list:typecheck
```
