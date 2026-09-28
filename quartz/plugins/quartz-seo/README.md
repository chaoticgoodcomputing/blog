---
title: Quartz SEO Customizations
tags:
  - projects/site/plugins
  - engineering/languages/typescript
  - engineering/frontend
  - engineering/data
description: A Quartz 5 plugin for additional SEO optimization options
date: 2026-09-27
---
Controls what search engines and feed readers see of a site:

- Keeps **private pages** (and their tags' pages) out of search with `noindex`, out of the sitemap and out of the RSS feed, while leaving them on the site.
- Adds a canonical URL to every page, and OpenGraph `article:*` metadata and JSON-LD to every article.
- Writes `sitemap.xml`, tag pages included, and the RSS feed, `index.xml`.

## Installation

```bash
npm install @chaoticgoodcomputing/quartz-seo
```

## Usage

Turn off `content-index`'s own sitemap and feed, which write to the same files:

```yaml title="quartz.config.yaml"
plugins:
  - source: "@quartz-community/content-index"
    enabled: true
    options:
      enableSiteMap: false
      enableRSS: false
  - source: "@chaoticgoodcomputing/quartz-seo"
    enabled: true
    options:
      noindexTags: [private]
      defaultAuthor:
        type: Person
        name: Spencer Elkington
        url: https://blog.chaoticgood.computer/about
      articleTypes:
        - { tag: writing/tutorials, type: HowTo, section: Tutorials }
        - { tag: engineering, type: TechArticle, section: Engineering }
      rssLimit: 40
```

Without a `baseUrl`, only the `noindex` tags are added. A page can override the author with `author:` in its frontmatter.

## Configuration

| Option                | Type                            | Default                | Description                                                                    |
| --------------------- | ------------------------------- | ---------------------- | ------------------------------------------------------------------------------ |
| `noindexTags`         | `string[]`                      | `["private"]`          | Tags that make a page private, along with their subtags.                       |
| `defaultAuthor`       | `string \| { name, url, type }` | the site               | The author for pages that name none.                                           |
| `publisher`           | `{ name, url, type, logo }`     | `defaultAuthor`        | The JSON-LD publisher.                                                         |
| `articleFolders`      | `string[]`                      | every note             | Limit articles, and so the feed, to these folders.                             |
| `articleTypes`        | `{ tag, type, section }[]`      | none                   | The first entry whose tag a page carries sets its JSON-LD `@type` and section. |
| `defaultArticleType`  | `string`                        | `"Article"`            | The JSON-LD `@type` when no `articleTypes` entry matches.                      |
| `enableSiteMap`       | `boolean`                       | `true`                 | Write `sitemap.xml`.                                                           |
| `enableRSS`           | `boolean`                       | `true`                 | Write `index.xml` and link it from every page.                                 |
| `rssLimit`            | `number`                        | `10`                   | The most articles in the feed. `0` for all.                                    |
| `rssLastFewNotesText` | `string`                        | `"Last {count} notes"` | The feed's description when it has a limit.                                    |
| `rssRecentNotesText`  | `string`                        | `"Recent notes"`       | The feed's description when `rssLimit` is `0`.                                 |

## License

MIT
