---
title: quartz-annotator
tags:
  - projects/site/plugins
  - writing/annotations
---

`@chaoticgoodcomputing/quartz-annotator` is a [Quartz 5](https://quartz.jzhao.xyz) plugin that puts annotations written with Obsidian's
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

## The annotation page

An annotation page is its own page type, laid out in Quartz's `full-width` frame. Its body is the
**Viewer** beside the annotations:

- **The Viewer** draws the source document page by page, with every passage an annotation quotes
  highlighted. Choose an annotation and the document scrolls to its passage; choose a highlight and
  the annotation it belongs to is picked out. Drag the divider between them to give the document
  more or less of the width, and it's drawn again to fit. On a narrow screen the Viewer is left out,
  and the annotations take the page, under a line saying where to read along.
- **The annotations** are in the order their passages come in the document. Each shows the passage
  it quotes, the note written on it, its tags and its date.
- **The page header** (the page's title, date and tags) can open the annotations panel, beside the
  document, above where the document comes from. That takes a frame that hands it over (see
  *Laying out the page*). Otherwise it stays above the page.

The Viewer is built on [PDF.js](https://mozilla.github.io/pdf.js/), bundled into the plugin: your
site serves it, its worker and its decoders itself, and nothing is fetched from a CDN. PDF.js loads
only on a page with a Viewer, once the Viewer is on screen. It survives Quartz's page-to-page
navigation: leave while a document is loading and the load stops there.

**If the document can't be shown, the notes still can.** When there's no mirror to draw (see below),
or it fails to load, the Viewer says so and links to the source document to read along with, and the
annotations, each with the passage it quotes, take the width. The build carries on either way. A
reader without JavaScript, whose Viewer never loads, is told where to read along by the page itself.

Only PDFs are shown. A target that isn't a web URL builds its page with the Viewer's notice, and a
warning.

### Notes are rendered like your pages

The note on each annotation is markdown, and it's rendered through your site's own transformers, in
your site's order: wikilinks resolve, callouts and maths render, code is highlighted. What a note
links to counts as the page's links, so it shows up in backlinks and the graph, and what a note
says is searched with the page.

The transformers that act on a whole page rather than on a passage of it are left out: that's the
**denylist**, the `denylist` option. By default it names `NoteProperties`, `CreatedModifiedDate`,
`TableOfContents`, `Description`, `BasesTransformer`, `UnlistedPages` and `EncryptedPages`, by the
name each transformer carries, which isn't always its plugin's (`crawl-links` is `LinkProcessing`).
Setting `denylist` replaces the list, so to leave out one more, list the defaults too.

### Laying out the page

Annotation pages use the layout key `annotation`, so you can shape them under `layout.byPageType`:

```yaml
layout:
  byPageType:
    annotation:
      exclude:
        - "@chaoticgoodcomputing/quartz-page-source"
```

The `full-width` frame has no sidebars, so components you've placed `left` or `right` aren't on
annotation pages. To give them the default frame back, set `template: default` there, which narrows
the Viewer to the centre column. To keep the width and the components, name a frame a plugin
registers that places them elsewhere: this site's `site-full-width` (site-components) puts the
`left` ones above the page and the `right` ones after it.

The annotation page's body takes the page header, the components you've placed `beforeBody`, and
puts it at the top of the annotations panel, when the frame hands it over. The body's component
says it takes it with `takesPageHeader`. A frame that finds that flag on the page body draws the
`beforeBody` components as the body's children instead of above the page:

```tsx
render({ componentData, beforeBody, pageBody, ...rest }) {
  // QuartzComponent declares no `takesPageHeader`, so a typed frame reads it through a cast.
  const handedOver = (pageBody as { takesPageHeader?: unknown }).takesPageHeader === true
  const header = beforeBody.map((C) => <C {...componentData} />)
  return (
    <>
      {!handedOver && <div class="popover-hint">{header}</div>}
      {h(pageBody, componentData, handedOver ? header : undefined)}
      {/* ... */}
    </>
  )
}
```

`site-full-width` does this. Quartz's own frames don't, so under them the header stays above the
page.

## Mirrors

Most hosts don't let another site's scripts read their PDFs, so the plugin serves its own copy of
each source document: its **mirror**. At build time it fetches the document at each annotation
page's `annotation-target` and emits it at `/<mirrorDir>/<name>`, where the name is a hash of the
URL, with no extension. Several pages annotating one document share one mirror. The Viewer finds it
there, and nothing links to it.

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

The plugin is the npm package `@chaoticgoodcomputing/quartz-annotator`, built, with its type declarations, and loaded by name, as Quartz's own `@quartz-community/*` plugins are. Install it into your Quartz site:

```sh
npm install @chaoticgoodcomputing/quartz-annotator
```

and list it in `quartz.config.yaml` by its package name, `source: "@chaoticgoodcomputing/quartz-annotator"`. Its peers, Preact and Quartz's own packages, are your site's own copies, so a page has one Preact. The package isn't on npm yet: it is published after this site moves to Quartz 5 ([#90](https://github.com/chaoticgoodcomputing/blog/issues/90)).

Its options go in that entry:

```yaml
    options:
      mirrorDir: mirrors
```

It needs [`quartz-styles`](https://github.com/chaoticgoodcomputing/blog/blob/main/quartz-v5/plugins/quartz-styles/README.md)
too, which ranks its stylesheet among your theme's. The build refuses to start without it.

Keep its `order` above `crawl-links`' and `description`'s (60 and 70 by default). Its default, 75,
does: the notes' links and text are added to the page's once those two have set them. The Viewer's
worker is a `.js` file under `/static/cgc-annotator/`, and a host has to serve it as JavaScript, as
every static host does.

## Options

| Option | Default | What it does |
| --- | --- | --- |
| `mirrorDir` | `mirrors` | Where mirrors are served from, relative to the site root. Disallow it in `robots.txt`. |
| `cacheDir` | `node_modules/.cache/cgc-annotator` | Where source documents are pinned between builds: relative to your Quartz root, or absolute. Keep it out of git. |
| `fetchTimeout` | `60000` | How long to wait for a source document, in milliseconds, before building without it. |
| `denylist` | the whole-page transformers above | Transformers a note is rendered without, by transformer name. Replaces the default list. |

## More

- [The vocabulary this plugin uses](https://github.com/chaoticgoodcomputing/blog/blob/main/quartz-v5/plugins/quartz-annotator/CONTEXT.md)
- [Why mirrors are pinned, and why a missing one never fails the build](https://github.com/chaoticgoodcomputing/blog/blob/main/quartz-v5/plugins/quartz-annotator/docs/adr/0001-mirrors-are-pinned-and-a-missing-one-degrades.md)
- [How a note joins its page](https://github.com/chaoticgoodcomputing/blog/blob/main/quartz-v5/plugins/quartz-annotator/docs/adr/0002-notes-join-their-page.md)
- [Why the page header joins the annotations, and how a frame hands it over](https://github.com/chaoticgoodcomputing/blog/blob/main/quartz-v5/plugins/quartz-annotator/docs/adr/0003-the-page-header-joins-the-annotations.md)
