---
status: accepted
date: 2026-09-25
---

# Icons a widget shows in the browser are drawn ahead, into its source

A Bluesky post shows its counts and its context beside MDI icons, and #36 says those come from
`@chaoticgoodcomputing/icons`, so that the CDN v4 fetched them from goes away. But the post is
drawn in the browser, after a fetch, and the icons library runs only on the server. So the widget
lists the icon ids it needs in `src/<widget>/icons.json`, and `draw-icons.mjs` draws them with the
library into `src/<widget>/icons.ts`, one exported SVG string per name. That module is committed,
and the package's `lint` target fails when it differs from what the library draws. Decided while
building [`bluesky-post`](https://github.com/chaoticgoodcomputing/blog/issues/75).

> v4 links point at this repo at `9e48f89`. This repo's v5 packages are named, not linked: no public
> commit holds them until cutover (root ADR-0004), so a permalink into them would 404.

## Why

**v4 fetched the icons at run time.** The widget asked `IconService` for `mdi:repeat-variant` and
`mdi:reply` as it started
([script.inline.ts:21-24](https://github.com/chaoticgoodcomputing/blog/blob/9e48f89b256f511a94f07d473d46395d91730c53/quartz/widgets/bluesky-post/script.inline.ts#L21-L24)),
and `IconService` fetched each from jsDelivr
([iconService.ts:53](https://github.com/chaoticgoodcomputing/blog/blob/9e48f89b256f511a94f07d473d46395d91730c53/quartz/util/iconService.ts#L53)).
Its counts were emoji
([blueskyService.ts:352-354](https://github.com/chaoticgoodcomputing/blog/blob/9e48f89b256f511a94f07d473d46395d91730c53/quartz/util/blueskyService.ts#L352-L354)),
which each platform draws in its own colours, whatever the scheme.

**The icons library can't reach the browser.** It reads the file system and resolves installed
sets through `createRequire`: its `src/index.ts` imports `node:fs`, `node:path` and `node:module`.
So `cgc-mdx`'s browser build of a widget, the esbuild build with `platform: "browser"` in its
`src/bundle.ts`, can't bundle it. Its own constraint says as much: a script that needs icons in the
browser gets them drawn into an artifact of its own.

**Nor can it run in the widget's build-time render.** `cgc-mdx` renders a widget from a Node bundle
it writes to a temporary directory: the same `src/bundle.ts` builds it with `platform: "node"` into a
directory from `mkdtemp`.
The library would be inlined there with `@iconify/tools`, which fails on load once bundled (the
icons library's ADR-0001), and its installed sets would resolve from the temporary directory, where
there are none. Even if it could draw there, the icons would still have to reach the browser.

**A library has no build to draw them in.** A plugin draws its icons while the site builds and
publishes them in its own artifact. The widget library ships as source that the page's bundler
compiles (ADR-0005), and has no hook of its own. The one place it can carry drawn icons is its
source.

## Decision

- **A widget that shows icons in the browser lists their ids** in `src/<widget>/icons.json`, by
  the name its code imports them as.
- **`npm run icons` draws them** with `@chaoticgoodcomputing/icons` into `src/<widget>/icons.ts`,
  each with the widget block's icon class, `cgc-<widget>__icon`. The library is a
  `workspace:*` devDependency: only the drawing needs it.
- **`npm run lint` checks them** (`draw-icons.mjs --check`), and fails when an `icons.ts` isn't
  exactly what the library draws from its `icons.json`: a hand edit, an id changed without a
  redraw, or an id the library doesn't know.
- **`/bluesky`'s renderer draws with them.** Its counts (`mdi:comment-outline`,
  `mdi:repeat-variant`, `mdi:heart-outline`) replace v4's emoji, and its context lines keep v4's
  `mdi:repeat-variant` and `mdi:reply`. A plugin that shows posts with the renderer gets the icons
  with it, and needs neither the icons library nor Iconify's packages.

## Consequences

- **The icons are exactly the library's.** Painted in `currentColor`, `aria-hidden`, and sized by
  the widget's CSS, so they follow the colour scheme with no script.
- **No fetch, no Iconify at run time.** A page with the widget loads its icons inside the widget's
  chunk. Downstream, installing the package installs nothing of Iconify's.
- **MDI is pinned twice over.** The drawn module fixes each glyph as the pinned `@iconify-json/mdi`
  drew it, and moving MDI means a redraw, which the check demands.
- **A generated file is committed.** It is small and marked as drawn, and the check keeps it
  honest. A site's own icon collection stays the other way round: its SVG files are the source, and
  nothing drawn from them is committed.
- **Only installed sets.** A site's own icon collection is site configuration, and the library can't
  know it, so a widget can only show icons from an installed set such as MDI.

## Considered alternatives

- **Draw at build time and hand the icons to the browser through the page.** The build-time render
  would draw them into the widget's HTML, say in a `<template>`, and the hydrated widget would read
  them back. It needs the library to run in `cgc-mdx`'s Node bundle, which it can't (above), and
  it leans on how Preact treats server markup it didn't render.
- **Import MDI's data into the widget.** `@iconify-json/mdi` is one 3 MB JSON file, and no bundler
  can shake it down to five icons.
- **Keep v4's emoji and fetch nothing.** It leaves the context icons with no source, and colours
  that ignore the scheme.
