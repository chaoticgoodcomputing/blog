# cgc-posthog

The Quartz 5 plugin that sends a site's analytics to PostHog: v4's privacy options, and v4's
`navigation` events, kept on [#42](https://github.com/chaoticgoodcomputing/blog/issues/42) and homed
on [#44](https://github.com/chaoticgoodcomputing/blog/issues/44). It replaces Quartz core's
`analytics`, which the site sets to `null`. Inherits the family vocabulary in
[`quartz-v5/CONTEXT.md`](../../CONTEXT.md).

## Language

**Do Not Track**:
A reader's browser reporting that they don't want to be tracked, in any of the three places browsers
have used. With it, the page never loads PostHog, so nothing is sent: stronger than PostHog's own
`respect_dnt`, which loads the library and then stays quiet.
_Avoid_: opt-out (PostHog's name for a reader's choice made on the site), consent

**Followed link**:
A link whose click Quartz's SPA router handles itself, by the router's own rules. Only a followed
link produces a **navigation event**. A click with Ctrl or ⌘ held, a `target="_blank"` link, a
`data-router-ignore` link, a link off the site, and a link to a heading on the same page are not
followed. With SPA routing off there is no router, and no link is followed.
_Avoid_: SPA link, internal link (crawl-links' `.internal` class, which is one possible source)

**Navigation event**:
The `navigation` event sent for a followed link: its source label, and the paths it went from and to.
A back or forward in the browser sends none, as in v4.
_Avoid_: click event, pageview (that is `$pageview`, sent for every page shown)

**Navigation source**:
Where a followed link was, named by a label: the first of the `navigationSources` selectors that the
link matches or sits inside, or `other`. The plugin knows nothing of the plugins that render those
places; a site maps their classes to labels.
_Avoid_: referrer (the previous page, not the place on it), click source
