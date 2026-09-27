---
title: quartz-email-subscribe
tags:
  - projects/site/plugins
---

`@chaoticgoodcomputing/quartz-email-subscribe` is a [Quartz 5](https://quartz.jzhao.xyz/) plugin that adds a newsletter subscribe box to your pages. The box posts the reader's address to [Buttondown](https://buttondown.com/).

It is the `EmailSubscribe` component from this site's Quartz 4 days, carried over as a plugin.

## What it renders

A heading, then a bordered panel with a line of text, an email field and a Subscribe button. It goes after the page body by default:

```html
<div class="cgc-email-subscribe">
  <h3 class="cgc-email-subscribe__title">Newsletter</h3>
  <div class="cgc-email-subscribe__panel">
    <p class="cgc-email-subscribe__description">Weekly updates about any new notes!</p>
    <form class="cgc-email-subscribe__form" action="https://buttondown.com/api/emails/embed-subscribe/<username>" method="post">
      <input class="cgc-email-subscribe__input" type="email" name="email" placeholder="you@youmail.com" required />
      <input class="cgc-email-subscribe__submit" type="submit" value="Subscribe" />
    </form>
  </div>
</div>
```

The form is a plain HTML form and needs no JavaScript. Submitting it takes the reader to Buttondown's confirmation page, and the browser won't submit an empty address.

## Install

The plugin is the npm package `@chaoticgoodcomputing/quartz-email-subscribe`, built, with its type declarations, and loaded by name, as Quartz's own `@quartz-community/*` plugins are. It needs [quartz-styles](https://blog.chaoticgood.computer/plugins/quartz-styles). Install it into your Quartz site:

```sh
npm install @chaoticgoodcomputing/quartz-email-subscribe
```

and list it in `quartz.config.yaml` by its package name, `source: "@chaoticgoodcomputing/quartz-email-subscribe"`. Its peers, Preact and Quartz's own packages, are your site's own copies, so a page has one Preact. The package isn't on npm yet: it is published after this site moves to Quartz 5 ([#90](https://github.com/chaoticgoodcomputing/blog/issues/90)).

Then set `buttondownUsername` in `quartz.config.yaml`. The build fails until it is set, so that the box never posts to someone else's newsletter.

## Configure

```yaml
plugins:
  - source: "@chaoticgoodcomputing/quartz-email-subscribe"
    enabled: true
    options:
      buttondownUsername: <your Buttondown username>
      title: Subscribe for more!
      description: Be notified weekly about any fresh notes or articles!
    layout:
      position: afterBody
      priority: 20
```

| Option | Default | |
| --- | --- | --- |
| `buttondownUsername` | none, required | Your Buttondown newsletter's username. The form posts to its embed-subscribe endpoint. |
| `title` | `Newsletter` | The heading above the box. Set it to `""` to leave the heading out. |
| `description` | `Weekly updates about any new notes!` | The line inside the box, above the field. Set it to `""` to leave it out. |

The box can go in any layout position, such as `right` for the sidebar. To keep it off one page type, exclude the plugin there: for example, `layout.byPageType.404.exclude: ["@chaoticgoodcomputing/quartz-email-subscribe"]`.

Quartz places one component per plugin entry. To show the box in two places, such as after the body of a note and in the sidebar of a tag page, list the plugin again with an object source that gives the second entry a name of its own. Quartz imports a package listed that way by its `name`, so install the package a second time under that name, as an npm alias:

```sh
npm install email-subscribe-sidebar@npm:@chaoticgoodcomputing/quartz-email-subscribe
```

Each entry takes its own options and layout, and `byPageType` excludes each one by its name:

```yaml
plugins:
  - source:
      repo: "@chaoticgoodcomputing/quartz-email-subscribe"
      name: email-subscribe-sidebar
    enabled: true
    options:
      buttondownUsername: <your Buttondown username>
    layout:
      position: right
      priority: 30
layout:
  byPageType:
    content:
      exclude: [email-subscribe-sidebar]
    tag:
      exclude: ["@chaoticgoodcomputing/quartz-email-subscribe"]
```

Each entry links the plugin's stylesheet, so a page with both links the same file twice. The rules are the same, so nothing changes.

## Styling

The CSS is library CSS, following [ADR-0003](https://github.com/chaoticgoodcomputing/blog/blob/main/docs/adr/0003-library-css-in-plugins-application-css-at-the-site.md):

- **Classes:** one BEM block, `.cgc-email-subscribe`, with the elements `__title`, `__panel`, `__description`, `__form`, `__input` and `__submit`. Every selector is a single class, or a single class with a pseudo-class, so one class of your own overrides any of them.
- **The heading:** the plugin doesn't style it, so it looks like the site's other `h3`s.
- **Cascade layer:** the rules sit in the `cgc.email-subscribe` layer. That is above Quartz's own styles and themes, and below any unlayered site CSS.
- **Colours:** all from the theme's properties: `--light`, `--lightgray`, `--gray`, `--dark` and `--secondary`. So it follows the colour scheme and any theme.

The build checks the stylesheet with `@chaoticgoodcomputing/css-check` and fails if a selector reaches outside the block, if it defines a custom property or other name outside the block, or if it sets a colour literal or a font family other than one of the theme's four, such as `var(--bodyFont)`.

## Develop

This package is the Nx project `quartz-email-subscribe`, in `quartz-v5/plugins/quartz-email-subscribe/`. Its manifest name is still `cgc-email-subscribe`, which names its CSS block and family layer, so its class names are the ones above. Its specs live in [`e2e/`](https://github.com/chaoticgoodcomputing/blog/tree/main/quartz-v5/plugins/quartz-email-subscribe/e2e) and run against the shared fixture site ([ADR-0004](https://github.com/chaoticgoodcomputing/blog/blob/main/docs/adr/0004-playwright-e2e-as-the-plugin-tdd-loop.md)). No request ever reaches Buttondown:

```sh
pnpm nx run quartz-email-subscribe:e2e
pnpm nx run quartz-email-subscribe:typecheck
```
