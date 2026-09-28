---
title: Quartz Buttondown Subscriptions
tags:
  - projects/site/plugins
  - engineering/languages/typescript
  - engineering/frontend
date: 2026-09-27
description: Installation & configuration for a Quartz 5 plugin offering Buttondown Subscription integration.
---

Adds a newsletter subscribe box that posts the reader's address to [Buttondown](https://buttondown.com/). It's a plain HTML form, so it works without any additional JS.

## Installation

```bash
npm install @chaoticgoodcomputing/quartz-email-subscribe
```

Requires [[/plugins/quartz-styles|Quartz Styles]]

## Usage

```yaml title="quartz.config.yaml"
plugins:
  - source: "@chaoticgoodcomputing/quartz-email-subscribe"
    enabled: true
    options:
      buttondownUsername: <your Buttondown username>
      title: Subscribe for more!
    layout:
      position: afterBody
      priority: 20
```

## Configuration

| Option               | Type     | Default                                 | Description                                                        |
| -------------------- | -------- | --------------------------------------- | ------------------------------------------------------------------ |
| `buttondownUsername` | `string` | required                                | Your Buttondown newsletter's username. The build fails without it. |
| `title`              | `string` | `"Newsletter"`                          | The heading above the box. `""` for none.                          |
| `description`        | `string` | `"Weekly updates about any new notes!"` | The line above the email field. `""` for none.                     |

## License

MIT
