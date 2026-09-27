---
title: quartz-page-source
tags:
  - projects/site/plugins
---

`@chaoticgoodcomputing/quartz-page-source` is a [Quartz 5](https://quartz.jzhao.xyz/) plugin that puts a "View source on GitHub" link on each page, pointing at the file the page was built from.

It is the `ShowPageSource` component from this site's Quartz 4 days, carried over as a plugin.

## What it renders

A bordered link with the GitHub mark, after the page body by default:

```html
<div class="cgc-page-source">
  <a class="cgc-page-source__link" href="https://github.com/<owner>/<repo>/blob/<branch>/content/notes/my-note.md" target="_blank" rel="noopener noreferrer">
    <svg class="cgc-page-source__icon" aria-hidden="true">…</svg>
    View source on GitHub
  </a>
</div>
```

- The link is `repoUrl`, then `contentPath`, then the page's path inside the content folder.
- A page whose file is a symlink links to the file the symlink points at, if that file is in the same repository. This site's plugin notes, like this one, are READMEs linked into the vault, so their links go to the README.
- Pages that Quartz makes up rather than reads from a file get no link. That includes the 404 page and a tag page with no description file.

## Install

The plugin is the npm package `@chaoticgoodcomputing/quartz-page-source`, built, with its type declarations, and loaded by name, as Quartz's own `@quartz-community/*` plugins are. It needs [cgc-styles](https://blog.chaoticgood.computer/plugins/cgc-styles). Install it into your Quartz site:

```sh
npm install @chaoticgoodcomputing/quartz-page-source
```

and list it in `quartz.config.yaml` by its package name, `source: "@chaoticgoodcomputing/quartz-page-source"`. Its peers, Preact and Quartz's own packages, are your site's own copies, so a page has one Preact. The package isn't on npm yet: it is published after this site moves to Quartz 5 ([#90](https://github.com/chaoticgoodcomputing/blog/issues/90)).

> [!WARNING]
> **Depending on `cgc-styles` by name needs a change to Quartz.** Stock Quartz matches a dependency only against the exact `source:` string. Matching by plugin name is a small change to its loader, carried in this repository's copy of Quartz and proposed upstream on [chaoticgoodcomputing/blog#47](https://github.com/chaoticgoodcomputing/blog/issues/47). Until it lands, this plugin builds only against that copy.

Then set `repoUrl` in `quartz.config.yaml`. The build fails until it is set.

## Configure

```yaml
plugins:
  - source: "@chaoticgoodcomputing/quartz-page-source"
    enabled: true
    options:
      repoUrl: https://github.com/<owner>/<repo>/blob/<branch>
      contentPath: content
    layout:
      position: afterBody
      priority: 30
      condition: not-index # optional: this site leaves it off the home page
```

| Option | Default | |
| --- | --- | --- |
| `repoUrl` | none, required | Where the repository's files can be browsed, up to the branch. For GitHub that's `https://github.com/<owner>/<repo>/blob/<branch>`. Trailing slashes are ignored. |
| `contentPath` | `content` | The content folder's path from the repository root. Set it to `""` if `repoUrl` already reaches the content folder. |
| `linkText` | `View source on GitHub` | The link's text. The plugin carries this text for `en-US` only, and every other locale falls back to it. |

To keep the link off one page type, exclude the plugin there: for example, `layout.byPageType.tag.exclude: ["@chaoticgoodcomputing/quartz-page-source"]`.

## Styling

The CSS is library CSS, following [ADR-0003](https://github.com/chaoticgoodcomputing/blog/blob/main/docs/adr/0003-library-css-in-plugins-application-css-at-the-site.md):

- **Classes:** one BEM block, `.cgc-page-source`, with the elements `__link` and `__icon`. Every selector is a single class, or a single class with `:hover`, so one class of your own overrides any of them.
- **Cascade layer:** the rules sit in the `cgc.page-source` layer. That is above Quartz's own styles and themes, and below any unlayered site CSS.
- **Colours:** all from the theme's properties: `--light`, `--lightgray`, `--darkgray`, `--dark` and `--secondary`. So it follows the colour scheme and any theme.

The build checks the stylesheet with `@chaoticgoodcomputing/css-check` and fails if a selector reaches outside the block, if it defines a custom property or other name outside the block, or if it sets a colour literal or a font family other than one of the theme's four, such as `var(--bodyFont)`.

## Develop

This package is the Nx project `quartz-page-source`, in `quartz-v5/plugins/quartz-page-source/`. Its manifest name is still `cgc-page-source`, which names its CSS block and family layer, so its class names are the ones above. Its specs live in [`e2e/`](https://github.com/chaoticgoodcomputing/blog/tree/main/quartz-v5/plugins/quartz-page-source/e2e) and run against the shared fixture site ([ADR-0004](https://github.com/chaoticgoodcomputing/blog/blob/main/docs/adr/0004-playwright-e2e-as-the-plugin-tdd-loop.md)):

```sh
pnpm nx run quartz-page-source:e2e
pnpm nx run quartz-page-source:typecheck
```
