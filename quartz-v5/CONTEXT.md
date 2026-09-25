# Vendored Quartz 5

The copy of upstream Quartz 5 this repo builds against during the v4 → v5 migration, together
with the tooling that keeps it honest about how far it has drifted from upstream.

## Language

### The copy

**Vendored copy**:
Upstream Quartz's source, committed into this repo at `quartz-v5/quartz/` because Quartz ships
no npm package.
_Avoid_: fork, our Quartz, vendor branch

**Fork**:
Reserved for a copy we own and intend to diverge. The vendored copy is deliberately _not_ this,
and calling it a fork invites the ownership assumption [ADR-0001](../docs/adr/0001-customization-through-plugins.md) exists to prevent.

**Pinned ref**:
The exact upstream commit the vendored copy is claimed to match, recorded in `upstream.json`.
_Avoid_: version, upstream version

**Drift**:
Any difference between the vendored copy and its pinned ref. Drift is either a tracked vendored
change or a mistake; there is no third kind.

**Vendored change**:
An edit to the vendored copy, permitted only as a last resort and only with a ticket recording
why no plugin route existed and how it will be proposed upstream. Labelled `quartz:vendored`.
_Avoid_: patch, core change, hack

**Sync**:
Re-vendoring the copy at a newer upstream ref.
_Avoid_: upgrade, update, pull — `npx quartz upgrade` is a different, unusable thing here

### Customization

**Plugin**:
A unit of customization loaded through Quartz 5's plugin system — a page type, frame,
transformer, emitter or component. The default home for anything we add.

**Shareability test**:
The question _"would this plugin work on a stock copy of Quartz?"_ A plugin that fails it
depends on a vendored change and cannot be published, however well it works here.

**Shareable**:
Of a plugin: runs against unmodified upstream Quartz, so anyone can install it.
_Avoid_: portable, standalone

**Site plugin**:
A plugin that fails the shareability test on purpose, because it carries this site's own
application layer rather than something for others to install. The opposite of a `cgc-*` plugin,
which fails the test only by accident.
_Avoid_: customization (that is the whole category), local plugin, private plugin

**Site config**:
The real site's Quartz configuration, `quartz-v5/quartz.config.yaml`: which plugins the site runs
and with what options, its layout, theme and fonts. Tracked outside the vendored copy and reached
through a gitignored symlink inside it. A plugin is _on the real site_ once the site config enables
it. The e2e fixture has a config of its own, which is not this.
_Avoid_: real config, production config, the config (while the fixture's exists too)

**Plugin note**:
A shareable plugin's README, published on this site as a content note at `/plugins/<name>`. The
same file is the plugin's documentation on GitHub and its page on the site. Libraries and site
plugins have none.
_Avoid_: plugin page, docs page

**Upstream proposal**:
The pull request that retires a vendored change by getting it accepted upstream. Every vendored
change is supposed to have one.

**Release**:
One version shared by every package in `plugins/` and `libs/`, cut together whenever any of them
changes, and named by a `v<semver>` tag. A downstream site pins a release, never a package's own
version or a branch. Recorded in [ADR-0005](../docs/adr/0005-plugins-ship-as-source-in-batch-releases.md).
_Avoid_: package version, plugin version

**Release commit**:
The commit a release's tag points at: a child of `main` that changes package metadata only, setting
every package's version and pointing each plugin at the release's published libraries. It is never
merged into `main`. Recorded in [ADR-0005](../docs/adr/0005-plugins-ship-as-source-in-batch-releases.md).
_Avoid_: release branch, version bump

### Plugin composition

How a family of related plugins holds together. Recorded in
[ADR-0002](../docs/adr/0002-plugin-composition-through-published-artifacts.md).

**Plugin name**:
A plugin's identity within a site — the name it installs under, and the name a consumer uses to
declare it as a dependency. The same at every site that loads the plugin, unlike its source.
_Avoid_: plugin id, source (that is where a plugin comes from, and differs by site)

**Engine**:
A non-visual plugin that owns one domain's configuration and publishes it for other plugins to
read. Holds no rendering and no knowledge of its consumers.
_Avoid_: core plugin, base plugin, provider

**Consumer**:
A plugin that declares a hard dependency on an engine and reads its published artifacts rather
than its configuration.
_Avoid_: dependent, client, downstream plugin

**Published artifact**:
The data an engine exposes — per-file resolved values on `fileData`, or a pre-resolved JSON file
for client-side code. The only sanctioned channel between plugins.
_Avoid_: output, shared state, plugin context

**Library**:
A plain npm package carrying shared logic and types, with no Quartz hooks and no presence in
plugin config. Deliberately _not_ a **Plugin** — it sits outside the plugin system and so outside
the shareability test.
_Avoid_: utility plugin, non-visual plugin, helper plugin

### Styling

How our CSS takes a place in the page's cascade. Recorded in
[ADR-0003](../docs/adr/0003-library-css-in-plugins-application-css-at-the-site.md) and its amendment.

**Family layer**:
The `cgc` cascade layer, with one sublayer per package, that holds our plugins' own CSS. It sits
above core and themes, and below the site.
_Avoid_: cgc layer (in prose), plugin layer, our layer

**Vendor layer**:
A sublayer nested inside core's layer that holds third-party CSS a package bundles, so the
third-party CSS loses to core by construction.
_Avoid_: third-party layer, reset layer

**Stack declaration**:
The site's single `@layer` statement naming every layer on the page in order, emitted first by a
site plugin. Whatever it names takes precedence over the order plugins load in.
_Avoid_: layer order, cascade config

### Colour

**Colour value**:
Anything CSS accepts as a colour, including a `var(--…)` reference to a custom property that a
theme or the site defines. Every colour-valued option on a family plugin takes one, never a
hex-only string. A reference is the form that follows the theme; a literal asserts its own colour.
_Avoid_: hex, colour code, colour string

**Colour scheme**:
Light or dark: the one of a site's two palettes a visitor is seeing right now. A visitor can
switch it on a loaded page, so anything that resolves a colour must re-resolve when it changes.
Not a theme, which supplies both palettes. Quartz's own names (`saved-theme`, `themechange`) say
"theme" for this.
_Avoid_: theme, mode, darkmode (for the scheme itself)

**Tag colour**:
The colour value a tag carries, inherited from its nearest ancestor that has one, and published
as one `--cgc-tag-<tag>` custom property per tag. It is decorative: it paints marks (the badge
ring, the icon glyph, the graph node) and never text, and never sits under text. Not the same
thing as a theme's `--tag-color`, which is the text colour of a stock tag pill.
_Avoid_: tag background, category colour, `--tag-color` (for ours)

### Icons

**Icon id**:
A `prefix:name` string naming one icon, such as `mdi:robot` or `custom:d20`. Engines publish
icon ids, never drawn icons; the plugin that draws one resolves the id itself.
_Avoid_: icon (for the string), icon name, icon key

**Icon collection**:
A named set of icons addressed by one prefix. Either an installed third-party set (`mdi`) or one
a site supplies from its own SVG files (`custom`). A collection belongs to whoever supplies it, and
a site-supplied one is site configuration, never part of a shareable plugin or library.
_Avoid_: icon provider, icon pack, icon library

### Distinguishing the two copies

**`quartz/`** (repo root):
The Quartz 4 copy that builds the live site. Nx project `site`.

**`quartz-v5/`**:
This context — the Quartz 5 vendored copy and its tooling. Nx project `site-v5`.
_Avoid_: referring to either as just "quartz" while both exist
