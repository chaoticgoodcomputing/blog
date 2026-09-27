---
title: quartz-graph
tags:
  - projects/site/plugins
  - engineering/frontend
---

Draws the graph view: a local graph of the pages and tags around the current page, and a global graph of the whole site with filters for how recently a page changed and whether private pages show. Each node is drawn as its tag's bubble, in the tag's colour and with its icon. A replacement for `@quartz-community/graph`.

## Installation

```bash
npm install @chaoticgoodcomputing/quartz-graph
```

Requires [quartz-tags](https://blog.chaoticgood.computer/plugins/quartz-tags) and [quartz-styles](https://blog.chaoticgood.computer/plugins/quartz-styles). Disable `@quartz-community/graph`.

## Usage

```yaml title="quartz.config.yaml"
plugins:
  - source: "@chaoticgoodcomputing/quartz-graph"
    enabled: true
    options:
      privateTags: [private]
      iconCollections: { custom: ../icons }
      globalGraph:
        graphStyle: pseudo-shell
        pseudoShellConfig:
          pinnedTags: [engineering, writing]
    layout:
      position: right
      priority: 10
```

Ctrl+G (⌘+G on a Mac) opens the global graph.

## Configuration

| Option            | Type                     | Default        | Description                                                                                |
| ----------------- | ------------------------ | -------------- | ------------------------------------------------------------------------------------------ |
| `title`           | `string`                 | `"Graph View"` | The heading above the local graph.                                                         |
| `privateTags`     | `string[]`               | none           | Tags that make a page private, along with their subtags.                                   |
| `iconCollections` | `Record<string, string>` | none           | Your own icon sets: a prefix and the folder of SVGs behind it. `mdi:` icons need no entry. |
| `localGraph`      | `GraphConfig`            | see below      | Settings for the local graph, merged over its defaults.                                    |
| `globalGraph`     | `GraphConfig`            | see below      | Settings for the global graph, merged over its defaults.                                   |

The most useful graph settings (local / global defaults):

| Setting                     | Default                                     | Description                                                              |
| --------------------------- | ------------------------------------------- | ------------------------------------------------------------------------ |
| `depth`                     | `1` / `-1`                                  | How many edges out from the current page to draw. `-1` draws everything. |
| `scale`                     | `1.1` / `0.9`                               | Zoom; labels are drawn at `1 / scale`.                                   |
| `repelForce`, `centerForce` | `0.5`, `0.3` / `0.5`, `0.2`                 | How hard nodes push apart and are pulled to the centre.                  |
| `linkDistance`              | `{ tagTag: 20, tagPost: 30, postPost: 50 }` | Edge length by kind. A number sets all three.                            |
| `baseSize`                  | `{ tags: 4, posts: 2 }`                     | Node radius before scaling by edge count.                                |
| `showTags`, `removeTags`    | `true`, `[]`                                | Whether to draw tags, and which to leave out.                            |
| `focusOnHover`              | `false` / `true`                            | Fade nodes away from the hovered one.                                    |
| `graphStyle`                | `freeform`                                  | `pseudo-shell` pins `pseudoShellConfig.pinnedTags` to a ring.            |
| `nodeColors`                | none                                        | `{ public, private }` colours in place of the tag colours.               |
| `defaultFilterState`        | `{ timePeriod: all, includePrivate: true }` | The global graph's filters when it opens.                                |

The full list is in [`src/options.ts`](https://github.com/chaoticgoodcomputing/blog/blob/main/quartz/plugins/quartz-graph/src/options.ts). Unknown options, unreadable colours and missing icons fail the build.

## Documentation

See [CONTEXT.md](https://github.com/chaoticgoodcomputing/blog/blob/main/quartz/plugins/quartz-graph/CONTEXT.md) and the [decision records](https://github.com/chaoticgoodcomputing/blog/tree/main/quartz/plugins/quartz-graph/docs/adr).

## License

MIT
