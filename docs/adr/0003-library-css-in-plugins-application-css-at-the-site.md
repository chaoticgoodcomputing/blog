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
Evidence: the local `prototype/cgc-layer` branch (commit `8cbf5e8`), at `quartz-v5/tests/proto-layer/PROTOTYPE.md`.
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
  styled `cgc-*` package lists it in `manifest.dependencies`. The loader then **refuses** to build
  if a consumer is ordered before the engine, or if the engine is missing
  ([config-loader.ts:142](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/config-loader.ts#L142)).
  This is ADR-0002's engine shape with a cascade position as its published artifact, and it plays
  the part of ITCSS's settings tier for the family: one declaration, one knob. Its `order` must
  exceed any theme's (`@quartz-themes/core` defaults to 10). _Open:_ the dependency string is matched exactly and is
  relative to the site root, so one `package.json` can't yet satisfy both the site and the e2e
  fixture. See [One manifest.dependencies string can't match both the site and the e2e fixture](https://github.com/chaoticgoodcomputing/blog/issues/40).
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
  ([config-loader.ts:542](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/config-loader.ts#L542)).
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
- **Rules 1, 2 and 4–9 apply unchanged.** Rule 11 does not reach a library. A library has no
  `externalResources()` of its own, so the layer its CSS lands in is the consuming plugin's
  business. For widgets, that is [Which cascade layer does widget CSS land in?](https://github.com/chaoticgoodcomputing/blog/issues/45).
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
`quartz-v5/site-plugins/site-styles/`. A site plugin fails the shareability test on purpose, because
it *is* this site. It is a CSS-only transformer that emits, from `externalResources()`:

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
  the spec says so. Widget CSS has no slot yet; that is
  [Which cascade layer does widget CSS land in?](https://github.com/chaoticgoodcomputing/blog/issues/45)'s
  call, and the answer is an edit to this one statement.
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

