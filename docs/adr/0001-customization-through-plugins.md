---
status: accepted
date: 2026-09-24
---

# Customize Quartz through shareable plugins

This repo vendors a copy of Quartz 5: the source sits in `quartz/`, and nothing stops us
editing it. The discipline here is therefore **self-imposed, not structural**. We customize
through the Quartz 5 plugin system by default, and treat edits to the vendored copy as a last
resort, because we want (a) improvements to Quartz pitched upstream rather than kept here, and
(b) our plugins to be genuinely shareable through the plugin system — which means they have to
work on a stock copy of Quartz.

## Why

**Shareability is the primary reason.** A plugin is only shareable if it runs against an
unmodified Quartz. The moment a plugin depends on a change we made to our vendored copy, it
stops being a plugin anyone else can install and becomes a private patch wearing a plugin's
clothes. Keeping customization inside plugin-visible extension points is what keeps the work
publishable, and publishing it is how the change gets maintained by more people than us.

**Upgrade cost is the secondary reason, and Quartz 4 is the evidence.** The vendored `quartz/`
reached roughly 2x upstream — 30,759 lines against 15,711 — with 95 stock files forked (4,102
changed lines, excluding i18n churn), 20 upstream files deleted, and ~17.6k lines in files with
no upstream counterpart. None of that was individually unreasonable. It accumulated because
editing the vendored copy was always the shortest path and nothing made the cost visible at the
moment it was incurred. The v5 plugin system exists precisely so that most of what we forked in
v4 no longer needs forking.

## The rule

1. **Default to a plugin.** Page types, frames, transformers, emitters and components all have
   plugin-provided extension points in v5. Local plugins may live in-repo and be symlinked, so
   "it isn't published yet" is not a reason to modify the vendored copy.
2. **Apply the shareability test:** *would this plugin work on a stock copy of Quartz?* If no,
   the plugin is not shareable yet, and that is a cost to be accounted for — not a detail.
3. **A change to the vendored copy requires a ticket** recording what changed, why no
   plugin-visible route existed, and how it will be proposed upstream.
4. **Prefer upstreamable shapes.** A small, additive, backward-compatible change that benefits
   every Quartz user can plausibly land upstream, which ends the divergence *and* makes any
   plugin depending on it shareable. A change shaped only for this repo does neither.
5. **Keep each vendored change isolated** — one commit, shaped like the upstream patch it will
   become — so it survives merges legibly and can be dropped once upstream accepts it.

## Worked example: MDX (#19)

`.mdx` turned out to be servable almost entirely by a page-type plugin: it reconstructs the
configured transformer pipeline from `ctx.cfg.plugins.transformers`, and the rendered page is
indistinguishable from a `.md` control page. The one thing no plugin could do was *run* that
pipeline, because page-type `generate` is synchronous while four of the nine default-enabled
transformers are async. The resulting change to the vendored copy is two lines — widen
`PageGenerator` to allow a promise, `await` the two dispatcher call sites — additive,
backward-compatible, and a limitation that affects every page type rather than only ours.

It also shows the shareability test doing real work: **the MDX plugin fails it today.** It
would break on a stock Quartz, so it cannot be shared until the two-line change lands upstream.
That makes the upstream proposal load-bearing rather than a courtesy, and it is the reason to
file it before we depend on the change rather than after.

## Considered alternatives

- **Patch the dependency at install time** (`pnpm patch` or similar). Not available: Quartz 5 is
  `private: true` and unpublished, and `npx quartz upgrade` works by merging from a git remote.
  There is no package to patch, which is why the copy is vendored at all.
- **Modify the vendored copy freely, since we can.** Rejected. It is the v4 outcome, it forfeits
  shareability, and it moves the cost to every future upgrade.
- **Refuse changes to the vendored copy outright.** Rejected as unworkable: #19 is a real feature
  gated on a genuine core limitation. An absolute ban pushes the work into worse shapes — a
  `.mdx` → `.md` preprocessing step, or a synchronous subprocess shim — that are harder to
  maintain than the two-line change and have no upstream story at all.

## Consequences

- The tickets *are* the inventory of what we carry. Without them this decision has no teeth.
  - These inventory tickets should use the `quartz:vendored` label.
- A plugin that fails the shareability test is still allowed, but it is knowingly unshareable
  until its upstream dependency lands. That state should be visible on the ticket, not implicit.
- Some customizations cost more up front as plugins than as direct edits. Accepted deliberately.
- An upstream proposal may be rejected or stall, leaving us carrying a change indefinitely and a
  plugin we cannot share. That is a known and accepted outcome, and a further reason to prefer
  small, general, upstreamable changes.

## Amendment: Quartz Core and its tiers

_2026-09-27, from [Spec: Quartz Core, a custom upgrade, and our plugins as npm packages](https://github.com/chaoticgoodcomputing/blog/issues/89),
implemented on [#91](https://github.com/chaoticgoodcomputing/blog/issues/91)._

The vendored copy is now **Quartz Core**, at `quartz-v5/core/` (`quartz/core/` after cutover). The
rule above was written as if every file in it were equally protected. That was too strict in the
wrong place: Quartz's own docs tell a site to edit `quartz.ts` (a TS layout override, and
`registerCondition`) and `quartz.config.yaml`, and the site config sat outside the copy behind a
symlink only because of that rule. Meanwhile the copy carried upstream's docs, CI and similar, which
nothing here uses and which made every drift check noisier. So Core is split into four tiers, listed
once, in `quartz-v5/utils/core-tiers.mjs`, which all of the tooling reads:

- **Core source**: Core's `quartz/` tree. Everything this ADR says about "the vendored copy" now
  means this tier. It changes only through a vendored change, with its ticket and upstream proposal.
- **Steering files**: the Core files Quartz's docs tell a site to edit, today `quartz.ts` and the site
  config, `quartz.config.yaml`. Editing them is configuration, not a vendored change, and needs no
  ticket of this kind. An upgrade never overwrites them.
- **Scaffolding**: upstream's toolchain files at Core's root: `package.json`, `tsconfig.json`, the
  root `.d.ts` files, the ignore and formatter files, and the LICENSE. Taken from upstream on each
  upgrade; `package.json` stays exactly upstream's.
- **Pruned files**: upstream files deliberately absent from Core: its docs, CI workflows,
  Dockerfile, community files, default config and npm files. Kept out of every diff, and deleted
  after any tree replacement.

Core's own pnpm files (`pnpm-workspace.yaml`, and `pnpm-lock.yaml`, imported from upstream's
`package-lock.json` at the pinned ref) sit beside the tiers: ours, but never drift.

**Drift** is now any difference between Core and its pinned ref except in steering files, pruned
files and Core's pnpm files (`site-v5:diff-upstream` shows only drift). The shareability test is
unchanged: a plugin that needs an edit to Core source to work fails it.
