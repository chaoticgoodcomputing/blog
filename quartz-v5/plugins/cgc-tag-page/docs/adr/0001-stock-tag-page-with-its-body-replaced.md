---
status: accepted
date: 2026-09-25
---

# Stock tag-page, with its body replaced

`cgc-tag-page` is stock tag-page (`@quartz-community/tag-page`) with a different body: the tag's
description article, where stock shows the description and then a list of the tag's pages. The
list moves into the tag layout, as its own plugin (#44, #73). The map chose to inherit stock's
generation and replace only the body
([How do six consumers read one plugin's tag configuration?](https://github.com/chaoticgoodcomputing/blog/issues/20)),
and this records how, decided on
[`cgc-tag-page`: tag pages show their description article](https://github.com/chaoticgoodcomputing/blog/issues/72).

> Source links point at upstream Quartz at
> [`97a2d05`](https://github.com/jackyzha0/quartz/tree/97a2d05f80c4c50534959b1d0d41cc4b3895625e)
> (v5.0.0). Stock tag-page is `@quartz-community/tag-page@1.0.0`, as the vendored copy's lockfile
> installs it.

## The body can't be replaced from the layout

#20 expected to swap the body through the `tag` layout, the one stock tag-page names, and to fall
back to a page type of our own if that didn't work. It doesn't. A page's body comes from its page
type alone
([dispatcher.ts:19-38](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/pageTypes/dispatcher.ts#L19-L38)),
and a `layout.byPageType` entry can only exclude plugins, clear positions and pick a frame
([loader/types.ts:174-179](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/types.ts#L174-L179),
[config-loader.ts:659-693](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/config-loader.ts#L659-L693)).

## Decision

**The plugin is a page type that wraps stock's and replaces it.** It calls stock's factory and keeps
its matcher, its priority, its `tag` layout and its `generate`: which tags get a page, the index of
tags, a description file standing in for the made-up page, and `prefixTags`. It swaps in its own
`body` and its own name, `cgc-tag-page`. A site disables stock tag-page, which stays installed
because this plugin runs its code. Stock is a peer, the host's copy, as for `cgc-og-image`, so a fix
to stock's generation reaches the site without a release here.

**Both enabled fails the build.** Each would generate every tag's page, one over the other, and
stock's would carry the list. The plugin looks for stock's page type by name when it generates, and
throws: a hook's throw fails the build, where a factory's is logged and skipped.

**It counts the pages other page types make.** Stock generates from the Markdown Quartz parsed, so a
tag that only `.mdx` pages carry, which cgc-mdx makes up, got no page, and its badges linked
nowhere. v4 counted them. Quartz empties its list of generated pages before each pass and generates
in priority order
([emit.ts:65-70](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/processors/emit.ts#L65-L70),
[dispatcher.ts:163-202](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/pageTypes/dispatcher.ts#L163-L202)),
so the plugin hands stock's `generate` those pages as well. It sees the page types generated
before it: those that outrank stock's priority, 10, as cgc-mdx's 25 does, and those at 10 that come
earlier in the config.

**It declares no dependency on `cgc-tags`.** The spec lists this plugin among the engine's
consumers, but the description article reads nothing the engine publishes, as v4's TagContent read
nothing of the tag table. A declared dependency would make every site install the engine for a
body that doesn't use it, and a dependency by plugin name needs the vendored loader change until #47
lands. Without one, the plugin runs on a stock copy of Quartz. It declares the engine when the body
first reads one of its artifacts.

## Considered alternatives

- **A page type above stock's priority, with stock left on.** It would take the description files'
  pages, but a generated page is emitted through the page type that generated it and never matched
  again
  ([dispatcher.ts:235-247](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/pageTypes/dispatcher.ts#L235-L247)),
  so every made-up tag page would keep stock's body and its list.
- **A frame, chosen by `layout.byPageType.tag.template`.** A frame receives the body and could draw
  another in its place, but it would be a copy of the default frame
  ([DefaultFrame.tsx](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/components/frames/DefaultFrame.tsx#L12-L63))
  maintained for one element of it.
- **Our own copy of stock's generation.** It drops the peer, and with it every upstream fix to which
  tags get pages.

## Consequences

- A site enables `cgc-tag-page` and disables `@quartz-community/tag-page`.
- Stock's `numPages` and `sort` configure the list this body drops, so the plugin takes only
  `prefixTags`.
- The body's wrapper is Quartz's `popover-hint`, the same element stock renders, so page previews
  show the description, and the no-bleed spec compares it with stock's. The article inside is this
  plugin's, `.cgc-tag-page`. The e2e baseline turns stock tag-page on where this plugin is on, so
  tag pages have a stock page to be compared with.
- A description file has to be at `tags/<t>.md`, as stock requires. The vault's are renamed there
  at cutover (#43), and until then each described tag has a second page at `tags/<t>/index`.
