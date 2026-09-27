---
title: quartz-page-source
tags:
  - projects/site/plugins
---

Adds a "View source on GitHub" link to each page, pointing at the file the page was built from. Symlinked pages link to their target, and pages Quartz generates get no link.

## Installation

```bash
npm install @chaoticgoodcomputing/quartz-page-source
```

Requires [quartz-styles](https://blog.chaoticgood.computer/plugins/quartz-styles).

## Usage

```yaml title="quartz.config.yaml"
plugins:
  - source: "@chaoticgoodcomputing/quartz-page-source"
    enabled: true
    options:
      repoUrl: https://github.com/<owner>/<repo>/blob/<branch>
      contentPath: content
    layout:
      position: afterBody
      priority: 30
```

## Configuration

| Option        | Type     | Default                   | Description                                                                                 |
| ------------- | -------- | ------------------------- | ------------------------------------------------------------------------------------------- |
| `repoUrl`     | `string` | required                  | Where the repository's files can be browsed, up to the branch. The build fails without it.  |
| `contentPath` | `string` | `"content"`               | The content folder's path from the repository root. `""` if `repoUrl` already points there. |
| `linkText`    | `string` | `"View source on GitHub"` | The link's text.                                                                            |

## Documentation

See [CONTEXT.md](https://github.com/chaoticgoodcomputing/blog/blob/main/quartz/plugins/quartz-page-source/CONTEXT.md).

## License

MIT
