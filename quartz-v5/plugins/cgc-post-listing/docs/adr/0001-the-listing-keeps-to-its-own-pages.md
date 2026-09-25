---
status: accepted
date: 2026-09-25
---

# The listing keeps to its own pages

v4 put its PostListing after the body of three layouts: the index, the tags layout and the 404 page
(FORK-LEDGER `components/PostListing.tsx`). Quartz 5 has one layout, and a component's config entry
places it on every page. A `condition` narrows that, but Quartz 5 ships only `not-index`, and #44's
plan, `site-components` registering an `is-index` condition, can't work: the loader's condition
registry is bundled into Quartz's own build, where no plugin can reach it (#70,
`site-plugins/site-components/CONTEXT.md`). `byPageType` can only remove a component from a page type,
and the index is a content page like any note. Decided on
[`cgc-post-listing`](https://github.com/chaoticgoodcomputing/blog/issues/73).

## Decision

The component decides for itself which pages get the listing. It renders on every tag page, and on
the pages its `showOn` option names by slug, `["index"]` by default. Everywhere else it renders
nothing. A site places it in a slot every page shares, `afterBody`, and removes it from tag pages,
if it wants to, with `byPageType.tag.exclude`. The real site lists `index` and `404`, v4's two other
layouts.

This is how Quartz's own components already behave where the data decides: stock tag-list renders
nothing on a page with no tags, wherever the layout puts it. The listing's data is the page's kind,
which Quartz doesn't pass a component, so its slug stands in.

## Why

- **A downstream site is in the same position.** The shareability test asks whether the plugin works
  on stock Quartz. On stock Quartz no plugin can register a condition, so a listing that relied on
  `is-index` would be usable only on a site that edits Quartz's own `quartz.ts`. With `showOn`, a
  stock site gets the listing on its home page from config alone.
- **It needs no human decision now.** The alternatives below each wait on one, and #73 would have
  shipped without the home page's listing, which is the reason v4 had the component at all.
- **It stays out of the way of a later fix.** If Quartz gains an `is-index` condition, or the site an
  index page type, the site config can place the listing that way, and `showOn` still agrees with it.

## Considered alternatives

- **A vendored change** letting a plugin register conditions, with its ticket and upstream proposal.
  ADR-0001 allows two vendored changes, both taken. Adding a third is the owner's call (#70).
- **The index as its own page type**, from a site plugin. It changes how every other page type is
  laid out, since `byPageType` can only remove: each would exclude every index-only component. That
  is a site decision, not a plugin's, and it's still open (#70).
- **A frontmatter flag on the pages that list posts.** The vault's index would carry plugin
  configuration in its content, and every downstream site would have to learn the flag.
- **Two config entries**, one per layout, as `site-components` places its two components (#70). Each
  entry still renders on every page: it changes the options, not the placement.

## Consequences

- **`showOn` duplicates what a layout condition would say**, for the pages that aren't tag pages. If
  an `is-index` condition ever becomes available, the listing could drop the option, which would be a
  breaking change to its config.
- **A tag page always gets the listing** unless the site excludes it by page type. That matches v4,
  whose tags layout always had it.
- **The 404 page's links start from the site's base path.** Quartz serves the 404 page at whatever
  depth was asked for, so a relative link from it would resolve against the wrong folder. Quartz's own
  head does the same for the 404 page.
