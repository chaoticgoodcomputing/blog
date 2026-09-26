---
title: cgc-tag-list
tags:
  - projects/site/plugins
  - engineering/frontend
---

`cgc-tag-list` is a [Quartz 5](https://quartz.jzhao.xyz/) plugin that lists a page's tags under its title as badges, each with the tag's icon in a bubble, rimmed in the tag's colour. The colours and icons come from [cgc-tags](https://blog.chaoticgood.computer/plugins/cgc-tags), the plugin that holds the site's tag dictionary.

It is the `TagList` component from this site's Quartz 4 days, carried over as a plugin. The colours and icons are now drawn when the site builds, where v4 drew them with a script after the page loaded, fetching every icon from a CDN.

## What it renders

A list of badges, one per tag, in the order the page's frontmatter lists them:

```html
<ul class="cgc-tag-list">
  <li class="cgc-tag-list__item" data-tag="engineering/ai">
    <a class="internal cgc-tag-list__link" href="../tags/engineering/ai">
      <span class="cgc-tag-bubble" style="border-color: var(--cgc-tag-engineering--ai)" title="engineering/ai"
        ><svg class="cgc-tag-bubble__icon" viewBox="0 0 24 24" aria-hidden="true" …><path fill="currentColor" d="…" /></svg
      ></span>
      <span class="cgc-tag-list__name">#ai</span>
      <span class="cgc-tag-list__count">(12)</span>
    </a>
  </li>
</ul>
```

- **The bubble** is the circle that holds the tag's icon, the same bubble every plugin in this family draws, from the `@chaoticgoodcomputing/tags-core` library. Its rim is the tag's colour, through the property `cgc-tags` publishes for it, and a tag with no colour of its own gets its parent's. Its circle is the theme's `--light`, the page's background, so it stands out from the badge's `--lightgray`, and its icon the theme's `--dark`, so a bubble is light with a black icon in a light scheme, and dark with a white icon in a dark one. (A bubble outside a badge, such as a graph node, has a `--lightgray` circle.) The tag's colour paints only the rim, never the tag's name or count, which keep the colour of the text around them.
- **The icon** is the tag's icon id, such as `mdi:robot`, drawn inline as SVG when the site builds, so the page makes no request for it. A tag with no icon of its own gets its parent's, and a tag with none in its lineage has an empty bubble. Icons come from [Material Design Icons](https://pictogrammers.com/library/mdi/) (`mdi:`), installed with the plugin, or from your own SVG files (see `iconCollections`). Every mark in an icon is painted in the bubble's `--dark`, whatever colours its file had. An icon id that doesn't exist fails the build.
- **The name** is the tag's last segment, after a `#`, written as one string: `engineering/ai` reads `#ai`. The bubble's tooltip has the whole tag.
- **The bubble, the name and the count** are centred on one line. Each line of text is trimmed to its capital height (`text-box`), so it is the text as drawn that is centred, in whatever font the theme gives it. A browser without `text-box` centres the text's line box instead, which is off by a pixel or so in some fonts.
- **The count** is the number of pages under the tag, counting the pages of its subtags too.
- **The link** goes to the tag's page. It is an internal link, so it gets Quartz's page preview on hover.
- **On a tag page**, with `showSubtags` on, the list shows the tag's subtags instead, after its parent if `showParentTag` is on. That is how this site's tag pages let a reader move up and down the hierarchy.
- **On a narrow screen**, 800px or less, each badge shows only its bubble. Pressing and holding one expands it to show the name and count, without following the link. A tap follows the link.

A page with no tags gets no list.

## Install

Plugins in this family ship as source from [the blog's monorepo](https://github.com/chaoticgoodcomputing/blog), and a site pins a release tag. This plugin needs [cgc-tags](https://blog.chaoticgood.computer/plugins/cgc-tags) and [cgc-styles](https://blog.chaoticgood.computer/plugins/cgc-styles):

```sh
npx quartz plugin add git+https://github.com/chaoticgoodcomputing/blog.git#v<x.y.z> --subdir quartz-v5/plugins/cgc-tag-list --name cgc-tag-list
```

Keep `--name`: without it, a plugin installed from a subdirectory is named after the repository, and every plugin in the family would install over the last. Disable Quartz's own `@quartz-community/tag-list`, which this plugin replaces.

The install also installs [Iconify](https://iconify.design/)'s packages, which draw the icons while the site builds, MDI's icons among them.

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
      iconCollections: &iconCollections
        custom: ./icons
    layout:
      position: beforeBody
      priority: 30
```

| Option | Default | |
| --- | --- | --- |
| `showSubtags` | `false` | On a tag page, list the tag's subtags rather than the page's own tags. |
| `showParentTag` | `false` | On a tag page listing its subtags, list the tag's parent first. |
| `showCount` | `true` | Show the number of pages under each tag. |
| `iconCollections` | none | Your own icons: a prefix for each set, and the directory of SVG files that holds it. With `custom: ./icons`, the icon `custom:d20` is `./icons/d20.svg`. A relative directory resolves against your Quartz folder, as a local plugin's `source:` does. `mdi:` needs no entry. |

One plugin has one set of options for every page, so these apply only where they make sense. Quartz 4 set them per layout, and only its tags layout turned on `showSubtags` and `showParentTag`.

Your SVG files are the source of truth for your icons, and nothing made from them needs committing. When the site builds, each is cleaned up, has every colour it paints turned into `currentColor`, and is optimised. Other plugins in this family that draw icons take the same `iconCollections` option, which is why the example anchors it: give each of them `iconCollections: *iconCollections`.

## Styling

The CSS is library CSS, following [ADR-0003](https://github.com/chaoticgoodcomputing/blog/blob/main/docs/adr/0003-library-css-in-plugins-application-css-at-the-site.md):

- **Classes:** one BEM block, `.cgc-tag-list`, with the elements `__item`, `__link`, `__name` and `__count`, and the modifier `__link--expanded` for a badge a long press has opened. Selectors are single classes, apart from the narrow-screen rules that hide a badge's name and count. The bubble is its own block, `.cgc-tag-bubble`, with the element `__icon`, from `@chaoticgoodcomputing/tags-core`; this plugin ships its stylesheet and never restyles it.
- **Cascade layer:** the rules, the bubble's included, sit in the `cgc.tag-list` layer, above Quartz's own styles and themes, and below any unlayered site CSS.
- **Colours:** the badge's background is the theme's `--lightgray`, `--gray` on hover, and the count is `--gray`. The bubble's rim is its tag's colour, its circle `--light` and its icon, 18px square, `--dark`.

To change a tag's colour, change it in `cgc-tags`' dictionary, or override the tag's property, `--cgc-tag-…`, in your own CSS. The bubble takes it as its own inline `border-color`, so a rule on the bubble alone can't change it. The reasoning is in the package's [ADR-0001](https://github.com/chaoticgoodcomputing/blog/blob/main/quartz-v5/plugins/cgc-tag-list/docs/adr/0001-the-ring-carries-the-tag-colour.md).

The build checks the stylesheet with `@chaoticgoodcomputing/css-check` and fails if a selector reaches outside the block, if it defines a custom property or other name outside the block, or if it sets a colour literal or a font family other than one of the theme's four, such as `var(--bodyFont)`.

## Develop

This package is the Nx project `cgc-tag-list`. Its specs live in [`e2e/`](https://github.com/chaoticgoodcomputing/blog/tree/main/quartz-v5/plugins/cgc-tag-list/e2e) and run against the shared fixture site ([ADR-0004](https://github.com/chaoticgoodcomputing/blog/blob/main/docs/adr/0004-playwright-e2e-as-the-plugin-tdd-loop.md)):

```sh
pnpm nx run cgc-tag-list:e2e
pnpm nx run cgc-tag-list:typecheck
```
