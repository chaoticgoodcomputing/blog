---
status: accepted
date: 2026-09-25
---

# One component draws both cards

v4 had two sidebar components, `SocialMediaGitHub` and `SocialMediaBlueSky`, placed one after the
other in the right sidebar of the home page, each wrapped in `DesktopOnly`
([index.layout.ts:49-66](https://github.com/chaoticgoodcomputing/blog/blob/9e48f89b256f511a94f07d473d46395d91730c53/quartz/layouts/index.layout.ts#L49-L66)).
[Where do the ledger's unassigned pieces live?](https://github.com/chaoticgoodcomputing/blog/issues/44)
put both in one plugin, `cgc-social`. But Quartz 5 lays out one component per config entry. Decided
on [cgc-social: social sidebar components](https://github.com/chaoticgoodcomputing/blog/issues/80).

> Source links point at upstream Quartz at
> [`97a2d05`](https://github.com/jackyzha0/quartz/tree/97a2d05f80c4c50534959b1d0d41cc4b3895625e)
> (v5.0.0), the ref `quartz-v5/upstream.json` pins. v4 links point at this repo at `9e48f89`.

## Decision

The plugin has **one component, `SocialMedia`, which draws both cards**: the GitHub card, then the
Bluesky card, as v4's home page had them. Each card is an option, `github` or `bluesky`, and a site
leaves one out to have only the other. So one plain `source:` entry places the pair, and its
`layout` places them together.

## Why

- **One entry places one component, found by the entry's name.** The loader looks the component up
  under the plugin name, then under its PascalCase
  ([config-loader.ts:751-773](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/config-loader.ts#L751-L773)),
  and registers a component under the plugin name only when the plugin has exactly one
  ([componentLoader.ts:52-65](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/componentLoader.ts#L52-L65)).
  With one component, `source: …/cgc-social` finds it, as it finds every stock plugin's.
- **Two components would mean two entries, each running the whole plugin.** `site-components` lists
  itself once per component, under object sources named for them (its ADR-0001). That plugin has no
  transformer. This one ships its stylesheet from a transformer (ADR-0003 rule 11), so each entry
  would ship the stylesheet again, with its own options: the Bluesky entry's copy would reset the
  calendar's colours to their defaults over the GitHub entry's. A downstream site would also install
  the plugin twice, once per `--name`.
- **v4 never placed them apart.** The two cards sat together in one sidebar, on one page, both
  desktop-only. One placement is what the site needs.

## Considered alternatives

- **Two components, placed by object sources**, as `site-components` does. Rejected for the reasons
  above: a doubled transformer, colours that depend on entry order, and a doubled install.
- **A plugin per card**, `cgc-social-github` and `cgc-social-bluesky`. It is the ecosystem's shape,
  one component per plugin. Rejected because it undoes #44, which named one `cgc-social`.
- **A vendored change** to let an entry name the component it places. Rejected: a workaround exists
  inside the plugin, so there is no case for a third vendored change (ADR-0001 at the repo root).

## Consequences

- **The cards can't be placed apart**, say GitHub on the left and Bluesky on the right, nor in the
  other order. A site that needs that can install the plugin twice, one card configured in each,
  and takes on the entry-order dependence rejected above: each install ships the stylesheet with
  the calendar's default colours, and a later copy's defaults win, so the install that sets
  `github.levelColors` must be the later entry.
- **One `display` and one `condition` cover both.** On the real site, `display: desktop-only` wraps
  the pair, as v4 wrapped each.
- **The cards keep to their pages by `showOn`**, as `cgc-post-listing` does (its ADR-0001), since no
  plugin can add an `is-index` condition (#70).
