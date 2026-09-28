---
title: Quartz Page Source Button
tags:
  - projects/site/plugins
  - engineering/languages/typescript
  - engineering/frontend
date: 2026-09-27
description: A small Quartz 5 plugin for viewing GitHub source code for site pages.
---
Adds a "View source on GitHub" link to each page, pointing at the file the page was built from. Symlinked pages link to their target, and pages Quartz generates get no link.

## Installation

```bash
npm install @chaoticgoodcomputing/quartz-page-source
```

Requires [[public/plugins/quartz-styles|Quartz Styles]]

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

## License

MIT
