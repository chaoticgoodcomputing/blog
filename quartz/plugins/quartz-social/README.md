---
title: quartz-social
tags:
  - projects/site/plugins
  - engineering/frontend
---

Shows two sidebar cards: a GitHub user's contribution calendar and a Bluesky account's latest posts. The reader's browser fetches both on page load, so the build never touches the network and the cards are always current.

## Installation

```bash
npm install @chaoticgoodcomputing/quartz-social
```

Requires [quartz-styles](https://blog.chaoticgood.computer/plugins/quartz-styles).

## Usage

```yaml title="quartz.config.yaml"
plugins:
  - source: "@chaoticgoodcomputing/quartz-social"
    enabled: true
    options:
      github:
        username: spelkington
        title: GitHub Activity
      bluesky:
        handle: speen.us
        postLimit: 5
        showMetrics: false
    layout:
      position: right
      priority: 40
      display: desktop-only
```

Configure at least one card; the build fails otherwise. Quartz 5 has no `is-index` layout condition, so the cards render only on the slugs in `showOn`.

A site with a Content Security Policy must allow `api.github.com`, `github-contributions-api.jogruber.de` and `public.api.bsky.app` in `connect-src`, and `avatars.githubusercontent.com` and `cdn.bsky.app` in `img-src`.

## Configuration

| Option                | Type                | Default                  | Description                                                                 |
| --------------------- | ------------------- | ------------------------ | --------------------------------------------------------------------------- |
| `showOn`              | `string[] \| false` | `["index"]`              | Slugs that get the cards. `false` for every page the layout places them on. |
| `github.username`     | `string`            | required                 | The GitHub user to show. Leave out `github` for no GitHub card.             |
| `github.title`        | `string \| false`   | `"GitHub Contributions"` | The card's heading.                                                         |
| `github.showProfile`  | `boolean`           | `true`                   | Show the avatar, name and bio.                                              |
| `github.showHeader`   | `boolean`           | `true`                   | Show the year's total.                                                      |
| `github.levelColors`  | `string[]`          | from the theme           | The calendar's five colours, from no contributions to the busiest.          |
| `bluesky.handle`      | `string`            | required                 | The Bluesky account to show. Leave out `bluesky` for no Bluesky card.       |
| `bluesky.postLimit`   | `number`            | `5`                      | How many posts to show, 1–100.                                              |
| `bluesky.title`       | `string \| false`   | `"Bluesky Feed"`         | The card's heading.                                                         |
| `bluesky.showMetrics` | `boolean`           | `true`                   | Show reply, repost and like counts.                                         |

## Documentation

See [CONTEXT.md](https://github.com/chaoticgoodcomputing/blog/blob/main/quartz/plugins/quartz-social/CONTEXT.md) and the [decision records](https://github.com/chaoticgoodcomputing/blog/tree/main/quartz/plugins/quartz-social/docs/adr).

## License

MIT
