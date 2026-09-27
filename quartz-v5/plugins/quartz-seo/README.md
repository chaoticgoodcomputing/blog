---
title: quartz-seo
tags:
  - projects/site/plugins
  - engineering/languages/typescript
---

`@chaoticgoodcomputing/quartz-seo` is a [Quartz 5](https://quartz.jzhao.xyz) plugin for what search engines and feed readers see of a site. It keeps **private pages** out of search results, the sitemap and the RSS feed while leaving them on the site. It gives every page a canonical URL and every article its `article:*` metadata and JSON-LD. And it writes the sitemap, tag pages included, and the RSS feed.

It started as the SEO half of this site's Quartz 4 fork, and it runs on a stock copy of Quartz 5.

## What it does

### In each page's head

It adds these to each page's `<head>`, through Quartz's per-page `additionalHead`:

- **`<meta name="robots" content="noindex">` on private pages, and on their tags' pages.** A page is private when it carries one of the `noindexTags`, or a descendant of one. `private/work` is a descendant of `private`, but `privateer` isn't. The page of each of those tags gets it too, `/tags/private` and `/tags/private/work`, whether Quartz generates it or a description note supplies it. There's no `nofollow`, so a private page's links to indexable pages still count.
- **`<link rel="canonical">` on every page:** the page's URL at the site's `baseUrl`, without a trailing `index`.
- **OpenGraph article metadata on articles:** `article:published_time`, `article:modified_time`, `article:author`, `article:section` (the first tag's top segment) and one `article:tag` per tag (its last segment).
- **A JSON-LD article on articles:** its `@type` and `articleSection` come from the page's tags, and its author, publisher, image, dates, description and keywords from the page and your options.
- **`<link rel="alternate" type="application/rss+xml">` on every page**, so a feed reader given any page finds the feed.

A private page is still listed on the site: search and the graph always list it, and the explorer and backlinks do unless they leave private pages out with their `excludePrivate` option, as this site does. Stock Quartz's `unlisted: true` is a different, stronger state. It also hides the page from all of those.

Which pages are private is the rule the whole plugin family shares, from the `@chaoticgoodcomputing/tags-core` library, which this plugin builds in: it needs no other plugin. Give [quartz-backlinks](https://blog.chaoticgood.computer/plugins/quartz-backlinks), [quartz-graph](https://blog.chaoticgood.computer/plugins/quartz-graph) and [quartz-tag-explorer](https://blog.chaoticgood.computer/plugins/quartz-tag-explorer) the same tags, as their `privateTags`, and they mark (or, with `excludePrivate`, leave out) the same pages. A tag is matched the way Quartz writes tags, so `Private` and `private/` both name `private`.

Articles are the pages built from a note of their own, optionally limited to some folders. Tag listings and the 404 page are never articles.

### `sitemap.xml`

The sitemap lists every page search engines should index, once each:

- every page that isn't private, unlisted or an external page (a stub for a page on another site, which names that page's URL as `external` in its frontmatter);
- the page of every tag those pages carry, and of each tag's ancestors, plus `/tags/index`, the page of all tags, wherever the site builds them (stock `tag-page` does). A tag that only private pages carry is left out, since its page lists nothing but private pages.

Every tag's page is listed at `/tags/<tag>`, whether Quartz generates it or the tag's description note supplies it, as `tags/<tag>.md` or `tags/<tag>/index.md`. Each entry's `<lastmod>` is the page's own date, from the site's `defaultDateType`. A page Quartz generates, such as a tag listing without a description note, has none.

### `index.xml`, the RSS feed

The feed carries the newest articles that aren't private, unlisted or external, newest first, up to `rssLimit`. Each item has the article's title, URL and date, and a `<category>` for each tag, with the tag's full path. Its description is the article's own `description` frontmatter followed by its reading time, as in `A short summary. (4 min read)`. An article without its own description gets just the reading time, since a description Quartz derives is only the page's first lines.

## Install

The plugin is the npm package `@chaoticgoodcomputing/quartz-seo`, built, with its type declarations, and loaded by name, as Quartz's own `@quartz-community/*` plugins are. Install it into your Quartz site:

```shell
npm install @chaoticgoodcomputing/quartz-seo
```

and list it in `quartz.config.yaml` by its package name, `source: "@chaoticgoodcomputing/quartz-seo"`. Its peers, Preact and Quartz's own packages, are your site's own copies, so a page has one Preact. The package isn't on npm yet: it is published after this site moves to Quartz 5 ([#90](https://github.com/chaoticgoodcomputing/blog/issues/90)).

Stock `content-index` writes a sitemap and feed of its own to the same files, so turn those off and keep its `contentIndex.json`, which the site's search and graph read:

```yaml
- source: "@quartz-community/content-index"
  enabled: true
  options:
    enableSiteMap: false
    enableRSS: false
```

Don't mark private pages `unlisted` to keep them out of the sitemap instead: that also takes them out of `contentIndex.json`, and so out of search and the graph.

## Options

| Option | Default | What it does |
| --- | --- | --- |
| `noindexTags` | `[private]` | Tags that make a page private, together with their descendants. Their own pages are kept out of search too. |
| `defaultAuthor` | the site, as an Organization named by `pageTitle` | Credited on every page whose frontmatter names no `author`. A name, or `{ name, url, type }`, where `type` is `Person` (the default) or `Organization`. |
| `publisher` | `defaultAuthor` | The JSON-LD publisher, `{ name, url, type, logo }`. An Organization gets a logo: `logo.url` defaults to the site icon, `static/icon.png`, and `logo.width` and `logo.height` are optional. |
| `articleFolders` | every note | Limits articles, and so the feed, to the notes in these folders. |
| `articleTypes` | none | `{ tag, type, section }` entries. The first entry whose tag the page carries sets the JSON-LD `@type` and `articleSection`. |
| `defaultArticleType` | `Article` | The JSON-LD `@type` when no `articleTypes` entry matches. |
| `enableSiteMap` | `true` | Writes `sitemap.xml`. |
| `enableRSS` | `true` | Writes the feed, `index.xml`, and links it from every page's head. |
| `rssLimit` | `10` | The most articles the feed carries. `0` carries every article. |
| `rssLastFewNotesText` | `Last {count} notes` | The feed's description when it has a limit, before ` on <pageTitle>`. `{count}` is replaced by the limit. Stock content-index's option, for a site in another language. |
| `rssRecentNotesText` | `Recent notes` | The feed's description when `rssLimit` is `0`, before ` on <pageTitle>`. |

`article:author` is the author's `url` when there is one, and otherwise the name.

A page names its own author in frontmatter, overriding `defaultAuthor`:

```yaml
---
title: A guest post
author: Ada Lovelace # a name
---
```

It's a name, credited as a Person. A list or a `{ name, url, type }` object there isn't read, and the page keeps `defaultAuthor`.

The plugin doesn't touch `<meta name="description">`. Quartz Core writes it from the page's `socialDescription` or `description` frontmatter, uncut. Stock `description`'s `descriptionLength` and `maxDescriptionLength` only bound a description it derives from the page body. So a long description is no longer cut to 160 characters there, as this site's Quartz 4 fork cut it. A plugin can't change Core source's tag.

Without a `baseUrl`, the plugin can't build absolute URLs, so it adds only the `noindex` tag, and writes no sitemap or feed.

## Example

This is how [chaoticgood.computer](https://chaoticgood.computer) configures it:

```yaml
- source: "@chaoticgoodcomputing/quartz-seo"
  enabled: true
  options:
    noindexTags: [private]
    articleFolders: [content]
    defaultAuthor:
      type: Person
      name: Spencer Elkington
      url: https://blog.chaoticgood.computer/about
    publisher:
      type: Organization
      name: Chaotic Good Computing
      url: https://blog.chaoticgood.computer/about
      logo: { width: 184, height: 184 }
    articleTypes:
      - { tag: writing/tutorials, type: HowTo, section: Tutorials }
      - { tag: engineering, type: TechArticle, section: Engineering }
    defaultArticleType: Article
    rssLimit: 40
```

## Notes

- The JSON-LD image is the page's own OpenGraph image. That's its `socialImage` frontmatter if it has one, then the card that stock `og-image` generates when that plugin is on, and otherwise `static/og-image.png`.
- The sitemap and feed keep the shape of this site's Quartz 4 versions, so tools that read them, such as an IndexNow submission that reads the sitemap, work unchanged.
- The terms used here (private page, unlisted page, page author, tag page, feed) are defined in [CONTEXT.md](https://github.com/chaoticgoodcomputing/blog/blob/main/quartz-v5/plugins/quartz-seo/CONTEXT.md).

## Develop

This package is the Nx project `quartz-seo`, in `quartz-v5/plugins/quartz-seo/`. Its manifest name is still `cgc-seo`. Its specs live in [`e2e/`](https://github.com/chaoticgoodcomputing/blog/tree/main/quartz-v5/plugins/quartz-seo/e2e) and run against the shared fixture site ([ADR-0004](https://github.com/chaoticgoodcomputing/blog/blob/main/docs/adr/0004-playwright-e2e-as-the-plugin-tdd-loop.md)):

```sh
pnpm nx run quartz-seo:e2e
pnpm nx run quartz-seo:typecheck
```
