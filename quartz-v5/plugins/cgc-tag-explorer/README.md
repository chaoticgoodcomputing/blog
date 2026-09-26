---
title: cgc-tag-explorer
tags:
  - projects/site
  - engineering/frontend
---

`cgc-tag-explorer` is a [Quartz 5](https://quartz.jzhao.xyz/) plugin that lets a reader browse a site by tag. It shows a tree of the site's tags in the left sidebar, each tag with its icon in its colour, and under each tag the pages that carry it. On a narrow screen it becomes a drawer, opened from a caret at the window's left edge. The colours and icons come from [cgc-tags](https://blog.chaoticgood.computer/plugins/cgc-tags), the plugin that holds the site's tag dictionary.

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
- **The name** links to the tag's page. The button before it opens the tag to show its subtags, then the pages that carry the tag itself. Public pages come first, then private ones. Within each group the newest page comes first, undated pages go last, and pages with the same date are sorted A→Z. A private page has a lock in place of its bullet. The page being read is highlighted.
- **On the 404 page** every link starts from the site's root, since a host serves that page at whatever address was missing, however deep.
- **Opened tags stay open.** The explorer remembers which tags the reader opened when they move to another page, and also after a reload, since it stores them in the browser (see `useSavedState`). It also keeps the tree's scroll position between pages.
- **On a narrow screen**, at or below `drawerBreakpoint`, the explorer is a caret at the window's left edge, half way down, where Quartz 4's mobile menu had its own. The caret opens the tree in a panel that slides in from the left, over the page. The panel closes from its close button, from a click on the page behind it, with Escape, or when a link in it is followed. The caret, the panel and the veil behind it are all fixed to the window, so the explorer takes no room from the row that the left sidebar becomes on a narrow screen, where the site's title, search and scheme toggle need a phone's full width. The caret sits in the page's side margin, so a site with a narrow margin may want to widen it.

The pages under each tag are not in the page's HTML. The plugin writes them to `static/cgcTagExplorer.json` when the site builds, and fills a tag in from that file when it opens. A site with hundreds of pages would otherwise carry every tag's list of links on every page. The reasoning is in the package's [ADR-0001](https://github.com/chaoticgoodcomputing/blog/blob/main/quartz-v5/plugins/cgc-tag-explorer/docs/adr/0001-the-tree-renders-at-build-time-its-pages-load-from-an-index.md).

## Install

Plugins in this family ship as source from [the blog's monorepo](https://github.com/chaoticgoodcomputing/blog), and a site pins a release tag. This plugin needs [cgc-tags](https://blog.chaoticgood.computer/plugins/cgc-tags) and [cgc-styles](https://blog.chaoticgood.computer/plugins/cgc-styles):

```sh
npx quartz plugin add git+https://github.com/chaoticgoodcomputing/blog.git#v<x.y.z> --subdir quartz-v5/plugins/cgc-tag-explorer --name cgc-tag-explorer
```

Keep `--name`. Without it, a plugin installed from a subdirectory is named after the repository, and each plugin in the family would install over the last one.

The install also installs [Iconify](https://iconify.design/)'s packages, which draw the icons while the site builds. MDI's icons are among them.

> [!WARNING]
> **Depending on `cgc-tags` and `cgc-styles` by name needs a change to Quartz.** Stock Quartz matches a dependency only against the exact `source:` string. Matching by plugin name is a small change to its loader. It is carried in this repository's copy of Quartz and proposed upstream on [chaoticgoodcomputing/blog#47](https://github.com/chaoticgoodcomputing/blog/issues/47). Until it lands, this plugin builds only against that copy.

## Configure

```yaml
plugins:
  - source: ... # as `quartz plugin add` wrote it
    enabled: true
    options:
      excludeTags: [private]
      privateTags: [private]
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
| `privateTags` | none | Tags whose pages are private. A page under one of them, or under one of its subtags, is listed after a tag's public pages, with a lock. The same rule as the rest of the plugin family's, so give [cgc-seo](https://blog.chaoticgood.computer/plugins/cgc-seo), [cgc-backlinks](https://blog.chaoticgood.computer/plugins/cgc-backlinks) and [cgc-graph](https://blog.chaoticgood.computer/plugins/cgc-graph) the same tags, through a YAML anchor. |
| `showCount` | `true` | Show the number of pages under each tag. |
| `iconCollections` | none | Your own icons: a prefix for each set, and the directory of SVG files that holds it. With `custom: ./icons`, the icon `custom:d20` is `./icons/d20.svg`. A relative directory resolves against your Quartz folder, as a local plugin's `source:` does. `mdi:` needs no entry. |
| `drawerBreakpoint` | `800` | The viewport width, in pixels, at or below which the explorer becomes a drawer. The default is Quartz's own mobile breakpoint. A site that moves its breakpoints should set this to match. |

This site sets `excludeTags` and `privateTags` to its `private` tag, as Quartz 4 did, and `privateTags` through the same YAML anchor as its other plugins' private tags. So the private notes stay out of the tree, but a private note that also carries a public tag is listed under that tag, with a lock. The site's breakpoint is 1000px.

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

To change a tag's colour, change it in `cgc-tags`' dictionary, or override the tag's property, `--cgc-tag-…`, in your own CSS. The mark takes its colour from its own inline `color`, so a rule on the mark alone can't change it.

The build checks the stylesheet with `@chaoticgoodcomputing/css-check`. It fails if a selector reaches outside the block, if the sheet defines a custom property or other name outside the block, if it sets a colour literal or a font family other than one of the theme's four, such as `var(--bodyFont)`, or if it has any media query other than the drawer's.

## Develop

This package is the Nx project `cgc-tag-explorer`. Its specs live in [`e2e/`](https://github.com/chaoticgoodcomputing/blog/tree/main/quartz-v5/plugins/cgc-tag-explorer/e2e) and run against the shared fixture site ([ADR-0004](https://github.com/chaoticgoodcomputing/blog/blob/main/docs/adr/0004-playwright-e2e-as-the-plugin-tdd-loop.md)):

```sh
pnpm nx run cgc-tag-explorer:e2e
pnpm nx run cgc-tag-explorer:typecheck
```
