# quartz-social

`@chaoticgoodcomputing/quartz-social`, manifest name `cgc-social`, loaded by package name (#89, #94): the Quartz 5 plugin that puts social cards in a sidebar: a GitHub user's year of contributions and a
Bluesky account's latest posts, fetched in the reader's browser. v4's `SocialMediaGitHub` and
`SocialMediaBlueSky`, kept on [#42](https://github.com/chaoticgoodcomputing/blog/issues/42), homed on
[#44](https://github.com/chaoticgoodcomputing/blog/issues/44) and ported on
[#80](https://github.com/chaoticgoodcomputing/blog/issues/80). Inherits the family vocabulary in
[`quartz/CONTEXT.md`](../../CONTEXT.md), and uses **Post card** as
[`@chaoticgoodcomputing/widgets`](../../libs/widgets/CONTEXT.md) defines it.

## Language

**Card**:
One of the two things the plugin draws, each for one account: the **GitHub card** or the **Bluesky
card**. A heading, then a body the browser fills in. Both are drawn by the plugin's one component,
GitHub's first ([ADR-0001](./docs/adr/0001-one-component-draws-both-cards.md)).
_Avoid_: widget (reserved for what an MDX page imports), social media widget, panel (the GitHub
card's bordered box, `__panel`)

**Account**:
Whom a card shows: the GitHub card's `username`, the Bluesky card's `handle`. Always the site's own
choice: a card has no default account, so a site that forgets one fails to build rather than
showing someone else's.
_Avoid_: user (for the Bluesky side), profile (the GitHub card's avatar, name and bio)

**Calendar**:
The GitHub card's grid of the year: a row per weekday, a column per week, and a cell per day coloured
by its **level**. It shows the newest weeks, as many as fit the card.
_Avoid_: heatmap, contribution graph (its container, `__graph`, holds it)

**Level**:
How busy a day was, from 0 (no contributions) to 4, as the contributions API grades it. Each level
has a colour, `--cgc-social-level-<n>`, which the site sets with `levelColors`.
_Avoid_: intensity, bucket, theme (v4's option, a set of five hex colours)

**Feed**:
The Bluesky card's posts: the account's latest posts and reposts, newest first, `postLimit` of them,
each a compact **post card**. An item says why it is there, when it is a repost or a reply.
_Avoid_: timeline, posts list

**Status**:
What a card's body shows in place of its account's content: the loading state, which the page as
built holds, a failure ("Failed to load …" and the reason), or an empty feed ("No posts found").
_Avoid_: error state, placeholder

## Constraints

- **Nothing is fetched at build time.** The page as built holds each card's loading state, and the
  browser script fills it in on Quartz's `nav`, which fires on the first load and after each SPA
  navigation. Leaving a page aborts its requests. The script runs on every page; a page with no card
  asks for nothing.
- **A failure stays in its card.** Every fetch, and the drawing of what it returns, is caught, and the
  card shows a **status** instead. The other card, and the rest of the page, carry on.
- **What an account says is text.** The GitHub card builds DOM nodes, never markup, and the Bluesky
  card's posts come from the library's renderer, which escapes everything.
- **The calendar's colours are colour values** (ADR-0003's colour-value amendment). By default they
  come from the theme, `--lightgray` to `--secondary`; `levelColors` replaces them with five values,
  checked at build time. The CSS paints them, so a scheme switch repaints them with no script.
- **The colour-value check is the family's one check**, `colourValueCheck` from
  `@chaoticgoodcomputing/tags-core/colour-value`, handed the host's lightningcss, as `quartz-tags` and
  `quartz-graph` use it (`src/colour.ts`).
- **It keeps to its pages by `showOn`**, as `quartz-post-listing` does (its ADR-0001): no plugin can add
  an `is-index` condition (#70). `showOn: false` turns the filter off, for a site that keeps the
  cards to their pages itself in its `quartz.ts`, as this site does (#70).
- **Its stylesheet holds the post card's**, from the Bluesky renderer the script inlines, in the same
  `cgc.social` layer. It never selects the post card's classes itself: the compact size is the
  library's `cgc-bluesky--compact` modifier.
