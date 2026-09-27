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
> (v5.0.0), the ref `quartz/upstream.json` pins, and at this repo at `9e48f89`.

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
rewriting: the only transforms applied to a plugin's CSS are the layer wrap, minification and
syntax lowering (_corrected by the colour-value amendment below_), and the content hashing is over file bytes for cache-busting, not over class names. Encapsulation is
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
   custom properties; that is what makes a plugin themeable at all. _Extended by the colour-value
   amendment below:_ every colour-valued plugin **option** takes a colour value, never a hex-only
   string.
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
   than being fought with `!important`. _Mechanism, per the amendment below:_ a nested
   `@layer vendor {…}` inside the plugin's `Component.css`.
10. **At the site, ITCSS via `@layer` stays.** `custom.scss` is ours; its existing layer
    order ([custom.scss:42](https://github.com/chaoticgoodcomputing/blog/blob/9e48f89b256f511a94f07d473d46395d91730c53/quartz/styles/custom.scss#L42)) is application CSS. _Corrected by the amendment below:_ it does **not**
    keep working unchanged. Only unlayered rules in `custom.scss` win outright. Its named layers rank
    below every plugin layer unless the site declares the whole stack. _Relocated by the site-plugin
    amendment below:_ the site's CSS, stack declaration included, ships from a **site plugin**, not
    from `custom.scss`.
11. **A package's own CSS goes in the family layer**, `@layer cgc.<package>`, emitted from
    `externalResources()`. `Component.css` carries only rule 9's vendor sublayer. _Added by the
    amendment below._

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
- **Claiming our own named layer via `externalResources()`.** Deferred when this ADR was accepted,
  and **adopted** by the amendment below, after a prototype.
- **No methodology**, the ecosystem default. We have the v4 evidence for how that ends.

## Consequences

- **Two vocabularies, split at the package boundary.** Deliberate, and the split is legible: if it
  ships in a `cgc-*` package it is library CSS, if it ships in a site plugin it is application CSS
  (_amended below_; this originally said `custom.scss`).
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

## Amendment: the family layer

_2026-09-24, from [Can the cgc family hold its own cascade layer?](https://github.com/chaoticgoodcomputing/blog/issues/30).
Evidence: the local `prototype/cgc-layer` branch (commit `8cbf5e8`), at `quartz/tests/proto-layer/PROTOTYPE.md`.
Stub plugins were built into the fixture site under 16 config permutations and read back in Chromium._

The deferral's fear, that position would be "config-dependent" and so undefined, turned out
to be half true. Cascade order is fixed by the **first** time each layer name appears, in document
order. The first stylesheet on every page is `index.css`, which opens with `@layer quartz-base`
([renderPage.tsx:80-83](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/components/renderPage.tsx#L80-L83)).
So **any layer a plugin declares from `externalResources()` sits above `quartz-base` under every
config.** Only its position relative to *other plugins'* layers (themes, `quartz-fonts`) depends on
config, and `order` decides that. The declaration doesn't have to be emitted exactly once either,
since a repeated name is a no-op.

**Decided:**

- **The family layer is `cgc`, with one sublayer per package** (`cgc.tags`, `cgc.annotator`, …),
  written from `externalResources()`. Our structure decisions about our own blocks now win over
  core, stock plugins and themes by position, whatever their specificity. Examples are the
  explorer's `.page > #quartz-body > :not(…)` carve-outs and an Obsidian theme's bare `button` rules.
  That's OOCSS container-independence, enforced from the content's side. Our **reach** doesn't
  change: rule 2 still limits what we select, so the layer gives precedence and nothing more.
  **Skin** doesn't change either: it still arrives as custom properties (rule 5), wherever any
  layer sits.
- **Above themes.** A theme is skin. Placed above it, a theme can reskin our blocks through the
  variables we consume, but can't restructure them.
- **A `cgc-styles` engine owns the position.** It emits `@layer cgc;` and nothing else, and every
  `cgc-*` package that emits CSS from `externalResources()` lists it in `manifest.dependencies`.
  _Narrowed from "every styled package"_ on
  [Which cascade layer does widget CSS land in?](https://github.com/chaoticgoodcomputing/blog/issues/45):
  a package whose CSS arrives only through `additionalHead`, like `cgc-mdx`'s widget CSS, renders
  after every `externalResources()` sheet, so it can't position `cgc` below a theme and needs no
  engine (`cgc-mdx` ADR-0003). The loader then **refuses** to build
  if a consumer is ordered before the engine, or if the engine is missing
  ([config-loader.ts:142-148](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/config-loader.ts#L142-L148),
  [:126-131](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/config-loader.ts#L126-L131)).
  This is ADR-0002's engine shape with a cascade position as its published artifact, and it plays
  the part of ITCSS's settings tier for the family: one declaration, one knob. Its `order` must
  exceed any theme's (`@quartz-themes/core` defaults to 10). _Settled on_
  [One manifest.dependencies string can't match both the site and the e2e fixture](https://github.com/chaoticgoodcomputing/blog/issues/40):
  a consumer names the engine by plugin name, `["cgc-styles"]` (ADR-0002's plugin-name amendment),
  which a vendored loader change matches. It landed with `cgc-styles` and is proposed upstream on
  [#47](https://github.com/chaoticgoodcomputing/blog/issues/47).
- **Rule 9 needs no family layer.** Core wraps each `Component.css` in `@layer quartz-base {…}`
  ([componentResources.ts:411](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/emitters/componentResources.ts#L411)),
  so a nested `@layer vendor {…}` inside it becomes `quartz-base.vendor`. That sublayer loses to
  every unlayered rule in `quartz-base`, which is all of core. It was verified against a bare pdf.js-style
  `.sidebar { display: none }`, which left Quartz's sidebars untouched.
- **The site names the whole stack.** `custom.scss` is concatenated into `index.css` right after
  `quartz-base`
  ([componentResources.ts:347](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/emitters/componentResources.ts#L347)),
  so a statement there fixes the order of every layer on the page, ahead of all plugin `order`s.
  Without that statement, v4's five tiers land **below** themes, `quartz-fonts` and `cgc`. With it,
  the site regains the last tier:

  ```css
  @layer quartz-base, obsidian-theme, quartz-themes-base, obsidian-theme-overrides, quartz-fonts, cgc, site;
  @layer site { @layer generic, elements, objects, components, utilities; }
  ```

  Naming layers the site doesn't own is application CSS owning its cascade. Rule 2 binds libraries,
  not the site. It also makes the engine's `order` a default that a site can overrule.

  _The statement stands, but `custom.scss` is no longer where it lives:_ see the site-plugin
  amendment below.

**Traps, measured:**

- **lightningcss 1.33.0 silently inverts sublayer order** when one file names a sublayer both dotted
  (`cgc.tags`) and nested (`@layer cgc { @layer tags {} }`). Use one spelling per file. Dotted is simpler.
- **Still outranking the family:** everything unlayered. That's `custom.scss`'s plain rules, frame CSS,
  syntax-highlighting's button rules, and `quartz-fonts`' `h1,…,h6 { font-family }`. The last beats
  any heading font a `cgc-*` component sets on its own headings.
- **A CSS-only transformer needs a no-op hook** (`htmlPlugins: () => []`). Otherwise the loader skips it
  with only a warning
  ([config-loader.ts:474-481](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/config-loader.ts#L474-L481),
  [:542-545](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/config-loader.ts#L542-L545)).
- **`order` does two jobs.** For a transformer it sets pipeline position as well as CSS position, so
  the engine's `order` puts a floor under every consumer's pipeline position.

## Amendment: colour values

_2026-09-24, from [Tag colours: accept a theme variable as well as a hex](https://github.com/chaoticgoodcomputing/blog/issues/31).
Evidence: the local `research/theme-colour-conventions` branch (commit `be47561`), at
`docs/research/theme-colour-conventions.md`._

**Rule 5 reaches options, not only stylesheets.** A hex in plugin configuration is skin baked into
data. It is reachable by no theme, the same as a literal in the plugin's CSS. So every colour-valued
option on a `cgc-*` plugin takes a **colour value**: anything CSS accepts as a colour, `var(--…)`
references and `light-dark()` included. A plugin validates the syntax at build time and fails the
build on anything that won't parse. It cannot check that a referenced property exists, since a theme
defines it at runtime. A plugin's built-in defaults are theme references too, never literals.

Nothing in the ecosystem gives a precedent for a light/dark *pair* option. No community plugin takes
one; they all consume `var()`. So a scheme split is expressed in the value, with `light-dark()` or a
reference to a property the theme or site already splits, never as a second option.

**Correction: lightningcss lowers syntax.** Core runs `index.css` and every component stylesheet
through lightningcss with fixed targets (Safari 15.6, Chrome 109, Edge 115, Firefox 102;
[componentResources.ts:391-418](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/emitters/componentResources.ts#L391-L418)).
Syntax newer than those targets is rewritten, not passed through. The case that matters is
`light-dark()`: it becomes a space toggle driven by `--lightningcss-light` / `--lightningcss-dark`, and
those are defined only where a `color-scheme` declaration also went through lightningcss. In
practice that means the darkmode plugin's `:root[saved-theme=…] { color-scheme: … }` rule.

- **A site that uses `light-dark()` values needs a `color-scheme` source**: the darkmode plugin, or
  the same rule in its own `custom.scss`. Without one, the lowered value is invalid at computed-value
  time and the colour silently inherits. A plugin that emits a site's colour values documents this
  as a requirement on the site.
- **Canvas and WebGL consumers never draw a colour value directly.** `getComputedStyle` returns a
  custom property as token text, so a native `light-dark()`, `color-mix()` or `var()` chain arrives
  unresolved. They resolve through a probe element's computed `color` and normalise from there.

## Amendment: libraries that ship CSS

_2026-09-25, from [Widget library: name, home and shape for `pdf-viewer` and `bluesky-post`](https://github.com/chaoticgoodcomputing/blog/issues/36)._

**Rule 3 is a check, not a transform, for a library.** A library has no build and no output. Its
`exports` point at source, and the consumer bundles it (for widgets, that's `cgc-mdx`'s esbuild,
which compiles `.css` as written). So there is no build of ours for a prefixing pass to run in.

- **The author writes the namespaced class names**, such as `.cgc-pdf-viewer__page`. The shipped CSS
  is exactly the source, so a reader of the package sees the real selectors.
- **The package's Nx `lint` target runs the check.** It is the same PostCSS pass run in check mode:
  it fails on any selector outside the package's namespace and rewrites nothing. "Fail the build on
  escape" becomes "fail CI on escape".
- **Rules 1, 2 and 4–8 apply unchanged.** Rule 11 does not reach a library. A library has no
  `externalResources()` of its own, so the layer its CSS lands in is the consuming plugin's
  business. For widgets, [Which cascade layer does widget CSS land in?](https://github.com/chaoticgoodcomputing/blog/issues/45)
  settled it: `cgc-mdx` wraps every widget's CSS in `@layer cgc.mdx.widgets`, whatever the widget's
  source, so widget CSS ranks with the family (`cgc-mdx` ADR-0002).
- **Rule 9 does not reach a widget.** Its mechanism is nesting inside `quartz-base`, and a
  stylesheet that arrives as a `<link>` can't get there. A widget's `@layer vendor` would nest to
  `cgc.mdx.widgets.vendor`, still above core. So a library namespaces any third-party CSS it ships,
  under its lint, the way `pdf-viewer` does for PDF.js's text layer.
- **Content-local widgets stay advisory.** `cgc-mdx` does not run the check on a vault's widget CSS
  (`cgc-mdx` ADR-0002).

## Amendment: the site's CSS ships from a site plugin

_2026-09-25, from [Where does the site's application CSS live in v5?](https://github.com/chaoticgoodcomputing/blog/issues/39)._

Everything above that says "at the site, `custom.scss`" had the right *kind* of CSS and the wrong
*place*. In v5, `custom.scss` sits inside the vendored copy
([componentResources.ts:10](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/emitters/componentResources.ts#L10)),
so writing to it is drift, even though upstream intends it as the user's file
([layout.md:245](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/docs/layout.md?plain=1#L245)).

**Decided:** the site's application CSS ships from a **site plugin**, `site-styles`, at
`quartz/site-plugins/site-styles/`. A site plugin fails the shareability test on purpose, because
it *is* this site. It is a CSS-only transformer (_extended by the self-hosted-fonts amendment
below:_ and an emitter, for the site's font files) that emits, from `externalResources()`:

```css
@layer quartz-base, quartz-fonts, cgc, site;
@layer site { @layer generic, elements, objects, components, utilities; }
/* …the site's rules, in its sublayers… */
```

- **Position comes from `order`, and a spec guards it.** `Head` renders one CSS list in order:
  `index.css`, then component CSS (all inside `quartz-base`), then each plugin's `externalResources()`
  in plugin order, whether inline or linked
  ([Head.tsx:96](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/components/Head.tsx#L96),
  [renderPage.tsx:78-84](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/components/renderPage.tsx#L78-L84)).
  `order` has no lower bound
  ([config-loader.ts:120](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/config-loader.ts#L120)),
  so `site-styles` sets `defaultOrder: -1000` and emits the first named layers after core. A spec in
  its own `e2e/` reads the layer order back from the CSSOM. It fails if the order differs from the
  declaration, if `site` is not last, or if any named layer appears that the declaration doesn't list.
- **The declaration names only what the config loads.** Adding a theme means adding its layers, and
  the spec says so. Widget CSS needs no slot: it lands in `cgc.mdx.widgets`, which the `cgc`
  entry already ranks, as decided on
  [Which cascade layer does widget CSS land in?](https://github.com/chaoticgoodcomputing/blog/issues/45).
- **All five ITCSS tiers are kept under `site`**, even the ones the port leaves empty. Application CSS
  stays Sass, compiled in the plugin's own build, since breakpoint mixins are what CSS can't express.
- **The fixtures stay stock by construction.** A fixture config that doesn't list `site-styles` gets
  none of the site's CSS. That is what rules the alternative out.
- **The cost: no hot reload for site CSS.** `serve` watches the Quartz root's `*.scss`, but it never
  reloads a rebuilt local plugin (ADR-0004).

**Precedent.** `@quartz-themes/core`, the ecosystem's way of shipping a whole look, does the same
thing. Its 2.0.0 transformer has a no-op `textTransform` and emits inline stylesheets from
`externalResources()`, opening with its own `@layer quartz-base, obsidian-theme, …` declaration.
It never touches `custom.scss`.

**Rejected:**

- **Symlinking `custom.scss` to a tracked site file**, like `quartz.config.yaml`. esbuild resolves
  `componentResources.ts` to its real path, so the `custom.scss` import always hits the vendored
  location, and every e2e fixture root symlinks that same source directory. Plugin specs and the
  no-bleed baseline would then run against a *styled* site, and a plugin that looks right only
  because site CSS covers for it would pass. Keeping fixtures stock would mean copying the Quartz
  source into each fixture root. The symlink would also hide an upstream-owned file from the drift
  check.
- **A one-line vendored stack declaration in `custom.scss`**, with the body in a plugin. It carries
  the costs of both approaches plus an upstream proposal nobody wants.
- **An upstream proposal to let the config name a site stylesheet.** Not needed once a plugin can do
  it.


## Amendment: the scheme changes under a loaded page

_2026-09-25, from [Does the site ship a light scheme?](https://github.com/chaoticgoodcomputing/blog/issues/41)._

The site ships both colour schemes and enables the stock `@quartz-community/darkmode` toggle. v4 went
dark-only because styling didn't reach MDX and custom components consistently, and this ADR is what
fixed that. Dark-only would now cost more than both schemes. Core writes `lightMode` on `:root` and
`darkMode` only under `:root[saved-theme="dark"]`
([theme.ts:197](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/util/theme.ts#L197)),
and dual-theme code blocks key on the same attribute
([syntax.scss:10](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/styles/syntax.scss#L10)).
Only the darkmode plugin sets that attribute, so going without it would take three overrides that
exist only to undo a stock feature. With the plugin enabled, it is also the `color-scheme` source that
the colour-values amendment requires.

**The scheme is no longer fixed for the life of a page.** A visitor can toggle it on a loaded page.
The darkmode plugin then flips `saved-theme` and dispatches `themechange` on `document`, and there is
no navigation. CSS follows by itself. Anything that resolved a colour in script does not.

- **Every `cgc-*` plugin or widget that paints a resolved colour re-resolves it and redraws on
  `themechange`.** That covers canvas, WebGL, and any inline style written from a computed value. It
  extends the probe rule above: resolve through a probe when the page loads, and again whenever the
  scheme changes.
- **A harness spec toggles the scheme on a loaded page.** The fixture's two-scheme rendering (ADR-0004)
  loads each scheme fresh, so it can't catch a colour that goes stale on toggle. Every package that
  paints resolved colours gets a spec that loads the page, toggles, and checks the repaint.

## Amendment: the tag bubble, and what the tag colour paints

_2026-09-26, from the owner's review notes of that day, on
[The tag glossary, one bubble style, and aligned badges](https://github.com/chaoticgoodcomputing/blog/issues/82).
The notes come after spec #53 and win where they differ from an earlier ticket or ADR._

The owner named the parts of a tag as the site draws one (the family glossary's **Tag slug**, **Tag
name**, **Tag icon**, **Tag bubble** and **Tag badge**) and asked for one bubble style everywhere,
"shared across both the list/badges as well as on graph nodes", coloured as:

1. a coloured outer rim,
2. a light or dark gray circle,
3. a black or white icon.

**Decided:** the tag colour paints **only the bubble's rim**. The circle is the theme's
`var(--lightgray)`, light in the light scheme and dark in the dark. The icon is the theme's
`var(--dark)`, black in light and white in dark. Both are documented theme colours (rule 6), so a theme
that reskins them reskins every bubble, and neither is a property of ours: a `--cgc-tag-…` name for
either would sit in the tag engine's namespace, which is why cgc-tag-list's ADR-0001 kept the tag
colour off a package property in the first place.

This **replaces** two earlier rules:

- the family glossary's **Tag colour**, from this ADR's colour-value amendment and #31, which had the
  tag colour paint "marks (the badge ring, the icon glyph, the graph node)". It now paints a bubble's
  rim and nothing else of the bubble, and still never text;
- #71's icon in the tag colour, which cgc-tag-list's
  [ADR-0001](../../quartz/plugins/quartz-tag-list/docs/adr/0001-the-ring-carries-the-tag-colour.md)
  had follow from the ring's inline `color`. The rim now takes the tag colour as an inline
  `border-color`, and the icon's `currentColor` is the bubble's `--dark`.

**In a badge, the circle is the page's `--light`.** A badge's own background is also
`--lightgray`, so a bubble in a badge showed only its rim, the circle lost against the badge, until
hover turned the badge `--gray`. On seeing that, the owner decided (2026-09-26) that a bubble in a
badge sets its circle apart: it takes the page's `var(--light)`, which differs from the badge's
`--lightgray` at rest and from its `--gray` on hover, in both schemes. The rim and the icon are
unchanged, and so is every bubble that isn't in a badge, the graph's nodes among them. The badge's
circle is the bubble's `cgc-tag-bubble--badge` modifier, which `./bubble` publishes as
`BADGE_PALETTE` and the lint holds to it.

**The one exception: the tag explorer.** Its icons are bare glyphs in a tag's row, neither bubbles nor
badges, so they stay painted whole in the tag colour. In the owner's words: "the Tag Explorer icons
being colored should be the exception, since those aren't the bubble/badge style."

**One bubble, in a library.** The bubble is built once, in `@chaoticgoodcomputing/tags-core`
(`./bubble` and `./bubble.css`), not in each plugin that draws one. Its stylesheet is library CSS under
the libraries amendment above: one block, `cgc-tag-bubble`, checked by the library's lint and by each
consuming plugin's build, and shipped by each consumer inside its own family sublayer, since a library
has no `externalResources()`. `./bubble` also publishes the palette as property names (`rim`, the tag's
colour property; `circle`, `--lightgray`; `icon`, `--dark`; and a badge's `circle`, `--light`), which the
lint holds the stylesheet to.
So a canvas, which CSS can't reach, paints a bubble from the same three through the colour resolver,
and re-resolves them on `themechange` as the scheme amendment above requires. The graph's nodes
become bubbles that way, in their own change
([cgc-graph's ADR-0004, bubble amendment](../../quartz/plugins/quartz-graph/docs/adr/0004-nodes-are-painted-with-their-tag.md#amendment-a-node-with-a-tag-is-its-tags-bubble), #83).

**Rejected:**

- **The icon in the tag colour, on a gray circle.** Tag colours are chosen to read against the page,
  not against `--lightgray`, and several are close to it in one scheme or the other. A dark icon on a
  light circle, or a light one on a dark circle, reads in every scheme and every tag.
- **A bubble per plugin**, each package's own classes and rules, as the ring was: two copies of the
  same markup and CSS, in cgc-tag-list and cgc-post-listing, which every change had to make twice. One
  block gives the family one look to change, and the graph one palette to read.

## Amendment: the site self-hosts its fonts

_2026-09-26, from the owner's review notes of that day ("Font seems to be different across the
board. It seems very default"), on
[site-styles self-hosts the fonts](https://github.com/chaoticgoodcomputing/blog/issues/84)._

The site's font rules were right: every page asks for Inter and IBM Plex Mono. The files never
arrived. The site config had core self-host them (`fontOrigin: googleFonts` with `cdnCaching: false`,
[componentResources.ts:285](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/emitters/componentResources.ts#L285)),
and core writes each one into the stylesheet at an absolute production URL,
`https://${baseUrl}/static/fonts/…`
([theme.ts:134](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/util/theme.ts#L134)).
On any host but production (a local serve, a preview, staging) every font 404s and the page falls
back to system fonts. The site-plugin amendment above made `site-styles` "a CSS-only transformer".
Where the two conflict, this amendment wins.

**Decided:** fonts are application CSS, so the site ships them, from `site-styles`.

- **Core fetches nothing.** The site config's `theme.fontOrigin` is `local`, which leaves the fonts
  to the site
  ([componentResources.ts:283](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/emitters/componentResources.ts#L283)).
  `@quartz-community/quartz-fonts` stays on with `fontOrigin: local` too, so it links nothing and
  only sets the font properties to the site's typography.
- **site-styles fetches the fonts at its own build**, never at the site's and never at run time:
  Inter as its variable font, 400 to 700, upright and italic, and IBM Plex Mono at 400, 600 and 700,
  every subset Google Fonts serves, as woff2. The build keeps them in its `node_modules/.cache/`, so a
  rebuild needs no network, and fails if a fetch fails.
- **It declares them in its own stylesheet**, one `@font-face` per face in the `site` layer's
  `generic` tier, at root-relative URLs under the site's base path: the path of `baseUrl`, as core
  computes it for `data-basepath`, and nothing under `serve`. cgc-tags links its stylesheet the same
  way (its ADR-0001). A site moved to another base path after building would need rebuilding; one
  moved to another host would not.
- **It ships the files at a path it owns, `static/site-styles/fonts/`,** never core's
  `static/fonts/`. Full builds run every emitter at once
  ([emit.ts:82](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/processors/emit.ts#L82)),
  and the stock Static emitter copies the vendored copy's `static/` into the same output directory
  ([static.ts:18](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/emitters/static.ts#L18)).
  It writes nothing under `static/site-styles/`, so the two never touch the same file. That is what
  rules out overwriting a stock file, as the site icon has to (a post-build copy, VENDORED.md).
- **So site-styles is a transformer and an emitter.** It exports one factory for each, as cgc-tags
  does, because a plugin in two categories is instantiated once for each and the loader picks a
  factory by its shape
  ([config-loader.ts:584](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/config-loader.ts#L584)).
  Only the transformer emits the stylesheet, so it is emitted once, still first.
- **A spec serves the site away from its `baseUrl`.** `site-styles/e2e/fonts.spec.mjs` builds the
  site config and serves it at another origin, at its root and under a base path, and proves that
  every face loads from there, that text and headings are drawn in Inter and code in IBM Plex Mono,
  and that no font request leaves the site's origin. The site-config spec, which serves at the
  `baseUrl` itself, could not have caught this.

**Rejected:**

- **A vendored fix to `processGoogleFonts`**, writing root-relative URLs. It is the right upstream
  change, but ADR-0001 keeps edits to the vendored copy for when no plugin route exists, and one does.
- **Linking Google Fonts from every page** (`cdnCaching: true`). Every page view would then ask a
  third party for the fonts, which v4 never did either.
- **Committing the woff2 files**, as v4 did. The fetch is cheap, cached, and keeps binaries out of git.
