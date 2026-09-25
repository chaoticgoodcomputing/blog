---
status: accepted
date: 2026-09-25
---

# No opinionated dependencies

`cgc-mdx` is the most generally useful plugin in the family, so it aims to install on a stock
Quartz site as it stands. It takes a family engine as a hard dependency only when its own
correctness requires one, never for uniformity. Decided on
[Which cascade layer does widget CSS land in?](https://github.com/chaoticgoodcomputing/blog/issues/45).

**The case that set the rule: no `cgc-styles` dependency.** Widget CSS lands in `cgc.mdx.widgets`,
under the family layer, and ADR-0003 in the repo root asks every styled `cgc-*` package to list the
engine that positions `cgc`. `cgc-mdx` doesn't need to. Its stylesheets arrive through
`additionalHead`, which `Head` renders after every plugin's `externalResources()` CSS
([Head.tsx:96-106](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/components/Head.tsx#L96-L106)).
So a widget link can never be the first thing to put `cgc` below a theme. `cgc-mdx` adds `cgc.*`
layers but never positions `cgc`. Where the engine is installed, it positions the layer. Where it
isn't, widget CSS still lands above core and themes and below anything unlayered.

**What a dependency would have cost.** Every stock site would have had to install `cgc-styles` for
nothing. And until the upstream proposal to match `manifest.dependencies` by plugin name lands,
any consumer fails the shareability test, which would have included `cgc-mdx`.

## Consequences

- ADR-0003's rule that a styled package depends on `cgc-styles` is narrowed to packages that emit
  CSS from `externalResources()`.
- A future feature that *does* need an engine goes behind an option that is off by default,
  rather than becoming a dependency of the whole plugin.
