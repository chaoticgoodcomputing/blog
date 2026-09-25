---
status: accepted
date: 2026-09-25
---

# The graph publishes its own index

v4's graph drew from core's content index, which v4's fork of the `contentIndex` emitter kept each
page's date in ([contentIndex.tsx:222-231](https://github.com/chaoticgoodcomputing/blog/blob/9e48f89b256f511a94f07d473d46395d91730c53/quartz/plugins/emitters/contentIndex.tsx#L222-L231)).
The global graph's time filter reads that date
([filterLogic.ts:35-42](https://github.com/chaoticgoodcomputing/blog/blob/9e48f89b256f511a94f07d473d46395d91730c53/quartz/components/scripts/graph/ui/filterLogic.ts#L35-L42)). Stock v5 `content-index` deletes
`date` before it writes `static/contentIndex.json`
([emitter.ts:186-192](https://github.com/quartz-community/content-index/blob/8c479bd40692c3e1251723f65eebb7f9fc80795f/src/emitter.ts#L186-L192),
at v1.0.0, the version the vendored copy installs), so a v5 graph drawn from it can't filter by
time. The map chose that `cgc-graph` publishes its own index rather than touch `content-index`
([Fork ledger](https://github.com/chaoticgoodcomputing/blog/issues/21), the ledger's
`plugins/emitters/contentIndex.tsx` row). This records the shape it took on
[`cgc-graph`: the graph, with its own content index](https://github.com/chaoticgoodcomputing/blog/issues/74).

## Decision

The plugin's emitter writes `static/cgcGraph.json`: every **authored page** keyed by its slug, with
its `title`, its `links` as Quartz resolved them, its `tags` as the `cgc-tags` engine published them
on `fileData.cgcTags`, and its `date` as an ISO 8601 string, read as stock components read it
(`getDate`, by the site's `defaultDateType`). It is the plugin's published artifact (ADR-0002), and
its shape is typed in the package as `GraphIndex`.

- **Authored pages only.** A page belongs if it has a file behind it (`fileData.filePath`), which
  takes in `.md` pages and those a page type renders from a file, such as `cgc-mdx`'s. The tag pages
  and folder pages Quartz generates have no file, and v4's index never had them: the graph draws a
  tag as a tag node, from the tags pages carry. Unlisted pages are left out, as stock leaves them out
  ([emitter.ts:138](https://github.com/quartz-community/content-index/blob/8c479bd40692c3e1251723f65eebb7f9fc80795f/src/emitter.ts#L138)).
- **Only what a graph draws.** No text, no description and no file path. The real vault's text is
  most of `contentIndex.json`'s weight, and search already loads it there.
- **Keys are full slugs, links simple slugs,** as Quartz names them, so the index reads like core's.
  The runtime maps both to node ids.

## Consequences

- **A page's date comes from the site's date plugin.** Without one, `date` is absent.
- **Two indexes load on a page with search:** core's for search, and this one, fetched once per page
  load the first time a graph draws.
- **Another plugin can read it,** such as a tag explorer sorting by date (FORK-LEDGER), by
  depending on `cgc-graph`. Its shape is then a contract, as `cgcTags.json`'s is.

## Considered alternatives

- **Replacing `content-index`,** or a fork of it that keeps `date`. Search, the explorer and the
  sitemap all read it, so its blast radius is the whole site (#20).
- **Post-processing `contentIndex.json` after it is written.** Emitters run concurrently, so nothing
  orders one after another (#20).
- **A `date` on `fileData` for the graph to read at render.** The component renders each page with
  every page's data, but embedding the whole corpus in every page's HTML costs more than one fetch.
