---
title: quartz-backlinks
tags:
  - projects/site/plugins
  - engineering/frontend
---

`@chaoticgoodcomputing/quartz-backlinks` is a [Quartz 5](https://quartz.jzhao.xyz/) plugin that lists the pages linking to a page, as Quartz's own backlinks do, with two differences: public pages come first, and each private page carries a lock, or, if you prefer, is left out.

It is the `Backlinks` component from this site's Quartz 4 days, carried over as a plugin. The lock is now drawn when the site builds, where v4 added it with a script after the page loaded, fetching the icon from a CDN.

## What it renders

A heading, then one link per page that links here:

```html
<div class="cgc-backlinks">
  <h3 class="cgc-backlinks__heading">Backlinks</h3>
  <ul class="cgc-backlinks__list overflow">
    <li class="cgc-backlinks__item">
      <a class="cgc-backlinks__link" href="../notes/a-walk">
        <span class="cgc-backlinks__mark"></span>
        <span class="cgc-backlinks__name">A walk</span>
      </a>
    </li>
    <li class="cgc-backlinks__item">
      <a class="cgc-backlinks__link cgc-backlinks__link--private" href="../notes/a-daily-note">
        <span class="cgc-backlinks__mark"
          ><svg class="cgc-backlinks__icon" viewBox="0 0 24 24" aria-hidden="true" …><path fill="currentColor" d="…" /></svg
        ></span>
        <span class="cgc-backlinks__name">A daily note</span>
      </a>
    </li>
    <li class="cgc-backlinks__end overflow-end"></li>
  </ul>
</div>
```

- **Every page that links here** is listed, `.mdx` pages and pages whose links come from other plugins included. A page marked `unlisted: true` is left out, as Quartz's own backlinks leave it out.
- **The order** puts public pages first, then private ones. Within each group, the most recently modified page comes first, falling back to its published date. Pages changed on the same day are in reverse alphabetical order of title, as they were in Quartz 4.
- **A private page** is one that carries one of the `privateTags`, or a descendant of one: with the default, `private` and `private/work` are private, but `privateer` isn't. Its link gets the `--private` modifier and a lock before its title. The lock is [Material Design Icons](https://pictogrammers.com/library/mdi/)' `mdi:lock`, drawn inline as SVG when the site builds, so the page makes no request for it. It is painted in the link's colour.
- **A public page** gets a bullet before its title instead.
- **Private pages can be left out** instead of marked, with `excludePrivate`. Then only public pages are listed, and a page that only private pages link to has no backlinks, so it gets no section unless `hideWhenEmpty` is off.
- **The links get no page preview on hover.** They aren't marked as Quartz's `internal` links, as they weren't in Quartz 4, so Quartz's popovers pass them by. Following one still navigates within the site.
- **A long list** scrolls in its own box, with its bottom faded out until the reader scrolls to the end, as Quartz's own backlinks do.
- **A page no page links to** gets no section at all, unless `hideWhenEmpty` is off. Then the list says there are no backlinks.

The heading and the empty-list text come in every locale Quartz's own backlinks have.

The plugin doesn't need a tag engine. It reads each page's tags from its frontmatter, and takes the private tags as its own option, as [quartz-seo](https://blog.chaoticgood.computer/plugins/quartz-seo) does. Which pages are private is the rule the whole plugin family shares, from the `@chaoticgoodcomputing/tags-core` library, which this plugin builds in. A tag is matched the way Quartz writes tags, so `Private` and `private/` both name `private`. A private page is still an ordinary link here: marking it only tells the reader that the page behind it is a stub.

## Install

The plugin is the npm package `@chaoticgoodcomputing/quartz-backlinks`, built, with its type declarations, and loaded by name, as Quartz's own `@quartz-community/*` plugins are. It needs [quartz-styles](https://blog.chaoticgood.computer/plugins/quartz-styles). Install it into your Quartz site:

```sh
npm install @chaoticgoodcomputing/quartz-backlinks
```

and list it in `quartz.config.yaml` by its package name:

```yaml
plugins:
  - source: "@chaoticgoodcomputing/quartz-backlinks"
    enabled: true
```

Its peers, `@quartz-community/types`, `@quartz-community/utils` and Preact, are your site's own copies, so a page has one Preact. The package isn't on npm yet: it is published after this site moves to Quartz 5 ([#90](https://github.com/chaoticgoodcomputing/blog/issues/90)).

Disable Quartz's own `@quartz-community/backlinks`, which this plugin replaces.

The install also installs [Iconify](https://iconify.design/)'s packages, which draw the lock while the site builds, MDI's icons among them.

## Configure

```yaml
plugins:
  - source: "@chaoticgoodcomputing/quartz-backlinks"
    enabled: true
    options:
      privateTags:
        - private
      excludePrivate: true
    layout:
      position: right
      priority: 50
      condition: not-index
```

| Option | Default | |
| --- | --- | --- |
| `privateTags` | `[private]` | Tags that make a page private, together with their descendants. |
| `excludePrivate` | `false` | Leave private pages out of the list, rather than list them after the public pages with a lock. |
| `hideWhenEmpty` | `true` | Leave the section out of a page no page links to. |

If you also run [quartz-seo](https://blog.chaoticgood.computer/plugins/quartz-seo), [quartz-graph](https://blog.chaoticgood.computer/plugins/quartz-graph) or [quartz-tag-explorer](https://blog.chaoticgood.computer/plugins/quartz-tag-explorer), give them all the same private tags, through a YAML anchor, so the pages search engines are asked to leave out are the ones marked, or left out, here and in the graph and the explorer.

This site turns `excludePrivate` on, so its private notes never show in a page's backlinks. Quartz 4 listed them with a lock.

## Styling

The CSS is library CSS, following [ADR-0003](https://github.com/chaoticgoodcomputing/blog/blob/main/docs/adr/0003-library-css-in-plugins-application-css-at-the-site.md):

- **Classes:** one BEM block, `.cgc-backlinks`, with the elements `__heading`, `__list`, `__item`, `__link`, `__mark`, `__icon`, `__name`, `__empty` and `__end`, and the modifier `__link--private`. Selectors are single classes, apart from the bullet, which is the `::before` of an empty mark.
- **Core's overflow list:** the list and its last item also carry Quartz's `overflow` and `overflow-end` classes, and a script adds Quartz's `gradient-active` while there is more below. Quartz styles those. The plugin's own stylesheet selects none of them.
- **Cascade layer:** the rules sit in the `cgc.backlinks` layer, above Quartz's own styles and themes, and below any unlayered site CSS.
- **Colours:** links keep the colour your theme gives links, and the lock, 12px square, is drawn in `currentColor`, so it takes the same colour and follows the reader's colour scheme. The bullet is the theme's `--gray`.

The build checks the stylesheet with `@chaoticgoodcomputing/css-check` and fails if a selector reaches outside the block, if it defines a custom property or other name outside the block, or if it sets a colour literal or a font family other than one of the theme's four, such as `var(--bodyFont)`.

## Develop

This package is the Nx project `quartz-backlinks`, in `quartz-v5/plugins/quartz-backlinks/`. Its manifest name is still `cgc-backlinks`, which names its CSS, so the class names and properties above keep it. Its specs live in [`e2e/`](https://github.com/chaoticgoodcomputing/blog/tree/main/quartz-v5/plugins/quartz-backlinks/e2e) and run against the shared fixture site ([ADR-0004](https://github.com/chaoticgoodcomputing/blog/blob/main/docs/adr/0004-playwright-e2e-as-the-plugin-tdd-loop.md)):

```sh
pnpm nx run quartz-backlinks:e2e
pnpm nx run quartz-backlinks:typecheck
```
