# cgc-post-listing

The Quartz 5 component that lists a site's posts, newest first, under the home page and on every
tag page, where it lists that tag's posts: v4's PostListing, as a consumer of the `cgc-tags` engine
(#42, #44, #73). Inherits the family vocabulary in [`quartz-v5/CONTEXT.md`](../../CONTEXT.md), and the
tag vocabulary of [`cgc-tags`](../cgc-tags/CONTEXT.md) and
[`tags-core`](../../libs/tags-core/CONTEXT.md). Its badges are
[`cgc-tag-list`](../cgc-tag-list/CONTEXT.md)'s: a **badge** with a **ring**, a name and a **count**.

## Language

**Post**:
Any page the listing may list: every page with a source file of its own, except tag pages, unlisted
pages and pages under an **excluded tag**. Not only `content/` notes: v4 listed the home page and
the privacy policy too. The .mdx pages cgc-mdx builds are posts. Quartz's virtual pages, which no
source file backs, never are, though Quartz hands them to components too: a folder page, a tag
page, the 404 page. "Has a source file" is `fileData.filePath`, which Quartz sets on every page it
parses and cgc-mdx on each of its pages.
_Avoid_: article, note (for what the listing lists), entry

**Listing page**:
A page that gets the listing: a tag page, or a page whose slug `showOn` names, such as `index` or
`404`. On any other page the component renders nothing, wherever the layout puts it
([ADR-0001](./docs/adr/0001-the-listing-keeps-to-its-own-pages.md)).
_Avoid_: index page (that is one listing page), listing layout

**Tag page**:
A page for one tag, as tags-core's `tagOfPage()` reads its slug: `tags/<t>`, or `tags/<t>/index`,
a tag's description file in v4's layout. Only a whole `index` segment is dropped, so `tags/reindex`
is the page for `reindex`. The index of every tag, `tags`, is none. cgc-tag-list reads tag pages the
same way.
_Avoid_: tag listing, tag index (that is the page of every tag)

**Tag filter**:
What narrows a tag page's listing to the **posts** under its tag, those under its subtags included
by default. It reads the engine's expanded ancestor set, so "under `engineering`" is
`"engineering" in fileData.cgcTags.ancestors`. Only a tag page has one.
_Avoid_: current-tag filter, tag scope

**Excluded tag**:
A tag whose **posts**, and its subtags' posts, never appear: `excludeTags`, `private` by default.
_Avoid_: hidden tag, private filter

**Listing order**:
Newest first by the date the listing shows, with same-date posts in A→Z order by title, and
undated posts last, A→Z. "Same date" is the calendar day, where the build formats it, since that is
all a reader sees. v4's tie-break was Z→A, and it only ever applied to undated posts (#42).
_Avoid_: sort, chronological order

**Description line**:
The line under a **post**'s title: its date, its frontmatter `description` and its reading time. A
post with no frontmatter `description` has none, as in v4.
_Avoid_: summary, excerpt, meta

**Toggle**:
The `<details>` that holds every **post** after the first `collapsedItemCount`, opened by "Show N
more posts".
_Avoid_: collapse, show more

## Constraints

- **The tag colour paints the ring and never text**, as in `cgc-tag-list` (its ADR-0001).
- **It reads only what the engine publishes:** each page's `fileData.cgcTags`, for its tags, the
  **tag filter** and the **excluded tags**. Never `frontmatter.tags`.
- **Its links are relative, except on the 404 page**, which Quartz serves at any depth: there they
  start from the site's base path.
- **Its long press is a copy of cgc-tag-list's**, with its own class names and breakpoint. Sharing
  one script through a library is a follow-up: both plugins would take it from tags-core, whose
  consumers' builds would then all have to carry a text import of a browser script.
