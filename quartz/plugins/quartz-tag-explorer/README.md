---
title: quartz-tag-explorer
tags:
  - projects/site/plugins
  - engineering/frontend
---

Lets readers browse a site by tag: a tree of tags in the sidebar, each with its icon and colour, and under each tag the pages that carry it. On narrow screens it becomes a drawer opened from the window's left edge.

## Installation

```bash
npm install @chaoticgoodcomputing/quartz-tag-explorer
```

Requires [quartz-tags](https://blog.chaoticgood.computer/plugins/quartz-tags) and [quartz-styles](https://blog.chaoticgood.computer/plugins/quartz-styles).

## Usage

```yaml title="quartz.config.yaml"
plugins:
  - source: "@chaoticgoodcomputing/quartz-tag-explorer"
    enabled: true
    options:
      privateTags: [private]
      excludePrivate: true
      drawerBreakpoint: 1000
    layout:
      position: left
      priority: 50
```

## Configuration

| Option             | Type                     | Default          | Description                                                                                |
| ------------------ | ------------------------ | ---------------- | ------------------------------------------------------------------------------------------ |
| `title`            | `string`                 | `"Tag Explorer"` | The heading, which also names the drawer button.                                           |
| `defaultState`     | `"collapsed" \| "open"`  | `"collapsed"`    | How tags start before the reader opens or closes them.                                     |
| `useSavedState`    | `boolean`                | `true`           | Remember opened tags across reloads, in localStorage.                                      |
| `tagSort`          | `string`                 | `"count-desc"`   | `count-desc`, `count-asc`, `alphabetical` or `alphabetical-reverse`.                       |
| `excludeTags`      | `string[]`               | none             | Tags to leave out of the tree, with their subtags.                                         |
| `privateTags`      | `string[]`               | none             | Tags that make a page private. Private pages are listed last, with a lock.                 |
| `excludePrivate`   | `boolean`                | `false`          | Leave private pages, and tags only they carry, out entirely.                               |
| `showCount`        | `boolean`                | `true`           | Show the number of pages under each tag.                                                   |
| `iconCollections`  | `Record<string, string>` | none             | Your own icon sets: a prefix and the folder of SVGs behind it. `mdi:` icons need no entry. |
| `drawerBreakpoint` | `number`                 | `800`            | The viewport width, in pixels, at or below which the explorer becomes a drawer.            |

## Documentation

See [CONTEXT.md](https://github.com/chaoticgoodcomputing/blog/blob/main/quartz/plugins/quartz-tag-explorer/CONTEXT.md) and the [decision records](https://github.com/chaoticgoodcomputing/blog/tree/main/quartz/plugins/quartz-tag-explorer/docs/adr).

## License

MIT
