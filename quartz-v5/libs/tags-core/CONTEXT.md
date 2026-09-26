# @chaoticgoodcomputing/tags-core

The library at the bottom of the tag system (ADR-0002's worked example, #20, #31). It holds the
resolution rule, the shapes the `cgc-tags` engine publishes, the `fileData` augmentation that
types them, the tag hierarchy's rules, which pages are private, the one colour resolver for code
that paints on a canvas, and the one check that an option is a colour value. The engine resolves
with it, so the rule lives in one place; its consumers import the types, a canvas the resolver, and
a plugin with colour options the check. A plugin that needs a rule but not the engine inlines the
library alone, as `cgc-seo` and `cgc-backlinks` do for **private pages**: a library is no plugin,
so they stay free of any engine (ADR-0002 rule 4, #57, #78). It ships as TypeScript source, and
the plugin's build inlines it (ADR-0005). Inherits the family vocabulary in
[`quartz-v5/CONTEXT.md`](../../CONTEXT.md), where **Tag colour**, **Colour value** and **Icon id**
are defined.

## Language

**Tag definition**:
One tag's entry in the engine's dictionary, as a site writes it: an optional colour value and an
optional icon id. A tag the dictionary doesn't list has an empty one.
_Avoid_: tag config, tag entry, tag settings

**Tag properties**:
What the engine publishes for one tag, resolved: the name of its **colour property** and its icon
id. An interface, `TagProperties`, which a consumer that merges its own slice into the published
structure extends by declaration merging (ADR-0002 rule 5).
_Avoid_: tag metadata (v4's name, for a shape that also carried counts and the hierarchy)

**Colour property**:
The custom property that carries one tag's colour: `--cgc-tag-` and the tag, with `/` written
`--`, so `engineering/languages/python` is `--cgc-tag-engineering--languages--python`. What the
engine publishes as a tag's colour, in place of the colour itself. Every tag has one, and a tag
with no colour of its own sets its property to `var()` of its parent's; the chain ends at
`--cgc-tags-default`.
_Avoid_: tag variable, colour name, CSS variable

**Resolution rule**:
How a tag's properties follow from the dictionary: its own definition wins, and whatever it leaves
out comes from its nearest ancestor that has it. Colour is inherited through the cascade, through
colour properties; icons are inherited here.
_Avoid_: fallback, lookup

**Primary tag**:
The one tag that stands for a page: its most specific tag, the deepest one, where the first in
frontmatter order breaks a tie. A page's `primaryTag` frontmatter overrides both, and must name
one of its tags.
_Avoid_: main tag, page tag, category

**Normalised tag**:
A tag as the engine publishes it: slugified by Quartz, with `/` between levels and none at either
end. `normaliseTag()` makes one from a tag as a site writes it, with the host's `slugTag`; the engine
normalises its dictionary and every page's tags with it, and a plugin that takes tags as options
normalises them the same way, so they match.
_Avoid_: slug (a page's), clean tag

**Under**:
Of a tag: being another tag or a descendant of it, at any depth, down its lineage. `private/work`
is under `private`; `privateer` only starts with the same letters, and is not. `underAny()`.
_Avoid_: prefixed by, starts with, child of (that is one level only)

**Expanded ancestor set**:
Every tag a page is under: its own tags and every ancestor of each, published with each one's
properties. "Is this page under `engineering`?" is `"engineering" in ancestors`. Taken over every
page, it is every tag in the corpus.
_Avoid_: tag closure, all tags, lineage (that is one tag's chain up to the top)

**Tag page**:
The page for one tag, which `tagOfPage()` reads from a slug: `tags/<t>`, or `tags/<t>/index`, a
tag's description file in v4's layout. Only a whole `index` segment is dropped, so `tags/reindex`
is the page for `reindex`. The index of every tag, `tags` or `tags/index` (`isAllTagsPage()`), is
for none. One function, so every plugin that treats a tag page differently agrees on which pages
those are.
_Avoid_: tag listing, tag index (that is the page of every tag)

**Private tag**:
One of the tags a site names as private, in the option each plugin that treats private pages
differently takes them by: `cgc-seo`'s `noindexTags`, and `privateTags` in `cgc-backlinks`,
`cgc-graph` and `cgc-tag-explorer`. A site names them once and gives every such plugin the same list.
_Avoid_: noindex tag (that is cgc-seo's option), hidden tag

**Private page**:
A page that carries a **private tag**, or a tag under one: `privatePageTest()`, from the page's own
tags or its expanded ancestor set, which give the same answer. One function, so every plugin that
treats a private page differently (a `noindex`, a lock, a filter) agrees on which pages those are. A
private tag's own tag page is not one by this rule; `cgc-seo` keeps it out of search as well.
_Avoid_: hidden page, unlisted page (stock Quartz's stronger state), draft

**Colour resolver**:
`resolveColour()` and `resolveTagColour()` in `./colour`: the browser-only way to turn a colour
value, or a colour property, into the `rgba()` the page is showing now. A probe element resolves
it in the current scheme, and a 1×1 canvas normalises it. Results are cached per scheme and
dropped on `themechange`.
_Avoid_: colour getter, theme reader

**Colour-value check**:
`colourValueCheck()` in `./colour-value`: the server-only test of whether an option is a colour
value, which every colour-valued option in the family is put to at build time (ADR-0003's
colour-value amendment). It parses with the lightningcss the calling plugin hands it, the host's,
so a value passes exactly when Quartz would read it as a colour.
_Avoid_: colour validator, colour parser

## Constraints

- **Plain data only.** Published values cross the parse workers' structured-clone boundary
  (ADR-0002), so nothing here publishes a function or a class instance.
- **Tags arrive normalised.** Every function takes normalised tags. Normalising what a site writes
  is the engine's job, and a plugin's for the tags its own options name: both do it with
  `normaliseTag()`, which takes `slugTag` from its caller.
- **`./colour` touches the DOM.** A plugin's server-side code imports `.` and `./colour-value`
  only, and a browser script `.` and `./colour`.
- **No dependencies of its own at runtime.** The colour-value check takes lightningcss from its
  caller rather than importing one, which could disagree with the host's, and `normaliseTag()`
  takes the host's `slugTag` for the same reason.
- **Tested through the plugins that inline it.** The rule and the shapes through `cgc-tags`' specs; the
  colour-value check through `cgc-tags`', `cgc-graph`'s and `cgc-social`'s option specs; the
  colour resolver through `cgc-graph`'s colour and scheme specs, which paint the theme's colours
  and every tag's with it (#74, #77), and a probe script its own spec runs on a fixture page
  (`e2e/colour.spec.mjs`) for a colour syntax no consumer paints yet; `tagOfPage()` through what
  `cgc-post-listing` and `cgc-tag-list` render on tag pages (`e2e/tag-pages.spec.mjs`), and
  through `cgc-graph`'s tag nodes; `privatePageTest()`, `underAny()` and `normaliseTag()` through
  every plugin that treats private pages differently, on a site that names its private tags once
  (`tests/specs/private-pages.spec.mjs`).
