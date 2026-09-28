---
status: accepted
date: 2026-09-28
---

# The annotation page owns its frame

An annotation page is laid out by a frame this plugin ships, `cgc-annotation`, registered from the
manifest's `quartz.frames` the way canvas-page registers its `CanvasFrame`
([`package.json:115-119`](https://github.com/quartz-community/canvas-page/blob/8699230b7728cdd0a0ae3603c7ba18f48d3d55a4/package.json#L115-L119),
[`src/pageType.ts:82-83`](https://github.com/quartz-community/canvas-page/blob/8699230b7728cdd0a0ae3603c7ba18f48d3d55a4/src/pageType.ts#L82-L83)).
The page type declares `frame: "cgc-annotation"`. This supersedes
[ADR-0003](./0003-the-page-header-joins-the-annotations.md) (the page header joins the annotations),
and site-components' `site-full-width` frame (its ADR-0002, amendment and all), which only the
annotation layout ever named.

> Links to Quartz point at upstream at
> [`97a2d05`](https://github.com/jackyzha0/quartz/tree/97a2d05f80c4c50534959b1d0d41cc4b3895625e),
> the ref `quartz/upstream.json` pins, and to canvas-page at
> [`8699230`](https://github.com/quartz-community/canvas-page/tree/8699230b7728cdd0a0ae3603c7ba18f48d3d55a4).

## Why a frame

The page is reworked so that it reads at every width, the way a document editor does on a phone:
the document is the page, and everything else is arranged around it by width alone. That is an app
shell, and it has parts no stock frame or body can hold:

- **One page scroll**, with no inner scroll boxes: the document, and the annotations beside it,
  scroll with the page.
- **A bar**, at the top of the screen at every width: ☰, the site's name (the page's title once the
  top section's title has scrolled away), zoom, and the annotations' toggle with their count.
- **Two drawers**: the ☰ drawer from the left, holding `header` then `left`, and the annotations
  from the right, where the margin doesn't fit.
- **A top and a bottom section**, at the text's width, around the document.

A frame is the only thing that sees every layout slot
([types.ts:8-27](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/components/frames/types.ts#L8-L27)).
ADR-0003 got the page header to the annotations by having a cooperating frame hand it to the body.
With every slot moving, that hand-over would grow a flag for each.

## The slot mapping

The plugin is published, so the frame places the slots generically, and a site reorders or drops
components with `layout.byPageType.annotation` as usual:

| Slot | Goes to |
| --- | --- |
| `header`, then `left` | The ☰ drawer |
| `beforeBody` | The top section, before where the source document comes from and the preface |
| the page body | The Viewer and the annotations, between the top and bottom sections |
| `right`, then `afterBody` | The bottom section, after the epilogue |
| `footer` | Last |

This site excludes `quartz-social` and the sidebar subscribe box there, as the bottom section has the
subscribe box already.

## The contract between the frame and the body

The frame renders what surrounds the document, and the body renders the document and the cards.
What the frame needs of the page comes from the page's data, not from the body:

- **The preface and epilogue** are cut from the page's rendered tree, `componentData.tree`, at the
  mark the transformer leaves between them ([ADR-0005](./0005-preface-and-epilogue-the-interim-format.md)).
- **Where the source document comes from** is the page's `annotation-target`.
- **The widths** (`marginWidth`, `minDocumentWidth`, `textWidth`) are the plugin's options, which
  the transformer puts on the page's `cgcAnnotator` data, and the frame sets as `--cgc-annotator-*`
  custom properties. The frame is a separate module that Quartz's loader imports from the package's
  `./frames`, and never sees the plugin's options itself. The transformer checks them, so a site
  hears of a bad one once.

So no static on the body is needed: `takesPageHeader` goes, and the body takes no children. A site
that names another frame for annotation pages gets the body alone: the Viewer and the cards, without
the preface, the epilogue or the source line.

## Why here, and not in site-components

ADR-0003 kept the frame out of this plugin because a frame's page grid is styled by its name, and
styling `#quartz-body` looked like page layout, which the repo's ADR-0003 keeps out of library CSS.
The repo's ADR-0003 is now amended for packages that ship a frame: such a package owns the markup
its frame renders, and may reach `.page[data-frame="<name>"]` and its `#quartz-body` to undo core's
grid, and nothing else. The frame's CSS goes in the family layer, `cgc.annotator`, from
`externalResources()` like the rest of the package; core's frame stylesheet, which it puts on the
page unlayered, stays empty. build.mjs's check allows those two selectors and holds everything else
to the package's blocks.

In site-components the frame would be this site's alone, and the plugin is published.

## No media queries decide the layout

Core's widths are compile-time SCSS only (`$pageWidth: 800px`, breakpoints 800 and 1200px, in
`quartz/styles/variables.scss`), and neither core nor site-styles defines a width custom property, so
there is nothing for a plugin to read. The page as rendered, and as a reader without JavaScript or a
page whose mirror is missing keeps it, is the **static layout**: the annotations are the page, in one
column, at every width, and needs no breakpoint. Whether the document then takes a margin or a drawer
is decided in script, from the measured width and the zoom. That keeps the repo's ADR-0003 rule 8.

## The numbers, to tune live

The structure is settled; these are starting values, in `src/widths.ts` and `src/viewer/layout.ts`:

- the options' defaults: `marginWidth` 20rem, `minDocumentWidth` 36rem, `textWidth` 800px;
- the gutters beside the margin: 2rem each side of the page and 3rem between the document and the
  margin, so at the defaults the drawer takes over below about 1008px at 100% zoom;
- the document's cap beside the margin, 60rem, not an option;
- a phone's drawer: when a `marginWidth` drawer would cover more than half the screen, it's 85% of it;
- a shortened card: two lines of its passage, about four of its note;
- zoom from 50% to 300%, in the bar's steps, or anywhere between by pinch.

## Consequences

- `site-full-width`, its registration and site-styles' rules for it are deleted, as are
  `takesPageHeader`, the split, the divider and the rule that hid the Viewer on narrow screens.
- The Viewer's island hydrates on load, not once visible: it is out of sight in the static layout,
  and it is what switches the page to the document's layout.
- A popover of an annotation page shows the top section and the cards, which carry `popover-hint`,
  and never the Viewer.
- The frame wraps its main content in core's `center`, which stock scripts look for.
- Components with fixed-position UI of their own (the tag explorer's drawer toggle, say) keep it when
  placed in the ☰ drawer; the site excludes what it doesn't want there.
