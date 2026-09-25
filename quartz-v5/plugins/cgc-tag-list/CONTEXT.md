# cgc-tag-list

The Quartz 5 component that lists a page's tags as badges, each ringed in its tag's colour: v4's
TagList, as a consumer of the `cgc-tags` engine (#69). Inherits the family vocabulary in
[`quartz-v5/CONTEXT.md`](../../CONTEXT.md), and the tag vocabulary of
[`cgc-tags`](../cgc-tags/CONTEXT.md) and [`tags-core`](../../libs/tags-core/CONTEXT.md).

## Language

**Badge**:
One tag in the list: a link to the tag's page holding a **ring**, the tag's name and, optionally,
its **count**. The whole item, `.cgc-tag-list__item`.
_Avoid_: pill, chip (that is cgc-og-image's), tag link

**Ring**:
The circle at the start of a badge, `.cgc-tag-list__ring`, bordered in the tag colour. It holds
no text; from #71 it holds the tag's icon, drawn in the same colour.
_Avoid_: dot, icon badge (v4's class name)

**Count**:
How many pages are under a tag: those carrying it or any of its subtags, each once.
_Avoid_: post count, total

**Subtag list**:
What a tag page lists in place of its own tags: the tag's parent, then its direct subtags, as v4's
tags layout did. `showSubtags` turns it on, `showParentTag` adds the parent.
_Avoid_: child tags, tag children

**Long press**:
How a reader on a narrow screen, where a badge shows only its ring, expands one to read its name
and count without following the link.
_Avoid_: long click, hold

## Constraints

- **The tag colour paints the ring and never text.** The ring's `color` carries it
  ([ADR-0001](./docs/adr/0001-the-ring-carries-the-tag-colour.md)).
- **It reads only what the engine publishes:** each page's `fileData.cgcTags`, and for tags a page
  doesn't carry, the `ancestors` of every page.
