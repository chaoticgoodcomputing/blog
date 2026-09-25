---
title: cgc-annotator
tags:
  - projects/site
  - writing/annotations
---

A [Quartz 5](https://quartz.jzhao.xyz) plugin that puts annotations written with Obsidian's
[Annotator](https://github.com/elias-sundqvist/obsidian-annotator) plugin on your site. Annotator
writes the annotations in your vault; `cgc-annotator` shows them, next to the document they were
written against.

An **annotation page** is a note whose frontmatter names that document, its **source document**, by
URL:

```yaml
---
title: Programming as theory building
annotation-target: https://pablo.rauzy.name/dev/naur1985programming.pdf
---
```

A note whose `annotation-target` is empty is an ordinary note.

> [!NOTE]
> This release mirrors source documents into your site. The annotation page itself, with the
> viewer that shows a mirror alongside its highlights, is still being built.

## Mirrors

Most hosts don't let another site's scripts read their PDFs, so the plugin serves its own copy of
each source document: its **mirror**. At build time it fetches the document at each annotation
page's `annotation-target` and emits it at `/<mirrorDir>/<name>`, where the name is a hash of the
URL, with no extension. Several pages annotating one document share one mirror.

**A mirror is pinned on first fetch.** Your annotations are anchored to text in one particular file,
so the first copy fetched is the one the site keeps serving, even if the document at the URL
changes. After that first fetch, a build never contacts the host again. The copy lives in the cache
(`cacheDir`), so keep that directory between builds, in CI too (for example with
`actions/cache`). To refresh a mirror, delete its file from the cache.

**A document that can't be fetched never fails the build.** The build logs a warning naming the URL
and the pages that annotate it, and carries on without that mirror. Nothing is pinned, so the next
build tries again. Some hosts refuse to hand a document to a build machine at all. For those, the
warning says where to save a copy you downloaded yourself, and that copy is then pinned like a
fetched one.

Only PDFs are mirrored. A URL that answers with something else (a login page or a bot check, say)
gets a warning, and nothing is pinned.

## Keep mirrors out of search

Mirrors are other people's documents, served from your site. Add their directory to your site's
`robots.txt` so search engines don't index them as your content:

```
User-agent: *
Disallow: /mirrors/
```

Use your own `mirrorDir` if you've changed it. A `Disallow` stops crawlers fetching the mirrors, but
a search engine may still list a mirror's URL, without its content, if something links to it. The
plugin never links to mirrors. An `X-Robots-Tag: noindex` response header would go further, if
your host lets you set one.

## Install

```sh
npx quartz plugin add git+https://github.com/chaoticgoodcomputing/blog.git#v<x.y.z> --subdir quartz-v5/plugins/cgc-annotator --name cgc-annotator
```

Pin a release tag as the ref. `plugin add` adds the plugin's entry to `quartz.config.yaml`, where
you set its options:

```yaml
    options:
      mirrorDir: mirrors
```

## Options

| Option | Default | What it does |
| --- | --- | --- |
| `mirrorDir` | `mirrors` | Where mirrors are served from, relative to the site root. Disallow it in `robots.txt`. |
| `cacheDir` | `node_modules/.cache/cgc-annotator` | Where source documents are pinned between builds: relative to your Quartz root, or absolute. Keep it out of git. |
| `fetchTimeout` | `60000` | How long to wait for a source document, in milliseconds, before building without it. |

## More

- [The vocabulary this plugin uses](https://github.com/chaoticgoodcomputing/blog/blob/main/quartz-v5/plugins/cgc-annotator/CONTEXT.md)
- [Why mirrors are pinned, and why a missing one never fails the build](https://github.com/chaoticgoodcomputing/blog/blob/main/quartz-v5/plugins/cgc-annotator/docs/adr/0001-mirrors-are-pinned-and-a-missing-one-degrades.md)
