---
title: Quartz Social Cards
tags:
  - projects/site/plugins
  - engineering/languages/typescript
  - engineering/frontend
description: Odds-and-ends social media cards for Quartz 5 sites
date: 2026-09-27
---
Adds two social cards: Bluesky and GitHub. See [[/index|the homepage]] for examples.

![[public/assets/Pasted image 20260927204202.png]]

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


A site with a Content Security Policy must allow `api.github.com`, `github-contributions-api.jogruber.de` and `public.api.bsky.app` in `connect-src`, and `avatars.githubusercontent.com` and `cdn.bsky.app` in `img-src`.

## Configuration

| Option                | Type                | Default                  | Description                                                                 |
| --------------------- | ------------------- | ------------------------ | --------------------------------------------------------------------------- |
| `showOn`              | `string[] \| false` | `["index"]`              | Slugs that get the cards. `false` for every page the layout places them on. |
| `github.username`     | `string`            | required                 | The GitHub user to show. Leave out `github` for no GitHub card.             |
| `github.title`        | `string \| false`   | `"GitHub Contributions"` | The card's heading.                                                         |
| `github.showProfile`  | `boolean`           | `true`                   | Show the avatar, name and bio.                                              |
| `github.showHeader`   | `boolean`           | `true`                   | Show the year's total.                                                      |
| `github.levelColors`  | `string[]`          | from the theme           | The calendar's five colors, from no contributions to the busiest.           |
| `bluesky.handle`      | `string`            | required                 | The Bluesky account to show. Leave out `bluesky` for no Bluesky card.       |
| `bluesky.postLimit`   | `number`            | `5`                      | How many posts to show, 1–100.                                              |
| `bluesky.title`       | `string \| false`   | `"Bluesky Feed"`         | The card's heading.                                                         |
| `bluesky.showMetrics` | `boolean`           | `true`                   | Show reply, repost and like counts.                                         |

## License

MIT
