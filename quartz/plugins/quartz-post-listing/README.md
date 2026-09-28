---
title: Quartz Enhanced Post Listings
tags:
  - projects/site/plugins
  - engineering/languages/typescript
  - engineering/frontend
date: 2026-09-27
description: An enhanced post listing component for Quartz 5 sites
---
An alternative to the community Post Listing plugin, allowing for more filtering options and tagging sugar to post listings.

## Installation

```bash
npm install @chaoticgoodcomputing/quartz-post-listing
```

Requires [[public/plugins/quartz-tags|Quartz Tags]] and [[public/plugins/quartz-styles|Quartz Styles]]

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

## License

MIT
