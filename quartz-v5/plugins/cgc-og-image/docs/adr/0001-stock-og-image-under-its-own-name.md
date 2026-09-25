---
status: accepted
date: 2026-09-25
---

# Stock og-image, run under its own name

`cgc-og-image` is stock og-image (`@quartz-community/og-image`) given a different card. It keeps
nothing of stock's drawing except the card: fonts, satori, sharp, the files and the `og:image`
tags are all stock's. [Which v4 extras survive the port?](https://github.com/chaoticgoodcomputing/blog/issues/42)
chose a wrapper over a fork, and [Where do the ledger's unassigned pieces live?](https://github.com/chaoticgoodcomputing/blog/issues/44)
kept it apart from `cgc-seo`. Four things follow from wrapping, and each was a choice.

> Source links point at upstream Quartz at
> [`97a2d05`](https://github.com/jackyzha0/quartz/tree/97a2d05f80c4c50534959b1d0d41cc4b3895625e)
> (v5.0.0). Stock og-image is `@quartz-community/og-image@1.0.0`, as the vendored copy's lockfile
> installs it.

**Stock is a peer, not a bundle.** Every stock Quartz lists `@quartz-community/og-image` among its
own dependencies, and the loader treats the `@quartz-community/` scope as shared, installed beside a
plugin and never inside it
([gitLoader.ts:806-812](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/gitLoader.ts#L806-L812)).
So the plugin imports the host's copy and inlines only `reading-time`, which stock bundles instead
of exporting. Stock's own defaults, and any fix to them, reach the card without a release here.

**The card is ours in full.** Stock's `imageStructure` can only be set from TypeScript, and its
default card isn't exported, so there is nothing to extend. `card.tsx` is our v4 card on stock's
scheme-aware palette. It differs from stock's in three places: last-segment tag chips, the `icon`
option, and a title without the site's `pageTitleSuffix`. v4's card had no suffix. The site's
config now sets one (#54), and stock adds it to the card.

**The emitter keeps stock's name, `CustomOgImages`.** Core `Head` looks for an emitter by that name
to decide whether to write its own default `og:image` tags
([Head.tsx:34](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/components/Head.tsx#L34),
[:72](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/components/Head.tsx#L72)).
Renamed, every page would carry two sets. The price is that the same name no longer tells the two
plugins apart. With both enabled, both would write every card and every tag, so the plugin counts
emitters by that name and fails the build when there are two.

**The icon is read when the cards are drawn.** Quartz catches a plugin factory that throws, logs it
and builds on without the plugin
([config-loader.ts:466-488](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/config-loader.ts#L466-L488)).
Checked there, a mistyped `icon` path would silently lose every card. An emitter that throws fails
the build
([emit.ts:42-43](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/processors/emit.ts#L42-L43),
[trace.ts:36-41](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/util/trace.ts#L36-L41)).
So the file is read at the start of `emit`, and the build fails naming the path it tried.

## Consequences

- A site enables `cgc-og-image` and disables `@quartz-community/og-image`, which stays installed.
- A `serve` run still refuses stock og-image beside it, but it draws no cards and never reads the
  icon. A broken `icon` shows up on the next build.
- `icon` resolves against the Quartz root, as a local `source:` does. The e2e harness's
  `siteConfig()` rebases it for scratch sites, as it rebases `source:`.
- If upstream Quartz ever makes the site icon configurable (the optional core PR on the map), the
  `icon` option can defer to it.
