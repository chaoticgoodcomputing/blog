---
title: cgc-social
tags:
  - projects/site
  - engineering/frontend
---

`cgc-social` is a [Quartz 5](https://quartz.jzhao.xyz/) plugin that puts two cards in a sidebar: a GitHub user's year of contributions, drawn as GitHub's calendar, and a Bluesky account's latest posts. The reader's browser fetches both when the page loads, so the build never touches the network and the cards are always current.

It is the pair of `SocialMediaGitHub` and `SocialMediaBlueSky` components from this site's Quartz 4 days, carried over as one plugin. The Bluesky posts are drawn by the Bluesky client in [`@chaoticgoodcomputing/widgets`](https://github.com/chaoticgoodcomputing/blog/tree/main/quartz-v5/libs/widgets), the library behind the `bluesky-post` widget, which this plugin builds into its script.

## What it renders

The page as built holds each card's heading and a loading state. The browser then fills each card in:

```html
<div class="cgc-social">
  <div class="cgc-social__card cgc-social__card--github" data-username="octocat" …>
    <h3 class="cgc-social__title">GitHub Contributions</h3>
    <div class="cgc-social__body cgc-social__body--github">
      <!-- then: the profile, the year's total and the calendar -->
      <div class="cgc-social__status">
        <div class="cgc-social__spinner"></div>
        <p class="cgc-social__message">Loading contributions...</p>
      </div>
    </div>
  </div>
  <div class="cgc-social__card cgc-social__card--bluesky" data-handle="alice.bsky.social" …>
    <h3 class="cgc-social__title">Bluesky Feed</h3>
    <div class="cgc-social__body">
      <!-- then: <div class="cgc-social__posts">, one post card per post -->
      …
    </div>
  </div>
</div>
```

**The GitHub card** shows:

- the user's avatar, name (a link to their GitHub page), username and bio, unless `showProfile` is off. If GitHub doesn't answer for the profile, the card goes on without it;
- "N contributions in the last year", unless `showHeader` is off;
- the calendar: a row per weekday, a column per week, and each day coloured by how busy it was, with its count and date in its tooltip. It shows the newest weeks, as many as fit the card's width.

The profile comes from GitHub's API, `api.github.com/users/<username>`, and the calendar from the [GitHub contributions API](https://github.com/grubersjoe/github-contributions-api), `github-contributions-api.jogruber.de`. Neither needs a token.

**The Bluesky card** shows the account's latest posts and reposts, newest first, each as a compact post card: its author, text, images, link card or quoted post, date, and link to Bluesky. A repost says who reposted it, and a reply says so. The counts of replies, reposts and likes show unless `showMetrics` is off. The posts come from Bluesky's public API, `public.api.bsky.app`, with no sign-in.

**When something fails,** the card says so and the rest of the page carries on: "Failed to load contributions" or "Failed to load posts", with the reason under it, or "No posts found" for an empty feed. Everything a profile or a post says is drawn as text, never as markup.

**Navigation.** On a site with Quartz's SPA navigation, coming back to the page draws the cards again, and leaving the page cancels any fetch still under way.

**A site with a Content Security Policy** must allow `https://api.github.com`, `https://github-contributions-api.jogruber.de` and `https://public.api.bsky.app` in `connect-src`, and `https://avatars.githubusercontent.com` and `https://cdn.bsky.app` in `img-src`.

### Where it renders

The cards belong on the home page. Quartz 5 places a component with the `layout` of its config entry, and a `condition` could keep it to the home page, but Quartz 5 ships only `not-index`, and a plugin can't add an `is-index`. So the cards keep to their pages by themselves, as [cgc-post-listing](https://blog.chaoticgood.computer/plugins/cgc-post-listing) does: they render on the pages whose slugs `showOn` names, `index` (the home page) by default, and nowhere else, wherever the layout puts them. Place them in a sidebar, and add `display: desktop-only` to keep them off narrow screens.

Both cards are one component, so they sit in one place in the layout, the GitHub card above the Bluesky card. The reasoning is in the package's [ADR-0001](https://github.com/chaoticgoodcomputing/blog/blob/main/quartz-v5/plugins/cgc-social/docs/adr/0001-one-component-draws-both-cards.md).

## Install

Plugins in this family ship as source from [the blog's monorepo](https://github.com/chaoticgoodcomputing/blog), and a site pins a release tag. This plugin needs [cgc-styles](https://blog.chaoticgood.computer/plugins/cgc-styles):

```sh
npx quartz plugin add git+https://github.com/chaoticgoodcomputing/blog.git#v<x.y.z> --subdir quartz-v5/plugins/cgc-social --name cgc-social
```

Keep `--name`: without it, a plugin installed from a subdirectory is named after the repository, and every plugin in the family would install over the last.

> [!WARNING]
> **Depending on `cgc-styles` by name needs a change to Quartz.** Stock Quartz matches a dependency only against the exact `source:` string. Matching by plugin name is a small change to its loader, carried in this repository's copy of Quartz and proposed upstream on [chaoticgoodcomputing/blog#47](https://github.com/chaoticgoodcomputing/blog/issues/47). Until it lands, this plugin builds only against that copy.

Then configure at least one card. The build fails until you do, and it fails on a card with no account, so that a card never shows someone else's.

## Configure

This site's own configuration:

```yaml
plugins:
  - source: ... # as `quartz plugin add` wrote it
    enabled: true
    options:
      github:
        username: spelkington
        title: GitHub Activity
        levelColors:
          - "light-dark(#ebedf0, #161b22)"
          - "light-dark(#9be9a8, #0e4429)"
          - "light-dark(#40c463, #006d32)"
          - "light-dark(#30a14e, #26a641)"
          - "light-dark(#216e39, #39d353)"
      bluesky:
        handle: speen.us
        postLimit: 5
        title: ATProto Feed
        showMetrics: false
    layout:
      position: right
      priority: 40
      display: desktop-only
```

| Option | Default | |
| --- | --- | --- |
| `showOn` | `["index"]` | The pages that get the cards, by slug. |
| `github` | none | The GitHub card. Leave it out for no GitHub card. |
| `github.username` | none, required | The GitHub user whose contributions to show. |
| `github.title` | `"GitHub Contributions"` | The heading above the card. `""` or `false` for none. |
| `github.showProfile` | `true` | Show the user's avatar, name, username and bio. |
| `github.showHeader` | `true` | Show the year's total above the calendar. |
| `github.levelColors` | from the theme | The calendar's five colours, from a day with no contributions to the busiest. See Styling, below. |
| `bluesky` | none | The Bluesky card, below the GitHub card. Leave it out for no Bluesky card. |
| `bluesky.handle` | none, required | The Bluesky account whose posts to show, such as `alice.bsky.social`. |
| `bluesky.postLimit` | `5` | How many posts to show, from 1 to 100. |
| `bluesky.title` | `"Bluesky Feed"` | The heading above the card. `""` or `false` for none. |
| `bluesky.showMetrics` | `true` | Show each post's reply, repost and like counts. |

The strings are English.

**Changed from Quartz 4:**

- **`theme` is now `levelColors`.** Quartz 4's six themes (`default`, `midnight`, `void`, `slate`, `glacier`, `cyber`) were fixed hex colours, which no theme or colour scheme could reach. `levelColors` takes five colour values instead, and by default the calendar follows the site's theme. Quartz 4's `default` theme, GitHub's greens, is the dark half of the configuration above.
- **`showFooter` and `showThumbnail` are gone.** Quartz 4 took them, but nothing ever read them.
- **A missing `username` or `handle` fails the build.** Quartz 4 showed "No username specified" to readers.
- **A failed Bluesky card** shows "Failed to load posts" with the reason on its own line, as the GitHub card always did.
- **Days are read as calendar days.** Quartz 4 read a day's date in the reader's time zone and then added a day, which put every day one late for a reader east of UTC.
- **Each visit asks once.** Quartz 4 fetched both cards twice on the first page load.

## Styling

The CSS is library CSS, following [ADR-0003](https://github.com/chaoticgoodcomputing/blog/blob/main/docs/adr/0003-library-css-in-plugins-application-css-at-the-site.md):

- **Classes:** one BEM block, `.cgc-social`, with the elements `__card` (and its modifiers `--github` and `--bluesky`), `__title`, `__body`, `__status` (`--failed`, `--empty`), `__spinner`, `__message` (`--failed`), `__details`, `__panel`, `__profile`, `__avatar`, `__profile-info`, `__name`, `__username`, `__bio`, `__total`, `__graph`, `__calendar`, `__weekday`, `__day` (`--level-0` to `--level-4`), `__blank` and `__posts`. Every selector is a single class, or a single class with a pseudo-class, so one class of your own overrides any of them.
- **The posts** are the widget library's compact post cards, the `.cgc-bluesky` block with its `--compact` modifier. Their stylesheet comes with this plugin's.
- **Cascade layer:** the rules, the post cards' included, sit in the `cgc.social` layer. That is above Quartz's own styles and themes, and below any unlayered site CSS.
- **Colours:** all from the theme's properties: `--light`, `--lightgray`, `--gray`, `--dark` and `--secondary`. So the cards follow the colour scheme and any theme.
- **The calendar's colours** are five custom properties, `--cgc-social-level-0` to `--cgc-social-level-4`. By default they run from `--lightgray` to `--secondary`, through mixes of the two. `levelColors` sets them, and so can your own CSS. Each value is a colour value: a colour, a `var()` reference, or `light-dark()` for a different colour in each scheme. The build fails on a value that isn't one. A site that uses `light-dark()` needs a `color-scheme` for it to follow, which Quartz's dark mode toggle gives it.

The build checks the stylesheet and fails if a selector reaches outside the block, or if it sets a colour literal or a `font-family`.

## Develop

This package is the Nx project `cgc-social`. Its specs live in [`e2e/`](https://github.com/chaoticgoodcomputing/blog/tree/main/quartz-v5/plugins/cgc-social/e2e) and run against the shared fixture site, and against a site built from this site's own config ([ADR-0004](https://github.com/chaoticgoodcomputing/blog/blob/main/docs/adr/0004-playwright-e2e-as-the-plugin-tdd-loop.md)). No request ever reaches GitHub or Bluesky: the suite answers both from made-up accounts.

```sh
pnpm nx run cgc-social:e2e
pnpm nx run cgc-social:typecheck
```
