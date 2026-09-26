# cgc-tag-list

The Quartz 5 component that lists a page's tags as **tag badges**, each holding its tag's **tag
bubble**: v4's TagList, as a consumer of the `cgc-tags` engine (#69, #71, #82). Inherits the family
vocabulary in [`quartz-v5/CONTEXT.md`](../../CONTEXT.md), where the parts of a tag the site shows
(**Tag slug**, **Tag name**, **Tag icon**, **Tag bubble**, **Tag badge**) are defined, the tag
vocabulary of [`cgc-tags`](../cgc-tags/CONTEXT.md) and [`tags-core`](../../libs/tags-core/CONTEXT.md),
which draws the bubble, and the icon vocabulary of [`icons`](../../libs/icons/CONTEXT.md).

## Language

**Badge**:
One tag in the list, `.cgc-tag-list__item`: a **tag badge** that links to the tag's page, with its
**count** after the name.
_Avoid_: pill, chip (that is cgc-og-image's), tag link

**Count**:
How many pages are under a tag: those carrying it or any of its subtags, each once.
_Avoid_: post count, total

**Subtag list**:
What a tag page lists in place of its own tags: the tag's parent, then its direct subtags, as v4's
tags layout did. `showSubtags` turns it on, `showParentTag` adds the parent.
_Avoid_: child tags, tag children

**Long press**:
How a reader on a narrow screen, where a badge shows only its bubble, expands one to read its name
and count without following the link.
_Avoid_: long click, hold

## Constraints

- **The tag colour paints the bubble's rim and never text.** The bubble's inline `border-color`
  carries it; its circle and icon are the theme's gray and dark
  ([ADR-0001](./docs/adr/0001-the-ring-carries-the-tag-colour.md) and its amendment).
- **The bubble is tags-core's,** the same in every badge the family draws, so this plugin styles
  the badge around it and never the bubble itself.
- **It reads only what the engine publishes:** each page's `fileData.cgcTags`, and for tags a page
  doesn't carry, the `ancestors` of every page.
- **It draws icons itself,** with `@chaoticgoodcomputing/icons`, from the ids the engine publishes and
  the site's `iconCollections`, and hands each to the bubble. Every tag in the corpus is drawn on
  the first page rendered, so an id no collection has fails the build whichever pages show it.
