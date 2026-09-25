---
title: cgc-seo
tags:
  - projects/site
  - engineering/languages/typescript
---

`cgc-seo` is a [Quartz 5](https://quartz.jzhao.xyz) plugin for what search engines see of a site. It keeps **private pages** out of search results while leaving them on the site, and it gives every page a canonical URL and every article its `article:*` metadata and JSON-LD.

It started as the SEO half of this site's Quartz 4 fork, and it runs on a stock copy of Quartz 5.

## What it does

It adds these to each page's `<head>`, through Quartz's per-page `additionalHead`:

- **`<meta name="robots" content="noindex">` on private pages.** A page is private when it carries one of the `noindexTags`, or a descendant of one. `private/work` is a descendant of `private`, but `privateer` isn't. That tag's own listing page, `/tags/private`, is private too. There's no `nofollow`, so a private page's links to public pages still count.
- **`<link rel="canonical">` on every page:** the page's URL at the site's `baseUrl`, without a trailing `index`.
- **OpenGraph article metadata on articles:** `article:published_time`, `article:modified_time`, `article:author`, `article:section` (the first tag's top segment) and one `article:tag` per tag (its last segment).
- **A JSON-LD article on articles:** its `@type` and `articleSection` come from the page's tags, and its author, publisher, image, dates, description and keywords from the page and your options.

A private page is still listed everywhere on the site: search, the graph, the explorer and backlinks. Stock Quartz's `unlisted: true` is a different, stronger state. It also hides the page from all of those.

Articles are the pages built from a note of their own, optionally limited to some folders. Tag listings and the 404 page are never articles.

## Install

```shell
npx quartz plugin add git+https://github.com/chaoticgoodcomputing/blog.git#v<version> --subdir quartz-v5/plugins/cgc-seo --name cgc-seo
```

Releases are `v<semver>` tags on [the monorepo](https://github.com/chaoticgoodcomputing/blog). Every package there shares one version.

## Options

| Option | Default | What it does |
| --- | --- | --- |
| `noindexTags` | `[private]` | Tags that make a page private, together with their descendants. |
| `defaultAuthor` | the site, as an Organization named by `pageTitle` | Credited on every page whose frontmatter names no `author`. A name, or `{ name, url, type }`, where `type` is `Person` (the default) or `Organization`. |
| `publisher` | `defaultAuthor` | The JSON-LD publisher, `{ name, url, type, logo }`. An Organization gets a logo: `logo.url` defaults to the site icon, `static/icon.png`, and `logo.width` and `logo.height` are optional. |
| `articleFolders` | every note | Limits articles to the notes in these folders. |
| `articleTypes` | none | `{ tag, type, section }` entries. The first entry whose tag the page carries sets the JSON-LD `@type` and `articleSection`. |
| `defaultArticleType` | `Article` | The JSON-LD `@type` when no `articleTypes` entry matches. |

`article:author` is the author's `url` when there is one, and otherwise the name.

A page names its own author in frontmatter, overriding `defaultAuthor`:

```yaml
---
title: A guest post
author: Ada Lovelace # or a list, or { name, url, type }
---
```

The meta description's length isn't set here. It comes from the stock `description` plugin's `descriptionLength` option.

Without a `baseUrl`, the plugin can't build absolute URLs, so it adds only the `noindex` tag.

## Example

This is how [chaoticgood.computer](https://chaoticgood.computer) configures it:

```yaml
- source:
    repo: https://github.com/chaoticgoodcomputing/blog.git
    ref: v<version>
    subdir: quartz-v5/plugins/cgc-seo
    name: cgc-seo
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
```

## Notes

- The JSON-LD image is the page's own OpenGraph image. That's its `socialImage` frontmatter if it has one, then the card that stock `og-image` generates when that plugin is on, and otherwise `static/og-image.png`.
- The plugin is an emitter that writes no files yet. The sitemap and RSS feed will move here, leaving out private pages.
- The terms used here (private page, unlisted page, page author) are defined in [CONTEXT.md](https://github.com/chaoticgoodcomputing/blog/blob/main/quartz-v5/plugins/cgc-seo/CONTEXT.md).
