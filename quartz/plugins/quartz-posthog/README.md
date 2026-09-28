---
title: Quartz Posthog Analytics
tags:
  - projects/site/plugins
  - engineering/languages/typescript
  - engineering/frontend
  - engineering/data
description: A Quartz 5 plugin for privacy-conscious PostHog analytics
date: 2026-09-27
---
Adds [PostHog](https://posthog.com/) analytics, set up to respect readers' privacy:

- If the browser sends Do Not Track, PostHog isn't loaded at all.
- Session recording is off, and nothing is stored in a cookie.
- Every page view counts, including Quartz's SPA navigations.
- A `navigation` event records where each followed link was: the sidebar, a tag badge, a note's text, or any place you label.

To keep IP addresses out, turn on **Discard client IP data** in your PostHog project settings.

## Installation

```bash
npm install @chaoticgoodcomputing/quartz-posthog
```

## Usage

Turn Quartz's own `analytics` off: the build fails if it's PostHog too.

```yaml title="quartz.config.yaml"
configuration:
  analytics: null
plugins:
  - source: "@chaoticgoodcomputing/quartz-posthog"
    enabled: true
    options:
      apiKey: phc_...
      apiHost: https://eu.i.posthog.com
      navigationSources:
        ".explorer": explorer
        ".tag-link": tag-badge
        "a.internal": inline-link
```

## Configuration

| Option              | Type                     | Default                      | Description                                                                                                  |
| ------------------- | ------------------------ | ---------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `apiKey`            | `string`                 | required                     | Your PostHog project's API key. The build fails without it.                                                  |
| `apiHost`           | `string`                 | `"https://us.i.posthog.com"` | Your PostHog instance, or a reverse-proxy path such as `/ingest`.                                            |
| `navigationSources` | `Record<string, string>` | `{}`                         | CSS selectors mapped to the `source` label of a `navigation` event. The first match wins; otherwise `other`. |

## License

MIT
