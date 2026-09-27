---
title: quartz-tag-explorer
tags:
  - projects/site/plugins
  - engineering/frontend
---

`@chaoticgoodcomputing/quartz-tag-explorer` is a [Quartz 5](https://quartz.jzhao.xyz/) plugin that lets a reader browse a site by tag. It shows a tree of the site's tags in the left sidebar, each tag with its icon in its colour, and under each tag the pages that carry it. On a narrow screen it becomes a drawer, opened from a caret at the window's left edge. The colours and icons come from [quartz-tags](https://blog.chaoticgood.computer/plugins/quartz-tags), the plugin that holds the site's tag dictionary.

It is the `TagExplorer` component from this site's Quartz 4 days, carried over as a plugin, together with the drawer that Quartz 4's mobile sidebar menu used to provide. The tree of tags is now rendered when the site builds, where v4 built all of it with a script after the page loaded.

## What it renders

A heading, then the top-level tags, each with a button that opens it:

```html
<div class="cgc-tag-explorer" data-root="." data-index="./static/cgcTagExplorer.json" data-saved-state="true">
  <h3 class="cgc-tag-explorer__title">Tag Explorer</h3>
  <button class="cgc-tag-explorer__toggle" aria-label="Tag Explorer" …>…</button>
  <div class="cgc-tag-explorer__backdrop"></div>
  <nav class="cgc-tag-explorer__panel" aria-label="Tag Explorer">
    <div class="cgc-tag-explorer__bar">…</div>
    <ul class="cgc-tag-explorer__tree">
      <li class="cgc-tag-explorer__tag" data-tag="engineering">
        <div class="cgc-tag-explorer__row">
          <button class="cgc-tag-explorer__fold" aria-expanded="false" …>…</button>
          <a class="cgc-tag-explorer__link" href="./tags/engineering">
            <span class="cgc-tag-explorer__mark" style="color:var(--cgc-tag-engineering)"
              ><svg class="cgc-tag-explorer__icon" …>…</svg></span
            >
            <span class="cgc-tag-explorer__name">engineering</span>
            <span class="cgc-tag-explorer__count">(42)</span>
          </a>
        </div>
        <div class="cgc-tag-explorer__children">
          <ul class="cgc-tag-explorer__list">
            <!-- its subtags, then its pages once it opens -->
          </ul>
        </div>
      </li>
    </ul>
  </nav>
</div>
```

- **The tags** are every tag any page carries, nested by the tag hierarchy, so a tag that no page carries directly, such as `engineering` above `engineering/ai`, still appears. Each level lists the tags with the most pages first, and ties go A→Z. Tags in `excludeTags` are left out, together with their subtags.
- **The mark** is the tag's icon, drawn in the tag's colour when the site builds, or a dot in that colour when the tag has no icon. A tag with no colour or icon of its own takes its parent's. Icons come from [Material Design Icons](https://pictogrammers.com/library/mdi/) (`mdi:`), which install with the plugin, or from your own SVG files (see `iconCollections`). An icon id that doesn't exist fails the build. The colour paints only the mark: the tag's name and count keep the explorer's own colours.
- **The count** is the number of pages under the tag, counting the pages of its subtags too.
- **The name** links to the tag's page. The button before it opens the tag to show its subtags, then the pages that carry the tag itself. Public pages come first, then private ones. Within each group the newest page comes first, undated pages go last, and pages with the same date are sorted A→Z. (Quartz's `created-modified-date` gives a page with no date of its own the time of the build, so a page is undated only on a site that runs no date plugin.) A private page has a lock in place of its bullet, unless `excludePrivate` leaves private pages out. The page being read is highlighted.
- **Private pages left out.** With `excludePrivate` on, a private page is in no tag's count and under no tag, and it is left out of the file the browser loads the pages from, so its title never reaches the reader. The private tags and their subtags leave the tree, and so does any tag that only private pages carry, since it has no pages left. With it off, the default, a private page is counted and listed, last, with a lock.
- **On the 404 page** every link starts from the site's root, since a host serves that page at whatever address was missing, however deep.
- **Opened tags stay open.** The explorer remembers which tags the reader opened when they move to another page, and also after a reload, since it stores them in the browser (see `useSavedState`). It also keeps the tree's scroll position between pages.
- **On a narrow screen**, at or below `drawerBreakpoint`, the explorer is a caret at the window's left edge, half way down, where Quartz 4's mobile menu had its own. The caret opens the tree in a panel that slides in from the left, over the page, and moves the focus to the panel's close button. While the panel is open, the page behind it doesn't scroll. The panel closes from its close button, from a click on the page behind it, with Escape, or when a link in it is followed. The caret, the panel and the veil behind it are all fixed to the window, so the explorer takes no room from the row that the left sidebar becomes on a narrow screen, where the site's title, search and scheme toggle need a phone's full width. The caret sits in the page's side margin, so a site with a narrow margin may want to widen it.

