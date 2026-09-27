---
title: quartz-email-subscribe
tags:
  - projects/site/plugins
---

Adds a newsletter subscribe box that posts the reader's address to [Buttondown](https://buttondown.com/). It's a plain HTML form, so it works without JavaScript.

## Installation

```bash
npm install @chaoticgoodcomputing/quartz-email-subscribe
```

Requires [quartz-styles](https://blog.chaoticgood.computer/plugins/quartz-styles).

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

## Documentation

See [CONTEXT.md](https://github.com/chaoticgoodcomputing/blog/blob/main/quartz/plugins/quartz-email-subscribe/CONTEXT.md).

## License

MIT
