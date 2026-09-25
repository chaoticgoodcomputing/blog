---
status: accepted
date: 2026-09-25
---

# The tag stylesheet is an emitted file, linked from every page

The engine publishes one colour property per tag in the corpus, in the `cgc.tags` layer (#31).
ADR-0003 rule 11 has a package ship its CSS from `externalResources()`, and the usual way is an
inline stylesheet there, which Quartz writes to a hashed file of its own, runs through lightningcss
and links from each page. That is not open to this stylesheet. Decided while building the engine on
[`tags-core`, `cgc-tags` and `cgc-tag-list`](https://github.com/chaoticgoodcomputing/blog/issues/69).

> Source links point at upstream Quartz at
> [`97a2d05`](https://github.com/jackyzha0/quartz/tree/97a2d05f80c4c50534959b1d0d41cc4b3895625e)
> (v5.0.0), the ref `quartz-v5/upstream.json` pins.

**`externalResources()` can't know the corpus.** It is called once, with the build context and
nothing else, before any emitter runs
([emit.ts:56](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/processors/emit.ts#L56)),
and on a watch rebuild before the changed files are even parsed
([build.ts:227](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/build.ts#L227)).
The transformer sees each page's tags, but above 191 files it runs in parse workers
([parse.ts:154-155](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/processors/parse.ts#L154-L155)),
whose writes never reach the main thread (ADR-0002). Only an emitter sees every page, those page
types generate among them
([emit.ts:76-84](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/processors/emit.ts#L76-L84)).

## Decision

- **The emitter writes `static/cgcTags.css`**, beside `static/cgcTags.json`, from the same pass
  over the corpus.
- **`externalResources()` links it** as a non-inline stylesheet. Quartz renders that as a `<link>`
  with `data-persist`, so SPA navigation keeps it
  ([resources.tsx:47-62](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/util/resources.tsx#L47-L62)).
  Its `href` is fixed for every page, so it is absolute: the site's base path as core computes it
  for `data-basepath`, and nothing under `serve`
  ([renderPage.tsx:342-345](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/components/renderPage.tsx#L342-L345)).
- **Only the emitter carries `externalResources()`.** Core gathers them from transformers and
  emitters alike
  ([plugins/index.ts:11](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/index.ts#L11)),
  and a plugin in both categories is instantiated twice, so one factory would link the sheet twice.
  The package exports two factories, `transformer` and `emitter`, and no default. The loader picks
  each by its shape
  ([config-loader.ts:555-591](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/config-loader.ts#L555-L591)).

## Consequences

- **Quartz doesn't lower it.** Only inline sheets go through lightningcss
  ([componentResources.ts:439-466](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/emitters/componentResources.ts#L439-L466)),
  so every colour reaches the browser as the site wrote it. The stylesheet reads as the contract
  says, and a `light-dark()` is resolved by the browser itself. That needs a browser with native
  `light-dark()` (Baseline 2024) and a `color-scheme` source, such as the darkmode plugin, which a
  lowered one needs too (ADR-0003's colour-value amendment). #31 recorded that either way works,
  given the `color-scheme` source.
- **It isn't content-hashed**, like core's `static/contentIndex.json`, so a browser can hold a stale
  copy across a deploy until its cache expires.
- **A site at a base path works; one moved after building doesn't.** The link follows `baseUrl`.

## Considered alternatives

- **Inline, covering only the dictionary's tags and their ancestors.** A corpus tag the dictionary
  doesn't reach would have no property, so a consumer would need a `var()` fallback chain up the
  tag's lineage, and a site couldn't restyle it. Rejected: #31 decided one property per tag.
- **Reading every page's frontmatter again in `externalResources()`.** It would copy note-properties'
  parsing and tag slugification, which the engine should never disagree with, and still miss the
  pages page types generate.
- **A filter that gathers tags between parsing and emitting.** Filters do run in between, on the
  main thread, but not before `externalResources()` on a watch rebuild, and never on generated pages.
- **A link from `additionalHead`.** It could be relative per page, but head extras render after every
  `externalResources()` sheet, and ADR-0003 rule 11 reserves that route for widget CSS.