The pages under each tag are not in the page's HTML. The plugin writes them to `static/cgcTagExplorer.json` when the site builds, and fills a tag in from that file when it opens. A site with hundreds of pages would otherwise carry every tag's list of links on every page. The reasoning is in the package's [ADR-0001](https://github.com/chaoticgoodcomputing/blog/blob/main/quartz-v5/plugins/quartz-tag-explorer/docs/adr/0001-the-tree-renders-at-build-time-its-pages-load-from-an-index.md).

## Install

The plugin is the npm package `@chaoticgoodcomputing/quartz-tag-explorer`, built, with its type declarations, and loaded by name, as Quartz's own `@quartz-community/*` plugins are. It needs [quartz-tags](https://blog.chaoticgood.computer/plugins/quartz-tags) and [quartz-styles](https://blog.chaoticgood.computer/plugins/quartz-styles). Install it into your Quartz site:

```sh
npm install @chaoticgoodcomputing/quartz-tag-explorer
```

and list it in `quartz.config.yaml` by its package name:

```yaml
plugins:
  - source: "@chaoticgoodcomputing/quartz-tag-explorer"
    enabled: true
```

Its peers, `@quartz-community/types`, `@quartz-community/utils` and Preact, are your site's own copies, so a page has one Preact. The package isn't on npm yet: it is published after this site moves to Quartz 5 ([#90](https://github.com/chaoticgoodcomputing/blog/issues/90)).

The install also installs [Iconify](https://iconify.design/)'s packages, which draw the icons while the site builds, MDI's icons among them.

## Configure

```yaml
plugins:
  - source: "@chaoticgoodcomputing/quartz-tag-explorer"
    enabled: true
    options:
      privateTags: [private]
      excludePrivate: true
      iconCollections: *iconCollections # the anchor another plugin in the family set
      drawerBreakpoint: 1000
    layout:
      position: left
      priority: 50
```

| Option | Default | |
| --- | --- | --- |
| `title` | "Tag Explorer" | The explorer's heading, which also names its drawer button. |
| `defaultState` | `collapsed` | Whether a tag the reader hasn't opened or closed starts `collapsed` or `open`. |
| `useSavedState` | `true` | Remember the tags a reader opened across reloads, in their browser's localStorage. Off, the explorer still keeps them open from page to page within one visit. |
| `tagSort` | `count-desc` | The order of each level of tags: `count-desc` or `count-asc` by the number of pages under each, or `alphabetical` or `alphabetical-reverse`. Ties go A→Z. |
| `excludeTags` | none | Tags to leave out of the tree, each together with its subtags. Their pages are still listed under their other tags. |
| `privateTags` | none | Tags whose pages are private. A page under one of them, or under one of its subtags, is listed after a tag's public pages, with a lock, or left out with `excludePrivate`. The same rule as the rest of the plugin family's, so give [quartz-seo](https://blog.chaoticgood.computer/plugins/quartz-seo), [quartz-backlinks](https://blog.chaoticgood.computer/plugins/quartz-backlinks) and [quartz-graph](https://blog.chaoticgood.computer/plugins/quartz-graph) the same tags, through a YAML anchor. |
| `excludePrivate` | `false` | Leave private pages out of the explorer altogether: out of every tag's count and listing, and out of the pages the browser loads. The private tags and their subtags leave the tree too, as does any tag only private pages carry. Off, a private page is listed with a lock. |
| `showCount` | `true` | Show the number of pages under each tag. |
| `iconCollections` | none | Your own icons: a prefix for each set, and the directory of SVG files that holds it. With `custom: ./icons`, the icon `custom:d20` is `./icons/d20.svg`. A relative directory resolves against your Quartz folder, as a local plugin's `source:` does. `mdi:` needs no entry. |
| `drawerBreakpoint` | `800` | The viewport width, in pixels, at or below which the explorer becomes a drawer. The default is Quartz's own mobile breakpoint. A site that moves its breakpoints should set this to match. |

This site sets `privateTags` to its `private` tag, through the same YAML anchor as its other plugins' private tags, and turns `excludePrivate` on. So its private notes are left out of the explorer altogether, even one that also carries a public tag, and the `private` tag is not in the tree. Quartz 4 kept only the `private` tag out of the tree, and listed a private note under its public tags with a lock. The site's breakpoint is 1000px.

Other plugins in this family that draw icons take the same `iconCollections` option. Give each of them the same map, for example through a YAML anchor.

## Styling

The CSS is library CSS, following [ADR-0003](https://github.com/chaoticgoodcomputing/blog/blob/main/docs/adr/0003-library-css-in-plugins-application-css-at-the-site.md):

- **Classes:** one BEM block, `.cgc-tag-explorer`.
  - The tree's elements: `__title`, `__panel`, `__tree`, `__tag`, `__row`, `__fold` (whose `::before` is its chevron), `__link`, `__mark`, `__icon`, `__name`, `__count`, `__children` and `__list`.
  - A tag's pages: `__page`, `__page-link`, `__bullet`, `__lock`, `__lock-icon` and `__page-title`.
  - The drawer: `__toggle`, `__backdrop`, `__bar`, `__bar-title` and `__close`.
  - The modifiers: `--open` (the drawer), `--ready` (transitions on), `__children--open` and `__fold--open` (an open tag), `__mark--dot` (a tag with no icon) and `__page-link--active` (the page being read).
- **Cascade layer:** the rules sit in the `cgc.tag-explorer` layer, above Quartz's own styles and themes, and below any unlayered site CSS.
- **Colours:** tag names are the theme's `--secondary`, `--tertiary` on hover. Counts and bullets are `--gray`, pages are `--dark`, and the page being read is `--tertiary`. Guide lines are `--lightgray`. The drawer's panel and the veil over the page behind it are `--light`.
- **The heading** is an `h3` directly inside the block, so a site that sizes its sidebar sections' headings sizes this one too.

To change a tag's colour, change it in `quartz-tags`' dictionary, or override the tag's property, `--cgc-tag-…`, in your own CSS. The mark takes its colour from its own inline `color`, so a rule on the mark alone can't change it.

The build checks the stylesheet with `@chaoticgoodcomputing/css-check`. It fails if a selector reaches outside the block, if the sheet defines a custom property or other name outside the block, if it sets a colour literal or a font family other than one of the theme's four, such as `var(--bodyFont)`, or if it has any media query other than the drawer's.

## Develop

This package is the Nx project `quartz-tag-explorer`, in `quartz-v5/plugins/quartz-tag-explorer/`. Its manifest name is still `cgc-tag-explorer`, which names its CSS, so the class names and properties above keep it. Its specs live in [`e2e/`](https://github.com/chaoticgoodcomputing/blog/tree/main/quartz-v5/plugins/quartz-tag-explorer/e2e) and run against the shared fixture site ([ADR-0004](https://github.com/chaoticgoodcomputing/blog/blob/main/docs/adr/0004-playwright-e2e-as-the-plugin-tdd-loop.md)):

```sh
pnpm nx run quartz-tag-explorer:e2e
pnpm nx run quartz-tag-explorer:typecheck
```
