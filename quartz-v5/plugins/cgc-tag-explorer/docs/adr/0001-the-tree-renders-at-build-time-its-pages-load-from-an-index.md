---
status: proposed
date: 2026-09-25
---

# The tree renders at build time; the pages under a tag load from the plugin's own index

v4's TagExplorer built everything in the browser, on every navigation. It fetched the tag index and
the content index
([TagExplorer.inline.ts:576-580](https://github.com/chaoticgoodcomputing/blog/blob/9e48f89b256f511a94f07d473d46395d91730c53/quartz/components/scripts/TagExplorer.inline.ts#L576-L580)),
built the tree of tags, and put each tag's pages under it, sorted by date
([:286-345](https://github.com/chaoticgoodcomputing/blog/blob/9e48f89b256f511a94f07d473d46395d91730c53/quartz/components/scripts/TagExplorer.inline.ts#L286-L345)).
Under v5 three things change. The `cgc-tags` engine publishes each page's tags, colours and icon ids
at build time (ADR-0002). Icons are drawn only at build time, because the icons library reads the
file system (#71). And stock `content-index` no longer carries `date`. The map's answer to that last
point was that the explorer would read `date` from `cgc-graph`'s own index (#44). Proposed while
porting the explorer on [#76](https://github.com/chaoticgoodcomputing/blog/issues/76). It departs
from that settled row of #44's map, so it stays proposed until the owner supersedes the row; if the
owner keeps the row instead, the explorer reads `date` from `cgc-graph`'s index.

> v4 links point at this repo at `9e48f89`.

The real vault has about 630 pages under 37 tags. Its pages sit under their tags about 1,400 times,
since most pages carry several tags and each is listed under every one.

## Decision

The explorer comes in two halves.

- **The tree of tags is rendered into every page when the site builds.** This covers each tag's
  mark (its icon, or a dot, in its tag colour), its count and its link. The component reads the
  engine's per-page artifact from every page (`fileData.cgcTags.ancestors`) and draws the icons with
  the icons library. So the tree reads and links before any script runs, and no tag data or icon
  goes to the browser.
- **The pages under each tag load when the tag opens.** They come from an index that the plugin's
  own emitter writes, `static/cgcTagExplorer.json`. It holds every listed page once (slug, title,
  and whether it is private) and, for each tag, the pages that carry it, in the order they are
  listed. The script fetches it once per document and fills in a tag as it opens, or as a navigation
  restores it open.

## Why not render the pages too

It would be about 1,400 links, rendered into all 630 pages. That is several hundred kilobytes of
HTML on every page for lists a reader mostly keeps closed. v4 kept them out of the HTML as well.

## Why not `cgc-graph`'s index, or stock `content-index`

- **`cgc-graph`'s index** would make the explorer depend on the graph plugin. A consumer depending
  on another consumer is not a channel ADR-0002 sanctions: consumers read engines' artifacts. It
  would also be a sequencing trap, since the graph's index arrives in its own ticket (#74). And the
  browser would fetch the graph's whole index, links and all, and sort each tag's pages itself.
- **Stock `content-index`** has no `date`, so it can't give v4's newest-first order.

The emitter already sees every page, those that page types generate included, with its date and
the engine's tags. So it writes exactly what the explorer lists, sorted once, at build time.

## Consequences

- **Every page carries the tree.** On the real vault's first v5 build that was about 47 KB of HTML
  per page, 8.6 KB gzipped, most of it the 36 tags' icons. The index is 74 KB, 13 KB gzipped,
  fetched once per visit. v4's script read the site's whole content index, about 1 MB for this
  vault, and fetched each icon from a CDN.
- **A tag's pages show after one fetch per document.** A reload, or a tag opened before the fetch
  resolves, shows them a moment after the tag opens. SPA navigations reuse the fetched index.
- **Without JavaScript, the tree shows every tag and links to its page, but no tag opens.** v4
  showed nothing without JavaScript.
- **The index is this plugin's own file, not a published artifact.** Its shape can change with the
  plugin. No other plugin reads it.
- **The build does the sorting.** Private pages come last, then pages are ordered newest first,
  undated pages last, and pages with the same date A→Z. The script only renders the order it is
  given. v4 broke same-date ties Z→A. #42 restored upstream's A→Z for the listings that shared that
  tiebreak, and the explorer follows.
