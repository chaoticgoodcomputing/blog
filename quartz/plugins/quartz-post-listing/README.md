---
title: quartz-post-listing
tags:
  - projects/site/plugins
  - engineering/frontend
---

Lists a site's posts, newest first, on the home page and on every tag page, where it lists only that tag's posts. Each post shows its title, date, description, reading time and tag badges.

## Installation

```bash
npm install @chaoticgoodcomputing/quartz-post-listing
```

Requires [quartz-tags](https://blog.chaoticgood.computer/plugins/quartz-tags) and [quartz-styles](https://blog.chaoticgood.computer/plugins/quartz-styles).

## Usage

```yaml title="quartz.config.yaml"
plugins:
  - source: "@chaoticgoodcomputing/quartz-post-listing"
    enabled: true
    options:
      showOn: [index, "404"]
      collapsedItemCount: 5
    layout:
      position: afterBody
      priority: 10
```

Quartz 5 has no `is-index` layout condition, so the listing keeps to its own pages: tag pages, plus the slugs in `showOn`. Place it in a slot every page shares, such as `afterBody`.

## Configuration

| Option               | Type                     | Default             | Description                                                                                              |
| -------------------- | ------------------------ | ------------------- | -------------------------------------------------------------------------------------------------------- |
| `showOn`             | `string[] \| false`      | `["index"]`         | Slugs, besides tag pages, that get the listing. `false` for every page.                                  |
| `title`              | `string \| false`        | `"Recent Posts"`    | The heading. `false` for none.                                                                           |
| `limit`              | `number`                 | all                 | List at most this many posts.                                                                            |
| `collapsedItemCount` | `number`                 | all shown           | Show this many posts, and the rest behind a toggle.                                                      |
| `excludeTags`        | `string[]`               | `["private"]`       | Leave out posts under these tags and their subtags.                                                      |
| `filterToCurrentTag` | `boolean`                | `true`              | On a tag page, list only that tag's posts.                                                               |
| `includeSubtags`     | `boolean`                | `true`              | On a tag page, include its subtags' posts.                                                               |
| `excludeTagPages`    | `boolean`                | `true`              | Leave tag pages out of the listing.                                                                      |
| `showEmptyMessage`   | `boolean`                | `true`              | Say so when there's nothing to list.                                                                     |
| `emptyMessage`       | `string`                 | `"No posts found."` | The message when there's nothing to list.                                                                |
| `showTags`           | `boolean`                | `true`              | Show each post's tag badges.                                                                             |
| `showDates`          | `boolean`                | `true`              | Show each post's date.                                                                                   |
| `showDescriptions`   | `boolean`                | `true`              | Show each post's description line.                                                                       |
| `showTagCounts`      | `boolean`                | `false`             | Show the number of pages under each tag.                                                                 |
| `iconCollections`    | `Record<string, string>` | none                | Your own icon sets, as for [quartz-tag-list](https://blog.chaoticgood.computer/plugins/quartz-tag-list). |

## Documentation

See [CONTEXT.md](https://github.com/chaoticgoodcomputing/blog/blob/main/quartz/plugins/quartz-post-listing/CONTEXT.md) and the [decision records](https://github.com/chaoticgoodcomputing/blog/tree/main/quartz/plugins/quartz-post-listing/docs/adr).

## License

MIT
