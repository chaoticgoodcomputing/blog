# cgc-tag-page

The Quartz 5 page type that gives each tag its page: stock tag-page, which it wraps, with the tag's
description article as the page's only body (#72). v4's TagContent. Inherits the family vocabulary
in [`quartz-v5/CONTEXT.md`](../../CONTEXT.md). Its decision is
[ADR-0001](./docs/adr/0001-stock-tag-page-with-its-body-replaced.md).

## Language

**Tag page**:
The one page a tag has, at `tags/<tag>`: for each tag some page carries, each ancestor of one, and
`tags` itself, the index of tags. Either a **description file**'s page or a **made-up tag page**,
never both.
_Avoid_: tag listing, tag index (that is cgc-tags' `static/cgcTags.json`), folder page

**Description file**:
The Markdown file that describes one tag, at `tags/<tag>.md`, whose page is that tag's page. A file
at `tags/<tag>/index.md` is not one: it gets a page of its own beside the tag's.
_Avoid_: tag note, tag index file, description page

**Made-up tag page**:
The tag page of a tag with no **description file**, which stock tag-page generates. Its body is an
empty article.
_Avoid_: virtual tag page (Quartz's mechanism, not the reader's page), empty tag page, stub

**Description article**:
A tag page's body, `.cgc-tag-page`: the **description file** rendered as any page is, and nothing
else. The tag's posts are listed around it, by what the site's tag layout places there.
_Avoid_: tag content (stock's name for its whole body, listing included), tag body

**Stock tag-page**:
`@quartz-community/tag-page`, the plugin this one wraps and replaces. It stays installed, because
this plugin runs its code, and disabled, because both on would make every tag page twice.
_Avoid_: the upstream plugin, the original
