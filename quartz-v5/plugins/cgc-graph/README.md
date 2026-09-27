---
title: cgc-graph
tags:
  - projects/site/plugins
  - engineering/frontend
---

`cgc-graph` is a [Quartz 5](https://quartz.jzhao.xyz/) plugin that draws the graph view: the pages around the current one, and, behind a button, every page of the site, with a filter for how recently each changed. Each page and tag is drawn as its tag's bubble, the one the site's tag badges use: rimmed in the tag's colour, with the tag's icon. It draws from an index it publishes itself, which carries each page's date.

It is the graph from this site's Quartz 4 days, carried over as a plugin. Quartz's own graph plugin reads only Quartz's content index, which has no dates, so the filter needs this one. Its tags, with their colours and icons, come from [cgc-tags](https://blog.chaoticgood.computer/plugins/cgc-tags), the plugin that holds the site's tag dictionary.

## What it renders

A heading, and a box holding the **local graph**: the current page, every page it links to or that links to it, and its tags, drawn on a canvas with the edges between them. A tag is a node of its own, with each page carrying it hanging from it, and each tag hanging from its parent. On a tag's page, the graph is drawn around the tag.

- **Hover** a node to see its label, light up its neighbours and fade the rest. Hovering a tag lights up its whole subtree of subtags.
- **Click** a node to go to its page. Quartz's router follows it, as it follows a link, with no page reload.
- **Drag** a node to pull the layout around, drag the background to pan, and scroll to zoom.
- **Each node is its tag's bubble**, the same bubble as a tag badge's elsewhere on the site: a page is its primary tag's, a tag its own. The tag's colour, as `cgc-tags` resolves it, paints only the rim. The circle is the theme's `lightgray`, and the icon the theme's `dark`, black in the light scheme and white in the dark. A tag with no colour of its own takes its nearest ancestor's.
- **Each bubble carries its tag's icon**, its own or its nearest ancestor's. The icons are drawn when the site builds, so the page fetches none.
- **Notes you've visited** have their bubble's rim in the theme's `tertiary` instead of their tag's colour, the way a visited link differs from an unvisited one. A tag's node always keeps its tag's colour. **The current page** keeps its tag's colour too, and swells and shrinks.
- **A page with no tags** has no bubble. It is a plain disc in the theme's colours, as in Quartz 4: `secondary` for the current page, `tertiary` for pages you've visited, and `gray` for the rest.
- **The current page** swells and shrinks gently.
- **Private pages**, those carrying one of the `privateTags` or a tag under one, are drawn like any other page, rimmed in their own colour when `nodeColors.private` sets one.

The **View Global Graph** button, or Ctrl+G (⌘+G on a Mac), opens the **global graph** in a dialog: every page and tag of the site, with two filters.

- **The time slider** shows every page, those changed in the last year, or those changed in the last month.
- **Include private notes** shows or hides the private pages.

Escape, a click outside the graph, or Ctrl+G again closes it.

The graph follows the colour scheme. Switching between light and dark repaints it where it stands, every bubble's rim, circle and icon included.

### The text alternative

A canvas is a picture, so inside each one the plugin writes a list of what it draws: one item per node, linking to its page, with the nodes it has an edge to. The browser never shows it, and screen readers read it in the picture's place. The links are out of the tab order, since nothing shows where they are.

```html
<canvas class="cgc-graph__canvas" aria-label="Graph of the pages around A note">
  <ul class="cgc-graph__nodes">
    <li class="cgc-graph__node" data-node="notes/a-note">
      <a class="cgc-graph__node-link" href="/notes/a-note" tabindex="-1" aria-current="page">A note</a>
      <ul class="cgc-graph__edges" aria-label="A note links to">
        <li class="cgc-graph__edge" data-node="tags/engineering/ai">#ai</li>
      </ul>
    </li>
  </ul>
</canvas>
```

A private page's item ends with `(private)`. While the pointer is over a node, its item is marked `data-hovered`.

## The index

The plugin writes `static/cgcGraph.json`: every page of the site keyed by its slug, and every icon its tags are drawn with, keyed by icon id:

```json
{
  "pages": {
    "notes/a-note": {
      "title": "A note",
      "links": ["notes/b-note"],
      "tags": ["engineering/ai"],
      "primary": "engineering/ai",
      "date": "2026-09-01T00:00:00.000Z"
    }
  },
  "icons": {
    "mdi:robot": "<svg xmlns=\"http://www.w3.org/2000/svg\" …>…</svg>"
  }
}
```

- **Pages** are every page with a file behind it, Markdown or anything a page type renders from a file, such as `.mdx`. The tag pages and folder pages Quartz generates aren't in it, and neither are unlisted pages.
- **`links`** are the pages it links to, as Quartz resolves them. The site's index is `/`.
- **`tags`** are its tags as `cgc-tags` publishes them, and **`primary`** is the one that stands for it, which paints its node. A page with no tags has no `primary`.
- **`date`** is the date Quartz shows for the page, by the site's `defaultDateType`, as an ISO 8601 string.
- **`icons`** holds every icon a tag of the site carries, drawn when the site built, every mark in `currentColor`.

The graph also reads `cgc-tags`' own index, `static/cgcTags.json`, for each tag's colour and icon.

The graph draws a tag's description page, at `tags/<tag>` or `tags/<tag>/index`, as the tag's own node.

## Install

Plugins in this family ship as source from [the blog's monorepo](https://github.com/chaoticgoodcomputing/blog), and a site pins a release tag. This plugin needs [cgc-tags](https://blog.chaoticgood.computer/plugins/cgc-tags) and [cgc-styles](https://blog.chaoticgood.computer/plugins/cgc-styles):

```sh
npx quartz plugin add git+https://github.com/chaoticgoodcomputing/blog.git#v<x.y.z> --subdir quartz-v5/plugins/cgc-graph --name cgc-graph
```

Keep `--name`: without it, a plugin installed from a subdirectory is named after the repository, and every plugin in the family would install over the last. Disable Quartz's own `@quartz-community/graph`, which this plugin replaces.

> [!WARNING]
> **Depending on `cgc-tags` and `cgc-styles` by name needs a change to Quartz.** Stock Quartz matches a dependency only against the exact `source:` string. Matching by plugin name is a small change to its loader, carried in this repository's copy of Quartz and proposed upstream on [chaoticgoodcomputing/blog#47](https://github.com/chaoticgoodcomputing/blog/issues/47). Until it lands, this plugin builds only against that copy.

## Configure

```yaml
plugins:
  - source: ... # as `quartz plugin add` wrote it
    enabled: true
    options:
      privateTags: [private]
      iconCollections: { custom: ../icons }
      localGraph:
        baseSize: { tags: 10, posts: 10 }
      globalGraph:
        graphStyle: pseudo-shell
        pseudoShellConfig:
          pinnedTags: [engineering, writing]
    layout:
      position: right
      priority: 10
```

The graph takes one layout slot, the same on every page. This site's Quartz 4 layout had it in the body of the home page and the tag pages; a plugin entry can't be placed twice, so it stays where `layout` puts it.

| Option | Default | |
| --- | --- | --- |
| `privateTags` | none | The tags that make a page private: a page carrying one, or a tag under one. `privateer` isn't under `private`. The same rule as the rest of the plugin family's, so give [cgc-seo](https://blog.chaoticgood.computer/plugins/cgc-seo), [cgc-backlinks](https://blog.chaoticgood.computer/plugins/cgc-backlinks) and [cgc-tag-explorer](https://blog.chaoticgood.computer/plugins/cgc-tag-explorer) the same tags, through a YAML anchor. |
| `title` | `Graph View` | The heading above the local graph. |
| `localGraph` | see below | The local graph's settings. |
| `globalGraph` | see below | The global graph's settings. |
| `iconCollections` | none | Your own icon collections, for the icons your tags name: each prefix and the folder of SVG files that holds it, such as `{ custom: ../icons }`. A relative folder is resolved from Quartz's root. MDI's icons, `mdi:…`, need no entry. |

Each graph's settings are merged over its defaults a key at a time. A map by kind, such as `linkDistance`, is merged a kind at a time, so a kind it leaves out keeps its default. A number, or `edgeOpacity`'s single `{ min, max }` range, sets every kind at once.

| Setting | Local | Global | |
| --- | --- | --- | --- |
| `depth` | `1` | `-1` | How many edges from the current page to draw. `-1` draws every page. |
| `drag`, `zoom` | `true` | `true` | Whether nodes can be dragged, and the view panned and zoomed. |
| `scale` | `1.1` | `0.9` | Labels are drawn at `1 / scale`. |
| `repelForce`, `centerForce` | `0.5`, `0.3` | `0.5`, `0.2` | How hard nodes push apart, and how hard they're pulled to the middle. |
| `linkDistance` | `{ tagTag: 20, tagPost: 30, postPost: 50 }` | same | The length of each kind of edge: tag to subtag, tag to page, page to page. A number sets all three. |
| `linkStrength` | `{ tagTag: 2, tagPost: 1, postPost: 1 }` | same | How hard each kind of edge pulls. |
| `edgeOpacity` | `{ tagTag: { min: 0.3, max: 1 }, … }` | same | Each kind of edge's opacity at twice its length (`min`) and at half of it (`max`). |
| `baseSize`, `sizeScaling` | `{ tags: 4, posts: 2 }`, `{ tags: 2, posts: 1 }` | same | A node's radius: its base size, plus its scaling times the square root of its edges, or for a tag, of the pages under it. |
| `fontSize`, `opacityScale` | `0.6`, `1` | same | The labels' size, and how visible they are before you hover. |
| `showTags` | `true` | `true` | Whether to draw tags. |
| `removeTags` | `[]` | `[]` | Tags to leave out, each with its subtags. |
| `focusOnHover` | `false` | `true` | Whether hovering fades the nodes away from the hovered one. |
| `enableRadial` | `false` | `true` | Whether a ring-shaped force holds the freeform layout together. |
| `graphStyle` | `freeform` | `freeform` | `pseudo-shell` pins `pseudoShellConfig.pinnedTags` to a ring, and zooms to fit it. |
| `pseudoShellConfig` | | | The ring's `radiusBase`, `radiusScale`, `pinnedTags`, `showShell`, `zoomMargin`, `circumferentialRepulsion` and `shellStyle` (`color`, `opacity`, `lineStyle`, `lineWidth`). |
| `nodeColors` | none | none | `public` and `private`: a colour for every public page, or every private page, in place of the graph's own. It rims a page's bubble in place of its tag's colour, and fills a page with no tags. |
| `linkStyle` | `{ tagTag: solid, tagPost: solid, postPost: dotted }` | same | Each kind of edge, `solid` or `dotted`. |
| `privatePostSizeMultiplier` | `1` | `1` | A private page's size, as a share of a public page's. |
| `defaultFilterState` | | `{ timePeriod: all, includePrivate: true }` | The global graph's filters as it opens. `adaptiveTimePeriod: { minPosts: 3 }` starts on the narrowest period that holds at least that many pages. |
| `expandSelectedSize`, `expandSelectedOscillationTime` | `1.3`, `2` | same | How far the current page's node swells, and how many seconds one swell takes. |

A **colour** is anything CSS accepts as a colour: a hex, a named colour, a theme's `var(--secondary)` or a `light-dark()` pair.

The build fails on a mistake in the options:

- a colour CSS can't read;
- an option or a setting the plugin doesn't have, at any depth, such as `localGraph.labelAnchor`, which Quartz 4's graph took and never used;
- a word a setting doesn't take, such as a `graphStyle` other than `freeform` or `pseudo-shell`;
- an icon one of your tags names that no collection has, such as a misspelt `mdi:` name, or a `custom:` icon with no `iconCollections` entry for `custom`.

## Styling

The CSS is library CSS, following [ADR-0003](https://github.com/chaoticgoodcomputing/blog/blob/main/docs/adr/0003-library-css-in-plugins-application-css-at-the-site.md):

- **Classes:** one BEM block, `.cgc-graph`, with the elements `__title`, `__outer`, `__local`, `__open`, `__dialog`, `__global`, `__canvas` and, in the global graph, `__filters`, `__time`, `__time-labels`, `__time-label`, `__slider`, `__visibility`, `__private-toggle` and `__private-label`. The text alternative's `__nodes`, `__node`, `__node-link`, `__node-private`, `__edges` and `__edge` are never shown.
- **Cascade layer:** the rules sit in the `cgc.graph` layer, above Quartz's own styles and themes, and below any unlayered site CSS.
- **Size:** the box is square, as wide as the block. Where the layout caps the block's height, as Quartz does to each right-sidebar component below its desktop width, the box gives up height to fit, and the graph is drawn to the box's size.
- **Colours and fonts:** all the theme's. The box's border is `--lightgray`, the dialog's background `--light`, and the button and filters use `--codeFont`. The private toggle takes `nodeColors.private`, through the block's `--cgc-graph-private` property, or `--secondary` without one.

The canvas can't use CSS, so the plugin resolves each colour in script, the theme's, the options' and each tag's alike, and resolves them again when the colour scheme changes. A tag's colour is its `--cgc-tag-…` property from `cgc-tags`, so a site that restyles a tag's colour restyles its nodes' rims too. A bubble's circle and icon are the theme's `--lightgray` and `--dark`, the palette `@chaoticgoodcomputing/tags-core` publishes for every tag bubble, so the graph's bubbles and the badges' can't drift apart.

The build checks the stylesheet with `@chaoticgoodcomputing/css-check` and fails if a selector reaches outside the block, if it defines a custom property or other name outside the block, or if it sets a colour literal or a font family other than one of the theme's four, such as `var(--bodyFont)`.

## Develop

This package is the Nx project `cgc-graph`. Its specs live in [`e2e/`](https://github.com/chaoticgoodcomputing/blog/tree/main/quartz-v5/plugins/cgc-graph/e2e) and run against the shared fixture site ([ADR-0004](https://github.com/chaoticgoodcomputing/blog/blob/main/docs/adr/0004-playwright-e2e-as-the-plugin-tdd-loop.md)):

```sh
pnpm nx run cgc-graph:e2e
pnpm nx run cgc-graph:typecheck
```

The browser script, in [`src/runtime/`](https://github.com/chaoticgoodcomputing/blog/tree/main/quartz-v5/plugins/cgc-graph/src/runtime), is bundled with d3 and tween.js into one script when the plugin builds, so a page fetches nothing but the two indexes.
