---
title: Quartz Graph Explorer
tags:
  - projects/site/plugins
  - engineering/languages/typescript
  - engineering/frontend
  - engineering/data
date: 2026-09-27
description: An enhanced graph explorer for Quartz 5 sites
---
![[public/assets/Pasted image 20260927192127.png]]

A customizable alternative to the default Quartz graph plugin that allows for tags, coloring, and many other config options.

## Installation

```bash
npm install @chaoticgoodcomputing/quartz-graph
```

Requires [[/plugins/quartz-tags|Quartz Tags]] and [[/plugins/quartz-styles|Quartz Styles]]

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
| `debugPanel`      | `boolean \| "serve"`     | `false`        | A panel beside the global graph for trying every setting live. See below.                  |

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
| `nodeColors`                | none                                        | `{ public, private }` colors in place of the tag colors.                 |
| `defaultFilterState`        | `{ timePeriod: all, includePrivate: true }` | The global graph's filters when it opens.                                |

With `debugPanel: true`, the global graph's dialog gets a settings panel: every graph setting as a control, grouped and named by its path in the config (`linkDistance.tagPost`). A Global/Local switch picks which graph's settings you edit, and the dialog draws that graph, the local one around the current page. Each change redraws the graph. Underneath, both graphs' changed settings are shown as YAML, with a button to copy them: paste them over the `localGraph` and `globalGraph` blocks in your config. Edits last until the page reloads. The panel is for tuning, not for readers: set `debugPanel: serve` to show it only while you serve the site (`quartz build --serve`), so a build you publish never has it.

![[public/assets/Pasted image 20260928003156.png]]

The full list is in [`src/options.ts`](https://github.com/chaoticgoodcomputing/blog/blob/main/quartz/plugins/quartz-graph/src/options.ts). Unknown options, unreadable colors and missing icons fail the build.

## License

MIT
