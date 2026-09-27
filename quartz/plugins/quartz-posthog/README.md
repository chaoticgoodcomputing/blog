---
title: quartz-posthog
tags:
  - projects/site/plugins
---

`@chaoticgoodcomputing/quartz-posthog` is a [Quartz 5](https://quartz.jzhao.xyz/) plugin that adds [PostHog](https://posthog.com/) analytics to your site, set up to respect your readers' privacy:

- If a reader's browser asks not to be tracked (Do Not Track), PostHog isn't even loaded, so nothing is sent.
- Session recording is off, and nothing is stored in a cookie.
- Every page a reader sees counts as a page view, including pages reached through Quartz's single-page navigation.
- Each time a reader follows a link, a `navigation` event records where the link was: the sidebar, a tag badge, the text of a note, or wherever you choose to label.

It carries over the PostHog setup this site had in its Quartz 4 days. It works on a stock copy of Quartz 5, in place of Quartz's own `analytics` setting.

## What it sends

| Event | When | Properties |
| --- | --- | --- |
| `$pageview` | Each page shown: on load, and after each navigation within the site | `path`: the page's path |
| `navigation` | A click on a link that Quartz's router follows | `source`: the label of the place the link was in (see `navigationSources`), or `other`. `from_page`, `to_page`: the paths before and after. `url`: the full address followed |

A link counts as followed when Quartz's router would handle the click itself. That rules out clicks with Ctrl or ⌘ held, links that open in a new tab, links marked `data-router-ignore`, links off the site, and links to a heading on the same page, which only scroll. With `enableSPA: false`, Quartz has no router, so no link is followed and no `navigation` event is sent: each page a reader reaches counts only as a `$pageview`.

Everything else is PostHog's own behaviour at its defaults, [autocapture](https://posthog.com/docs/product-analytics/autocapture) included.

## Privacy

- **Do Not Track.** The plugin checks the three places browsers have reported it (`navigator.doNotTrack`, and the older `window.doNotTrack` and `navigator.msDoNotTrack`). When it is on, the page never requests PostHog's library.
- **No session recording.** `disable_session_recording` is set, whatever the PostHog project's own settings say.
- **No cookie.** PostHog keeps its state in `localStorage`.
- **IP addresses.** The plugin passes `ip: false`, as this site always did, but current PostHog libraries ignore that option. To keep IP addresses out, turn on **Discard client IP data** in your PostHog project settings (Settings → Project → IP data capture).

## Install

The plugin is the npm package `@chaoticgoodcomputing/quartz-posthog`, built, with its type declarations, and loaded by name, as Quartz's own `@quartz-community/*` plugins are. Install it into your Quartz site:

```sh
npm install @chaoticgoodcomputing/quartz-posthog
```

and list it in `quartz.config.yaml` by its package name, `source: "@chaoticgoodcomputing/quartz-posthog"`. Its peers, Preact and Quartz's own packages, are your site's own copies, so a page has one Preact. The package isn't on npm yet: it is published after this site moves to Quartz 5 ([#90](https://github.com/chaoticgoodcomputing/blog/issues/90)).

Then set `apiKey` in `quartz.config.yaml`, and turn Quartz's own analytics off. The build fails if the key is missing, or if Quartz's own `analytics` is PostHog as well, since that would load PostHog a second time and count every page twice.

## Configure

```yaml
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

| Option | Default | |
| --- | --- | --- |
| `apiKey` | none, required | Your PostHog project's API key, `phc_…`. It is public: every page carries it. |
| `apiHost` | `https://us.i.posthog.com` | Where PostHog is. Use `https://eu.i.posthog.com` for the EU cloud, your own address for a self-hosted PostHog, or a path such as `/ingest` for a reverse proxy. A trailing slash is ignored. |
| `navigationSources` | `{}` | Where a navigation came from. Each key is a CSS selector, and its value is the label a `navigation` event carries as its `source` when the clicked link matches that selector or sits inside an element that does. The first match wins, in the order you write them, so put the specific places before the general ones. A link that matches none is `other`. |

For example, with the configuration above, a link in the explorer is `explorer` even though it is also an `a.internal`, and a link in the text of a note is `inline-link`.

## Develop

This package is the Nx project `quartz-posthog`, in `quartz/plugins/quartz-posthog/`. Its manifest name is still `cgc-posthog`. Its specs live in [`e2e/`](https://github.com/chaoticgoodcomputing/blog/tree/main/quartz/plugins/quartz-posthog/e2e) and run against the shared fixture site ([ADR-0004](https://github.com/chaoticgoodcomputing/blog/blob/main/docs/adr/0004-playwright-e2e-as-the-plugin-tdd-loop.md)). They never reach PostHog: a stand-in for PostHog's library answers at the fixture's `apiHost` and records what each page asks of it.

```sh
pnpm nx run quartz-posthog:e2e
pnpm nx run quartz-posthog:typecheck
```
