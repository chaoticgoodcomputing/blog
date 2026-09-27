---
status: accepted
date: 2026-09-26
---

# The page header joins the annotations: the body takes it, and the frame hands it over

An annotation page's header (its title, its date and reading time, its tags: the layout's
before-body components) sits at the top of the annotations panel, beside the Viewer, and not above
the page. That is the owner's call in the review of 2026-09-26: "for now, header should be moved into
the right-hand Annotations section (title, tags, etc.)"
([#87](https://github.com/chaoticgoodcomputing/blog/issues/87)). Where the document comes from
(`Source document: <host>`, and the narrow screen's read-along line) moves with it, to the panel's
top, under the header.

The body takes the header, and the frame hands it over:

- **The body** renders whatever it is given as `children` at the top of its annotations panel, in
  `.cgc-annotator__header`, and says so with a static `takesPageHeader = true` on its component.
- **A frame** that sees `takesPageHeader` on the page body draws the before-body components as the
  body's children, `h(pageBody, componentData, <before-body components>)`, and leaves them out of its
  own page header. site-components' `site-full-width`, the real site's frame for annotation pages, does
  this (its ADR-0002, amended).
- **Any other frame** draws the header above the page, as before. Core's `full-width`, which the page
  type still declares, is one: a site without a cooperating frame gets the header above the page.
  Quartz hands every body `children: []`
  ([dispatcher.ts:94-102](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/pageTypes/dispatcher.ts#L94-L102)),
  so the body then has nothing to place.

No vendored change, and the page type's `frame: "full-width"` (#68) stands.

> Links to Quartz point at upstream at
> [`97a2d05`](https://github.com/jackyzha0/quartz/tree/97a2d05f80c4c50534959b1d0d41cc4b3895625e),
> the ref `quartz/upstream.json` pins.

## Why

**Only a frame knows the header, and only the body knows the panel.** The layout's before-body
components reach the frame
([types.ts:8-27](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/components/frames/types.ts#L8-L27)),
never the page body: the dispatcher takes the body from the page type and the header from the layout
separately
([dispatcher.ts:19-37](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/pageTypes/dispatcher.ts#L19-L37)).
The annotations panel is the body's own markup. So one hands the header to the other, and Preact's
`children` is the one prop a component takes from outside without a new contract on the page data.

**The flag keeps the frame safe for other bodies.** A body that ignored `children` would lose its
header, so a frame hands it over only to a body that asks. The flag is a static on the component, the
place Quartz components already carry `css`, `beforeDOMLoaded` and `afterDOMLoaded`.

**Not a frame of this plugin's own.** The review's first idea was a frame registered from this
plugin's manifest (`frames`), placing the header in the panel by itself. A processing plugin can
register frames
([config-loader.ts:455-460](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/config-loader.ts#L455-L460)),
but a frame's page grid is styled by its name: core lays out `#quartz-body` for `full-width` under
`.page[data-frame="full-width"]`
([base.scss:317-333](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/styles/base.scss#L317-L333)),
and a frame of another name falls into the three-column grid with nothing in its sidebars. Styling
`#quartz-body` is page layout, which [the repo's ADR-0003](../../../../../docs/adr/0003-library-css-in-plugins-application-css-at-the-site.md) keeps out of library CSS (every selector here starts at
an element this plugin renders), so every site would have to lay the frame out itself. And the real
site already has its full-width frame, site-components' `site-full-width`, with its page title bar
and its graph and backlinks after the body: a second frame would repeat that. The hand-over needs a
few lines in the frame the site already uses.

**Not moved in the browser.** A script moving the header into the panel after load would shift the
page as it loads, leave a reader without JavaScript the old layout, and have to run again after each
SPA navigation.

## Consequences

- The header is inside the panel's `popover-hint`, so a popover of an annotation page shows it, then
  the annotations, as before. It carries no `popover-hint` of its own: a popover shows every hint it
  finds
  ([popover.inline.ts:104](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/components/scripts/popover.inline.ts#L104)),
  so a nested one would show twice.
- The header scrolls with the annotations, in the panel. On a narrow screen, where the Viewer is left
  out, it heads the annotations, which take the page.
- The header's components keep the site's styles. This plugin's stylesheet only spaces the header
  from the annotations and takes the first component's top margin off.
- A site whose frame doesn't hand the header over keeps it above the page, with the source line at
  the top of the panel.
