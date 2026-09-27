---
status: accepted
date: 2026-09-26
---

# A full-width frame that keeps the sidebars' components

[#37](https://github.com/chaoticgoodcomputing/blog/issues/37) gave annotation pages the full-width
frame, so the Viewer has the page's width, and said the site config would compose the rest: the
graph, the subscribe box and the backlinks. Core's `full-width` frame can't hold them. So this
plugin registers a frame of its own, `site-full-width`, and the site config names it as the
annotation page type's `template`:

```yaml
layout:
  byPageType:
    annotation:
      template: site-full-width
```

> Source links point at upstream Quartz at
> [`97a2d05`](https://github.com/jackyzha0/quartz/tree/97a2d05f80c4c50534959b1d0d41cc4b3895625e)
> (v5.0.0), the ref `quartz-v5/upstream.json` pins.

## Why

**Core's `full-width` frame drops `left` and `right`.** It renders the header, the before-body
components, the body, the after-body components and the footer, and nothing else
([FullWidthFrame.tsx:16-50](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/components/frames/FullWidthFrame.tsx#L16-L50)).
The site places its page title, search and scheme toggle `left`, and the graph and backlinks
`right`, so an annotation page lost all of them, v4's page title, graph and backlinks among them.

**The site config can't move a component to another slot for one page type.** `byPageType` can
exclude a plugin or empty a slot
([config-loader.ts:672-685](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/config-loader.ts#L672-L685)),
and it can name a frame
([:687-690](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/config-loader.ts#L687-L690)).
A frame decides where each slot goes, so a frame is the one place the slots can be rearranged.

**A component-only plugin can register frames.** The loader loads the frames a component-only
plugin's manifest declares
([config-loader.ts:376](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/config-loader.ts#L376)),
registers each under its own `name`
([frameLoader.ts:40](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/frameLoader.ts#L40)),
and looks a registered frame up before core's
([frames/index.ts:36-40](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/components/frames/index.ts#L36-L40)).
This plugin is the site's component-only plugin, and the frame is layout, which is what #44 gave it.
No vendored change is needed.

## The frame

- The body has the page's width, less a gutter: v4's full-width variant, with its reduced gutter
  beside an annotation viewer.
- The `left` components are a bar across the top of the page header: the page title, then the
  toolbar.
- The `right` components come after the body, then the after-body ones: the graph and the backlinks,
  then the subscribe box. v4's annotation layout had the graph, the subscribe box and the backlinks
  after the viewer.
- The page header's and footer's blocks keep to the measure. The body doesn't.
- The site config excludes what v4's annotation pages didn't have: the tag explorer, the table of
  contents and the social cards.

It carries no CSS: the site styles it, in site-styles' objects tier, as it does the default frame.

## Consequences

- **Every build warns once per placement after the first, per thread.** Each of this plugin's
  placements (ADR-0001) loads the manifest's frames, and the frame registry warns when a frame is
  registered again from another source
  ([registry.ts:11-18](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/components/frames/registry.ts#L11-L18)),
  even when it is the same frame: `Page frame "site-full-width" from site-footer is overwriting
  frame from site-page-title`. It is harmless, since both placements load the one module. A frame in
  a site plugin of its own, placed once, would not warn, at the cost of a third site plugin that #44
  did not name.
- The cgc-annotator page type still declares core's `full-width`, which a site without this plugin
  gets.

## Considered alternatives

- **`template: default`**, with the annotation page back in the three-column frame. It brings every
  sidebar back, but narrows the Viewer to the centre column, which #37 rejected.
- **The default frame, restyled for annotation pages** in the site's CSS: the sidebars stacked
  above and below a full-width centre. It needs no frame, but it has to undo the default frame's
  sticky, full-height sidebars and its measure at every breakpoint, keyed on the body's markup.
- **A vendored change** letting `byPageType` move a component. Rejected: a plugin can register a
  frame, so there is no case for another vendored change
  ([the repo's ADR-0001](../../../../../docs/adr/0001-customization-through-plugins.md)).

## Amendment: the page header goes to a body that takes it

_2026-09-26, from the owner's review of the v5 site ([#87](https://github.com/chaoticgoodcomputing/blog/issues/87))._

The owner asked for an annotation page's header, its title, meta and tags, to move "into the
right-hand Annotations section". The frame above drew the before-body components in the page
header, over the whole width. Now, when the page body carries `takesPageHeader = true`, as
cgc-annotator's does, the frame hands the before-body components to the body as its children and
leaves them out of the page header, which keeps the bar of `left` components. The body places them:
cgc-annotator puts them at the top of its annotations panel (its
[ADR-0003](../../../../plugins/quartz-annotator/docs/adr/0003-the-page-header-joins-the-annotations.md)).
Any other body still gets them in the page header, so the frame stays safe for other page types.

This supersedes "The page header's and footer's blocks keep to the measure" for the before-body
blocks of an annotation page, which are now in the panel. site-styles' measure rule for the page
header's `.popover-hint` finds nothing there, and is left for any other body.
