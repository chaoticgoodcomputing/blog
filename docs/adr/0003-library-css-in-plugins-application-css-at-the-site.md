---
status: accepted
date: 2026-09-24
---

# Style plugins as library CSS, the site as application CSS

[ADR-0002](./0002-plugin-composition-through-published-artifacts.md) says how a family of our
plugins composes. This says how it is **styled**. Quartz 5 publishes no styling philosophy — its
111-file doc set never discusses the cascade, layers, specificity, tokens or namespacing, and the
whole of its normative CSS guidance is one warning: _"Quartz does not use CSS modules so any styles
you declare here apply globally. If you only want it to apply to your component, make sure you use
specific class names and selectors"_
([creating components.md:110](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/docs/advanced/creating%20components.md?plain=1#L110)). There is no
house style to defer to, so we pick one.

We treat the two sides differently, because they face different problems. Inside a `cgc-*` package
we are writing **library CSS**: it lands in a stranger's cascade, at a position we do not control,
beside markup we did not write. At the site — `custom.scss`, which Quartz appends unlayered — we are
writing **application CSS**: we own the whole cascade and can order it.

> Source links point at upstream Quartz at
> [`97a2d05`](https://github.com/jackyzha0/quartz/tree/97a2d05f80c4c50534959b1d0d41cc4b3895625e)
> (v5.0.0), the ref `quartz-v5/upstream.json` pins, and at this repo at `9e48f89`.

## Why

**A plugin gets no cascade position.** Every component's CSS is force-wrapped into
`@layer quartz-base` — the _same_ layer as `base.scss` —
([componentResources.ts:411](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/emitters/componentResources.ts#L411)), while
`custom.scss` is appended outside any layer
([componentResources.ts:347](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/emitters/componentResources.ts#L347)). So a plugin has
no priority over core's element selectors and no ordering against its siblings; ties fall to
specificity, then to plugin load order from the config. **Any architecture whose mechanism is
_position_ — ITCSS, CUBE, utility-first — therefore cannot be expressed from inside a plugin.** That
single fact decides this ADR.

**A plugin gets no scope.** No CSS modules (stated outright, above). No shadow DOM. No selector
rewriting: the only transforms applied to a plugin's CSS are the layer wrap and minification, and
the content hashing is over file bytes for cache-busting, not over class names. Encapsulation is
available only by naming.

**Theming already works the way OOCSS says it should.** Skin travels as custom properties from one
top-level source ([theme.ts:180-195](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/util/theme.ts#L180-L195)) in layers that sit _above_
every component — `@quartz-themes/core`, a default dependency, declares
`@layer quartz-base, obsidian-theme, quartz-themes-base, obsidian-theme-overrides;`. Structure stays
in each component. That is OOCSS's separation of structure from skin, implemented in modern CSS, and
it is why a plugin that consumes custom properties is themeable by themes it has never heard of —
and why one that hardcodes a colour is reachable by none of them.

**The v4 failure we are designing against was a library-CSS hygiene failure, not a Quartz failure.**
pdf.js ships a bare `.sidebar` selector, which collided with Quartz's own `.left.sidebar` /
`.right.sidebar`. Our widget stylesheet had to reach _outward_ and restore eleven properties by force
([style.inline.scss:16-26](https://github.com/chaoticgoodcomputing/blog/blob/9e48f89b256f511a94f07d473d46395d91730c53/quartz/widgets/pdf-viewer/style.inline.scss#L16-L26)). Nothing about
Quartz caused that: a dependency violated container-independence and we paid for it. Every rule below
exists to stop us being that dependency.

**The ecosystem violates it routinely**, and worse than v4 did. `@quartz-community/reader-mode`
selects `.sidebar.left` / `.sidebar.right`; `@quartz-community/explorer` opens with
`.page > #quartz-body > :not(.sidebar.left:has(.explorer))`. Those are carve-outs into core's
structure from independently versioned packages, compiled against a _copy_ of core's class names with
no build-time verification they still exist. In v4 a carve-out and its target lived in one repo and
moved together; now they do not.

## The rule

1. **BEM naming, flat specificity.** Block / element / modifier under one namespace per package.
   Single-class selectors wherever possible, so a consumer can override with one class.
2. **Never select what you do not own.** OOCSS container-independence. A plugin may not select a class
   defined by core, by another plugin, or by content it did not generate.
3. **Enforce 1 and 2 at build time, not at review.** Each plugin compiles its own SCSS, so each plugin
   runs a PostCSS prefixing pass that namespaces every selector and fails the build on escape. This is
   CSS Modules' guarantee, reimplemented at the one boundary where we own the build. Convention we
   have to remember is convention we will forget.
4. **Keep selectors shallow** — SMACSS's _depth of applicability_. Depth is coupling to someone else's
   DOM shape.
5. **Ship structure, consume skin.** No colour or `font-family` literal inside a plugin. Both come from
   custom properties; that is what makes a plugin themeable at all.
6. **Consume only documented properties** — the nine colours and four font families, plus our own. The
   ~45 Obsidian aliases are undocumented internals, and depending on them is depending on a
   compatibility shim.
7. **Prefix every custom property we define with `--cgc-`.** Forced, not stylistic: core squats on
   unprefixed, inheritable `--color` / `--border` / `--bg` inside callouts
   ([callouts.scss:5-6](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/styles/callouts.scss#L5-L6),
   [:37-40](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/styles/callouts.scss#L37-L40)), which inherit into anything transcluded there.
8. **Breakpoints are structure, never skin.** They cannot be custom properties — CSS forbids `var()` in
   media-query conditions — and they should not be themeable. Each package carries its own literals, or
   uses container queries where a component should respond to its own space rather than the viewport.
9. **Vendored third-party CSS goes below us**, in a layer that loses to core by construction, rather
   than being fought with `!important`.
10. **At the site, ITCSS via `@layer` stays.** `custom.scss` is unlayered and ours; its existing layer
    order ([custom.scss:42](https://github.com/chaoticgoodcomputing/blog/blob/9e48f89b256f511a94f07d473d46395d91730c53/quartz/styles/custom.scss#L42)) is application CSS and keeps working.

## Considered alternatives

- **ITCSS inside plugins.** Rejected: its mechanism is cascade position and plugins have none. Worth
  recording that what we built in v4 _was_ ITCSS — self-described at
  [custom.scss:4](https://github.com/chaoticgoodcomputing/blog/blob/9e48f89b256f511a94f07d473d46395d91730c53/quartz/styles/custom.scss#L4) — and not CUBE, which we had been calling it.
- **CUBE CSS.** Rejected for the same reason: it leans on a utilities tier, and utilities are
  meaningless without late cascade position.
- **Utility-first (Tailwind, Tachyons).** Worst fit available, same reason, more of it.
- **CSS Modules.** Unavailable; the docs rule it out explicitly.
- **Shadow DOM.** Incompatible with server-rendered markdown content — Quartz renders hast to static
  HTML, and content must inherit the page's typography.
- **Claiming our own named layer via `externalResources()`.** **Deferred, not rejected.** That path is
  not layer-wrapped by core, so it would restore ordering and make a tiered methodology viable again.
  But the `@layer` declaration must be emitted exactly once and before any rule using it, and
  `externalResources()` CSS is ordered by plugin iteration from `quartz.config.yaml` — so its position
  is config-dependent, and getting it wrong yields undefined order rather than a visible error. It
  needs a prototype before it can be a decision. If it lands, rules 1–9 are unchanged; it only adds a
  tier above them.
- **No methodology**, the ecosystem default. We have the v4 evidence for how that ends.

## Consequences

- **Two vocabularies, split at the package boundary.** Deliberate, and the split is legible: if it
  ships in a package it is library CSS, if it ships in `custom.scss` it is application CSS.
- **No utilities inside plugins.** Repetition inside a package is the price of not needing position.
- **A PostCSS step in every plugin build.** Small, but it is a dependency each package carries.
- **Tag colours are currently raw hex** in configuration — skin baked into data, so they adapt to
  neither dark mode nor any theme. Rule 5 puts that in scope as a follow-up to ADR-0002's tag engine.
- **Rules 1–4 are machine-enforced; 5–9 are carried by review.** Worth knowing which is which.
- **Being well-behaved does not protect us from neighbours who are not.** Rule 9 is the only defence
  we get, and it only covers dependencies we ourselves vendor.

## Prior art

The decision is assembled from established methodologies rather than invented:

- **OOCSS** — Nicole Sullivan, 2009. Separate structure from skin; separate container from content.
  Rules 2 and 5.
- **BEM** — Yandex, <https://getbem.com>. Block/element/modifier, flat specificity. Rule 1.
- **SMACSS** — Jonathan Snook, 2011. Depth of applicability. Rule 4.
- **ITCSS** — Harry Roberts, <https://csswizardry.com>. Specificity-ordered layers. Rule 10, and the
  thing rejected for plugins.
- **CUBE CSS** — Andy Bell, <https://cube.fyi>. Considered and rejected.
- **Cascade layers** — MDN's `@layer` documentation and Miriam Suzanne's writing. Rules 9 and 10.
