---
title: cgc-post-listing
tags:
  - projects/site/plugins
  - engineering/frontend
---

`cgc-post-listing` is a [Quartz 5](https://quartz.jzhao.xyz/) plugin that lists a site's posts, newest first, under the home page and on every tag page. On a tag page it lists only that tag's posts. Each post shows its title, date, description and reading time, and its tags as badges, each with the tag's icon in a bubble, rimmed in the tag's colour. The colours and icons come from [cgc-tags](https://blog.chaoticgood.computer/plugins/cgc-tags), the plugin that holds the site's tag dictionary.

It is the `PostListing` component from this site's Quartz 4 days, carried over as a plugin. The tag colours and icons are now drawn when the site builds, where v4 drew them with a script after the page loaded, fetching every icon from a CDN.

## What it renders

```html
<div class="cgc-post-listing">
  <h3 class="cgc-post-listing__title">Recent Posts</h3>
  <ul class="cgc-post-listing__list">
    <li class="cgc-post-listing__post">
      <h3 class="cgc-post-listing__heading">
        <a class="cgc-post-listing__link" href="./content/notes/a-note">A note</a>
      </h3>
      <p class="cgc-post-listing__description">
        <time class="cgc-post-listing__date" datetime="2024-02-01T00:00:00.000Z">Feb 01, 2024</time>
        — What the note is about. (4 min read)
      </p>
      <ul class="cgc-post-listing__tags">
        <li class="cgc-post-listing__tag" data-tag="engineering/ai">
          <a class="internal cgc-post-listing__tag-link" href="./tags/engineering/ai">
            <span class="cgc-tag-bubble" style="border-color: var(--cgc-tag-engineering--ai)" title="engineering/ai"
              ><svg class="cgc-tag-bubble__icon" viewBox="0 0 24 24" aria-hidden="true" …><path fill="currentColor" d="…" /></svg
            ></span>
            <span class="cgc-post-listing__tag-name">#ai</span>
          </a>
        </li>
      </ul>
    </li>
  </ul>
  <details class="cgc-post-listing__more">
    <summary class="cgc-post-listing__more-toggle">Show 56 more posts</summary>
    <ul class="cgc-post-listing__list">…</ul>
  </details>
</div>
```

- **Order:** newest first, by the date Quartz gives each page (its `defaultDateType`). Posts of the same date are in A→Z order by title, and so are posts with no date, which come last.
- **Which posts:** every page with a source file of its own, `.mdx` pages included, but tag pages and the page of every tag, pages marked unlisted, and pages under an excluded tag (`private`, by default, and its subtags). The pages Quartz makes up, which no file backs, are never posts: a folder page, a tag page, the 404 page.
- **On a tag page:** only the posts under the tag, those under its subtags included. `/tags/engineering` lists `engineering/ai`'s posts too. A tag with nothing to list says "No posts found." A tag page is `tags/<tag>`, or `tags/<tag>/index`, a tag's description file in Quartz 4's layout; `tags` itself, the index of every tag, is none.
- **The description line** holds the date, the page's `description` from its frontmatter, and the reading time. A post with no `description` in its frontmatter shows none of the three, as in Quartz 4.
- **Badges:** each of the post's tags, in its frontmatter order, named by its last segment after a `#`, as one string: `#ai`. Each badge holds the same bubble as [cgc-tag-list](https://blog.chaoticgood.computer/plugins/cgc-tag-list)'s, from the `@chaoticgoodcomputing/tags-core` library: the tag's icon, drawn inline as SVG in the theme's `--dark`, on a circle of the theme's `--lightgray`, in a rim of the tag's colour, through the property `cgc-tags` publishes for it. The tag's colour paints only the rim, never text. Icons work as in cgc-tag-list: a tag with no icon of its own gets its parent's, a tag with none in its lineage has an empty bubble, and an icon id that doesn't exist fails the build. With `showTagCounts`, the number of pages under the tag follows the name. The bubble, the name and the count are centred on one line, as in cgc-tag-list. The badge links to the tag's page, and it is an internal link, so it gets Quartz's page preview on hover. The post's own title link gets none.
- **The toggle:** with `collapsedItemCount` set, the first posts show and the rest sit behind "Show N more posts".
- **On a narrow screen**, 1000px or less, each badge shows only its bubble. Pressing and holding one expands it to show the tag's name, without following the link. A tap follows the link.

### Where it renders

The listing belongs on the pages that list things: the home page, and tag pages. Quartz 5 places a component with the `layout` of its config entry, and a `condition` could keep it to the home page, but Quartz 5 ships only `not-index`, and a plugin can't add an `is-index`. So the component keeps to its pages by itself:

- **on a tag page**, always;
- **on the pages `showOn` names**, by slug: `index` is the home page, and `404` the not-found page;
- **nowhere else**, wherever the layout puts it.

So place it in a slot every page shares, such as `afterBody`. To keep it off tag pages, exclude it there with `layout.byPageType.tag.exclude: [cgc-post-listing]`. The reasoning is in the package's [ADR-0001](https://github.com/chaoticgoodcomputing/blog/blob/main/quartz-v5/plugins/cgc-post-listing/docs/adr/0001-the-listing-keeps-to-its-own-pages.md).

## Install

Plugins in this family ship as source from [the blog's monorepo](https://github.com/chaoticgoodcomputing/blog), and a site pins a release tag. This plugin needs [cgc-tags](https://blog.chaoticgood.computer/plugins/cgc-tags) and [cgc-styles](https://blog.chaoticgood.computer/plugins/cgc-styles):

```sh
npx quartz plugin add git+https://github.com/chaoticgoodcomputing/blog.git#v<x.y.z> --subdir quartz-v5/plugins/cgc-post-listing --name cgc-post-listing
```

The install also installs [Iconify](https://iconify.design/)'s packages, which draw the icons while the site builds, MDI's icons among them.

Keep `--name`: without it, a plugin installed from a subdirectory is named after the repository, and every plugin in the family would install over the last.

> [!WARNING]
> **Depending on `cgc-tags` and `cgc-styles` by name needs a change to Quartz.** Stock Quartz matches a dependency only against the exact `source:` string. Matching by plugin name is a small change to its loader, carried in this repository's copy of Quartz and proposed upstream on [chaoticgoodcomputing/blog#47](https://github.com/chaoticgoodcomputing/blog/issues/47). Until it lands, this plugin builds only against that copy.

## Configure

```yaml
plugins:
  - source: ... # as `quartz plugin add` wrote it
    enabled: true
    options:
      showOn: [index, "404"]
      collapsedItemCount: 5
      iconCollections: *iconCollections # the one you gave cgc-tag-list
    layout:
      position: afterBody
      priority: 10
```

| Option | Default | |
| --- | --- | --- |
| `showOn` | `["index"]` | The pages, besides tag pages, that get the listing, by slug. |
| `title` | `"Recent Posts"` | The heading above the listing. `false` for none. |
| `limit` | all | List at most this many posts. |
| `collapsedItemCount` | all shown | Show this many posts, and the rest behind a toggle. |
| `excludeTags` | `["private"]` | Leave out the posts under any of these tags, their subtags included. Give it the private tags you give [cgc-seo](https://blog.chaoticgood.computer/plugins/cgc-seo) and the rest of the plugin family, and no private page is listed. |
| `filterToCurrentTag` | `true` | On a tag page, list only the posts under the tag. |
| `includeSubtags` | `true` | On a tag page, list the posts under its subtags too. |
| `excludeTagPages` | `true` | Leave out tag pages, such as a tag's description file, and the page of every tag. |
| `showEmptyMessage` | `true` | Say so when there is nothing to list. |
| `emptyMessage` | `"No posts found."` | What to say when there is nothing to list. |
| `showTags` | `true` | Show each post's tag badges. |
| `showDates` | `true` | Show each post's date in its description line. |
| `showDescriptions` | `true` | Show each post's description line. |
| `showTagCounts` | `false` | After each tag, the number of pages under it, its subtags' included. |
| `iconCollections` | none | Your own icons: a prefix for each set, and the directory of SVG files that holds it, as for [cgc-tag-list](https://blog.chaoticgood.computer/plugins/cgc-tag-list). `mdi:` needs no entry. |

One plugin has one set of options for every page. Quartz 4 set them per layout, and only its tags layout turned on the tag filter, so here the tag filter and the subtags are on by default: only a tag page has a tag to filter by.

The dates are the ones Quartz's `created-modified-date` plugin gives each page. The strings are English. Quartz 4's `sort` and `filter` options took functions, which a YAML config can't hold, so they're gone.

## Styling

The CSS is library CSS, following [ADR-0003](https://github.com/chaoticgoodcomputing/blog/blob/main/docs/adr/0003-library-css-in-plugins-application-css-at-the-site.md):

- **Classes:** one BEM block, `.cgc-post-listing`, with the elements `__title`, `__list`, `__post`, `__heading`, `__link`, `__description`, `__date`, `__tags`, `__tag`, `__tag-link`, `__tag-name`, `__tag-count`, `__more`, `__more-toggle` and `__empty`, and the modifier `__tag-link--expanded` for a badge a long press has opened. Selectors are single classes, apart from the narrow-screen rules that hide a badge's name and count. The bubble is its own block, `.cgc-tag-bubble`, with the element `__icon`, from `@chaoticgoodcomputing/tags-core`; this plugin ships its stylesheet and never restyles it.
- **Cascade layer:** the rules, the bubble's included, sit in the `cgc.post-listing` layer, above Quartz's own styles and themes, and below any unlayered site CSS.
- **Colours:** the description line and the count are the theme's `--gray`, the badge's background is `--lightgray` (`--gray` on hover), and the toggle is `--secondary` (`--tertiary` on hover). Each bubble's rim is its tag's colour, its circle `--lightgray` and its icon, 18px square, `--dark`.

To change a tag's colour, change it in `cgc-tags`' dictionary, or override the tag's property, `--cgc-tag-…`, in your own CSS. The bubble takes it as its own inline `border-color`, as [cgc-tag-list](https://blog.chaoticgood.computer/plugins/cgc-tag-list)'s bubbles do.

The build checks the stylesheet with `@chaoticgoodcomputing/css-check` and fails if a selector reaches outside the block, if it defines a custom property or other name outside the block, or if it sets a colour literal or a font family other than one of the theme's four, such as `var(--bodyFont)`.

## Develop

This package is the Nx project `cgc-post-listing`. Its specs live in [`e2e/`](https://github.com/chaoticgoodcomputing/blog/tree/main/quartz-v5/plugins/cgc-post-listing/e2e) and run against the shared fixture site, and against a site built from this site's own config ([ADR-0004](https://github.com/chaoticgoodcomputing/blog/blob/main/docs/adr/0004-playwright-e2e-as-the-plugin-tdd-loop.md)):

```sh
pnpm nx run cgc-post-listing:e2e
pnpm nx run cgc-post-listing:typecheck
```
