---
status: accepted
date: 2026-09-25
---

# `.mdx` pages at their clean URLs, for the whole site

An `.mdx` page lives at its path without the extension: `lab/life.mdx` is published at `/lab/life`,
as v4 published `resume.mdx` at `/resume`. Emitting the page there was never the problem. The rest
of the site finding it there was. So `cgc-mdx` is also a **transformer**, whose only job is the
page's address. It lists every `.mdx` page in Quartz's list of slugs under the address the page
lives at, and it points every internal link written with the `.mdx` extension at that address,
before `crawl-links` resolves either. Links, backlinks, popovers and graph edges then reach `.mdx`
pages the way they reach `.md` ones. Decided on
[`cgc-mdx` on the real site: `.mdx` slugs, links and watch](https://github.com/chaoticgoodcomputing/blog/issues/65),
which resolved the map's `cgc-mdx` fog.

> Links to Quartz 5 point at upstream
> [`97a2d05`](https://github.com/jackyzha0/quartz/tree/97a2d05f80c4c50534959b1d0d41cc4b3895625e)
> (v5.0.0), the ref `quartz-v5/upstream.json` pins. The stock plugins named are the versions the
> vendored copy installs: `@quartz-community/utils` 1.0.1, `crawl-links` and `note-properties` 1.0.0.
> v4 links point at this repo at `9e48f89`.

## Why

**Quartz lists an `.mdx` file under the wrong slug.** Every build fills `ctx.allSlugs` from the
content glob through `slugifyFilePath`
([build.ts:91](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/build.ts#L91)),
which drops only a `.md` or `.html` extension. So the list holds `lab/life.mdx`, never `lab/life`.
`crawl-links`' `shortest` resolution matches a link's last segment against that list, found no
`life`, and fell back to a root-relative `/life`. The fixture proved it: `[[life]]` from a page in
`links/` went to `/life`, a 404, and `/lab/life` listed no backlink for it.

**A link written with the extension keeps it.** Obsidian writes `[[notes/dice.mdx]]` for a file
that isn't Markdown. The vault has seven such wikilinks, and eight Markdown links like
`[resume](/resume.mdx)`. `transformInternalLink` slugifies the target with the same function, so the
link came out as `…/dice.mdx` under every resolution strategy, the site's `absolute` included. v4
never had either problem, because its fork of `slugifyFilePath` dropped `.mdx` too
([path.ts:76-78](https://github.com/chaoticgoodcomputing/blog/blob/9e48f89b256f511a94f07d473d46395d91730c53/quartz/util/path.ts#L76-L78)). The fork
ledger's `util/path.ts (.mdx slug)` row makes that this plugin's job.

**A transformer is the one plugin hook early enough.** `.md` pages are parsed, and their links
resolved, long before any page type's `generate` runs. So the page type can't fix what `.md`
pages link to. A transformer's `markdownPlugins(ctx)` and `htmlPlugins(ctx)` are called with the
build context while each processor is built, before a file is parsed. They are the earliest point a
plugin sees `ctx.allSlugs`, and the rehype plugin they return runs just before `crawl-links`
(order 45 to its 60).

**In place, in every copy of the context.** A parse worker gets its own copy of `ctx.allSlugs` for
each phase ([parse.ts:177](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/processors/parse.ts#L177)),
and a watch rebuild lists the slugs afresh
([build.ts:286](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/build.ts#L286)).
So both transformer hooks, the page type's compile and the emitter's `externalResources`, which is
the emit phase's first call in the main thread, all correct the list, idempotently. They correct
it in place, because transformers keep a reference to the array: stock `note-properties` adds
aliases to it the same way.

## Considered alternatives

- **A vendored change to `slugifyFilePath`, or to `build.ts`** so that core strips every
  extension a page type declares. It's the cleanest fix, and it's an upstream proposal worth
  making, but ADR-0001 keeps vendored changes to what no plugin can do, and a plugin can do this.
- **Rewriting links in the Markdown tree instead.** It would run before `crawl-links` whatever the
  plugin's order, but it would have to know `obsidian-flavored-markdown`'s own `wikilink` node
  before that plugin turns it into a link. The HTML tree has one shape for every link, raw HTML
  anchors included.
- **One factory for all three roles.** The loader instantiates a package once per category it
  declares ([config-loader.ts:342-350](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/config-loader.ts#L342-L350)),
  and collects `externalResources` from every transformer _and_ every emitter
  ([plugins/index.ts:11](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/index.ts#L11)).
  One object with every hook would have put each page's widget CSS in its head twice. So the
  module exports two factories, `CgcMdx` (page type and emitter) and `CgcMdxLinks` (transformer),
  and no default: with several exports, the loader picks the one whose instance fits each category
  ([config-loader.ts:555-595](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/config-loader.ts#L555-L595)),
  as it does for stock `quartz-fonts`.

## Consequences

- **The transformer must run before `crawl-links`.** Its default order does that. A site that
  gives `cgc-mdx` an `order` of 60 or more gets `.mdx`-extension links unresolved again.
- **A transclusion, `![[page.mdx]]`, is not rewritten.** `obsidian-flavored-markdown` builds it as
  raw HTML carrying the target in `data-url`. No vault page transcludes an `.mdx` page, and
  `![[page]]` without the extension works.
- **Watch needed no fix.** A watch rebuild re-parses only the `.md` files that changed
  ([build.ts:230](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/build.ts#L230)),
  which is why the map asked whether an `.mdx` edit rebuilds. It does. Every rebuild runs every page
  type's `generate` again
  ([dispatcher.ts:279](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/pageTypes/dispatcher.ts#L279)),
  and `cgc-mdx` compiles once per `buildId`, which each rebuild changes, so it re-reads every page
  and re-bundles every widget. `e2e/watch.spec.mjs` edits a page, edits its widget and adds a page
  under a running `quartz build --serve`. With the compile cached across builds instead, it fails.
- **What watch does, beyond that, is Quartz's.** A deleted page, `.mdx` or `.md`, stays in the
  output until the next full build. And a widget whose source sits in the content folder is copied
  into the output. When the output is under the Quartz root, as stock Quartz's default `public` is,
  serve's source watcher, which watches every `**/*.tsx` under that root
  ([handlers.js:588-603](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/cli/handlers.js#L588-L603)),
  takes the copy for Quartz's own source and restarts the whole build after the content rebuild,
  often several times over, and later edits can each rebuild more than once. The page is right after
  every rebuild. So this site's `site-v5:serve` writes outside the Quartz root, to
  `quartz-v5/.serve-public`, as `e2e/watch.spec.mjs`'s serve run does, and that spec checks the two
  stay alike. The README tells other sites the same.
