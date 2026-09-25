---
title: cgc-tag-page
tags:
  - projects/site
  - engineering/frontend
---

`cgc-tag-page` makes the tag pages of a [Quartz 5](https://quartz.jzhao.xyz/) site show the tag's description, and nothing else. It runs stock [`tag-page`](https://github.com/quartz-community/tag-page), which decides which tags get a page, and replaces only what the page shows under its title.

It is the tag page from this site's Quartz 4 days, carried over as a plugin. On this site, the list of a tag's posts comes from a plugin of its own, placed in the tag page's layout.

## What a tag page shows

Stock `tag-page` gives every tag a page at `/tags/<tag>`: each tag a page carries, and each of its ancestors. A tag with a description file gets that file's page instead of a made-up one. This plugin keeps all of that. It also keeps stock's page at `/tags`, but that page no longer lists every tag: like any tag page, it shows only its own description (a `tags/index.md`, if there is one).

It adds one thing to them. Stock counts only the Markdown pages Quartz parses, so a tag that only `.mdx` pages carry gets no page. Here, tags on pages that another page type makes, such as [cgc-mdx](https://blog.chaoticgood.computer/plugins/cgc-mdx)'s, get tag pages too. That page type has to outrank `tag-page`'s priority of 10, as cgc-mdx's 25 does.

The main change is the page's body. Stock shows the description, then a count and a list of the tag's pages. This plugin shows the description alone:

```html
<div class="popover-hint">
  <article class="cgc-tag-page">
    <div class="markdown-preview-view markdown-rendered">
      <!-- the description file, rendered like any other page -->
    </div>
  </article>
</div>
```

- **A tag with a description file** shows the file's text, through the same Markdown pipeline as every other page, so links, callouts and math work as they do anywhere else. Its title is the file's.
- **A tag with none** gets a page with an empty article. Its title is the tag, or `Tag: <tag>` with `prefixTags` on.
- **Page previews** of a tag page show its description, since the article sits in the part of the page Quartz's preview copies.

Anything else a tag page needs goes in its layout, `layout.byPageType.tag`, as on any other page.

## Description files

A tag's description file sits where its page does: the description of `engineering` is `tags/engineering.md`, and the description of `engineering/ai` is `tags/engineering/ai.md`.

> [!WARNING]
> **Not `tags/<tag>/index.md`.** Stock `tag-page` looks for a description at `tags/<tag>` only. A file at `tags/engineering/index.md` gets a page of its own, at `/tags/engineering/`, and the tag gets a second, made-up page at `/tags/engineering`. Move such files to `tags/<tag>.md`.

Nested description files put Markdown files in folders under `tags/`, and stock [`folder-page`](https://github.com/quartz-community/folder-page) makes a page for every folder: `tags/engineering/ai.md` would give `/tags/engineering/` a folder page beside the tag's own. Disable `folder-page` if your site doesn't use folder pages.

## Install

Plugins in this family ship as source from [the blog's monorepo](https://github.com/chaoticgoodcomputing/blog), and a site pins a release tag:

```sh
npx quartz plugin add git+https://github.com/chaoticgoodcomputing/blog.git#v<x.y.z> --subdir quartz-v5/plugins/cgc-tag-page --name cgc-tag-page
```

Keep `--name`: without it, a plugin installed from a subdirectory is named after the repository, and every plugin in the family would install over the last.

Then disable stock `tag-page`. This plugin runs stock's code, so leave it installed. With both enabled, the build fails, because every tag would get its page twice.

```yaml title="quartz.config.yaml"
plugins:
  - source: "@quartz-community/tag-page"
    enabled: false
  - source:
      repo: git+https://github.com/chaoticgoodcomputing/blog.git#v<x.y.z>
      name: cgc-tag-page
      subdir: quartz-v5/plugins/cgc-tag-page
    enabled: true
    options:
      prefixTags: true
```

It needs no other plugin from the family, and it runs on a stock copy of Quartz.

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `prefixTags` | `boolean` | `false` | Title a tag with no description file `Tag: <tag>` rather than `<tag>`. Stock's option. |

Stock's `numPages` and `sort` configure the lists this plugin drops, so it doesn't take them.

## Styling

The plugin ships no CSS: the description is styled as any page's article is. To style tag pages alone, select `.cgc-tag-page` in your own CSS.

## More

- [`CONTEXT.md`](https://github.com/chaoticgoodcomputing/blog/blob/main/quartz-v5/plugins/cgc-tag-page/CONTEXT.md) defines the plugin's terms.
- [ADR-0001](https://github.com/chaoticgoodcomputing/blog/blob/main/quartz-v5/plugins/cgc-tag-page/docs/adr/0001-stock-tag-page-with-its-body-replaced.md) explains why it replaces stock `tag-page` rather than filling its layout.
- The specs are in [`e2e/`](https://github.com/chaoticgoodcomputing/blog/tree/main/quartz-v5/plugins/cgc-tag-page/e2e). This package is the Nx project `cgc-tag-page`: `pnpm nx run cgc-tag-page:e2e`.
