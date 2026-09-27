# Quartz 5 and its Core

Quartz Core, the copy of upstream Quartz 5 this repo builds against during the v4 → v5 migration,
together with the tooling that keeps it honest about how far it has drifted from upstream, and the
plugins built on it.

## Language

### Quartz Core

**Quartz Core**:
Upstream Quartz's install root, vendored into this repo at `quartz-v5/core/` (`quartz/core/` after
cutover) because Quartz ships no npm package. Split into four tiers, listed once, in
`utils/core-tiers.mjs`: **Core source**, **steering files**, **scaffolding** and **pruned files**.
A pnpm project of its own, outside the repo's workspace, installed from a lock imported from
upstream's (VENDORED.md). "Core" for short.
_Avoid_: vendored copy (its old name), fork, our Quartz, vendor branch, engine (that is a plugin role)

**Core source**:
Core's `quartz/` tree, the one protected tier. It changes only through a **vendored change**. It
keeps its directory name because Quartz's own `bin` and imports point at it.
_Avoid_: core (alone, while Core is meant), Quartz source

**Steering file**:
A Core file Quartz's docs tell a site to edit: today `quartz.ts` and the **site config**. Edits to one
are configuration, never drift, and an upgrade never overwrites one.
_Avoid_: config file (the site config is one of two), override

**Scaffolding**:
Upstream's toolchain files at Core's root: `package.json`, `tsconfig.json`, the root `.d.ts` files,
the ignore and formatter files, and the LICENSE. Taken from upstream on each upgrade; `package.json`
stays exactly upstream's.
_Avoid_: boilerplate, root files

**Pruned file**:
An upstream file deliberately absent from Core, listed once in `utils/core-tiers.mjs`: upstream's
docs, CI workflows, Dockerfile, community files, default config and npm files. Never counted as
drift, and never brought back by an upgrade.
_Avoid_: deleted file, removed file

**Fork**:
Reserved for a copy we own and intend to diverge. Quartz Core is deliberately _not_ this, and
calling it a fork invites the ownership assumption [ADR-0001](../docs/adr/0001-customization-through-plugins.md) exists to prevent.

**Pinned ref**:
The exact upstream commit Quartz Core is claimed to match, recorded in `upstream.json`.
_Avoid_: version, upstream version

**Drift**:
Any difference between Quartz Core and its pinned ref except in steering files, pruned files and
Core's pnpm files (`pnpm-workspace.yaml`, `pnpm-lock.yaml`). Drift is either a tracked vendored
change or a mistake; there is no third kind. `site-v5:diff-upstream` prints all of it.
_Avoid_: diff (the command's output), divergence

**Vendored change**:
An edit to Core source, permitted only as a last resort and only with a ticket recording why no
plugin route existed and how it will be proposed upstream. Labelled `quartz:vendored`.
_Avoid_: patch, core change, hack

**Upgrade**:
Moving Core to another upstream ref, one way, with `site-v5:upgrade --ref=<ref>` (`utils/upgrade.mjs`,
#99). It re-applies the vendored changes hunk by hunk, stopping on a conflict and reporting the hunks
upstream has **absorbed**; takes the scaffolding; leaves the steering files alone; keeps the pruning;
converts upstream's npm lock under the lock check; and records the new pinned ref only once all of
that has succeeded. It prints the **API-surface report** first, and with `--verify` proves the result
(#100). Not Quartz's own `npx quartz upgrade`, which merges from a git remote added to the
enclosing repo and stays unusable here.
_Avoid_: sync (its old name: it suggests a two-way exchange), update, pull, re-vendor

**API-surface report**:
What changed between the pinned ref and an upgrade's target in every upstream API the site depends
on: the default config, the plugin config schema (with the site config validated against the
target's), the `quartz.ts` template, the exported plugin, component, loader, condition and frame
APIs, Core's dependencies and engines, and our packages' peer ranges the target's Core no longer
satisfies (`utils/api-report.mjs`, #100). The upgrade prints it before touching the tree;
`site-v5:upgrade-report` prints it alone.
_Avoid_: changelog, API diff (it covers config and dependencies too)

**Absorbed**:
Of a vendored change's hunk: already present in the upgrade's target, because upstream has taken
it. The upgrade reports each one, so its ticket and **upstream proposal** can be retired.
_Avoid_: merged, upstreamed (that is the proposal's outcome, not what the upgrade observes)

**Upstream cache**:
The upgrade's bare git repo of the upstream commits it has fetched, `quartz-v5/.upstream-cache/`
(gitignored). Upstream files Core prunes, such as the default config and the npm lock, are read
from it. The repo guards keep their checkouts of the pinned ref beside it, in `trees/<sha>/`.
_Avoid_: upstream clone, mirror

**Lock check**:
The proof that Core's pnpm lock holds exactly the packages of the npm lock it was imported from,
each at the same version, with nothing on either side the other lacks (`utils/core-lock.mjs`,
`site-v5:core-lock`).
_Avoid_: lock diff, lockfile lint

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

**Repo-only**:
Of a package: marked `"private": true` in its `package.json`, which makes npm and pnpm refuse to
publish it. It is never published to npm and is used only in this repo. The site package,
`quartz-v5/package.json` (`site-v5`), is one (#92), and the site plugins stay ones (#96). A plugin
not yet converted to a package carries the flag too, until it becomes one (#95). Not npm's
"private package", a restricted package on the registry, which nothing here means.
_Avoid_: private (alone), internal, unpublished

**Site config**:
The real site's Quartz configuration, `quartz-v5/core/quartz.config.yaml`: which plugins the site
runs and with what options, its layout, theme and fonts. A **steering file**, tracked inside Core,
where Quartz reads it. There is no default to fall back on, so a build without it is refused. A
plugin is _on the real site_ once the site config enables it. The e2e fixture has a config of its
own, which is not this.
_Avoid_: real config, production config, the config (while the fixture's exists too)

**Package source**:
A `source:` that names an npm package, as `@chaoticgoodcomputing/quartz-<name>` names ours: Quartz
imports it by name, and never copies or links it into `.quartz/plugins/` or builds it, as it does a
`@quartz-community/*` plugin (ADR-0005). In this repo the name resolves through the site package's
`node_modules` to the plugin's directory, and prebuild and the e2e harness build it first. A plugin
not yet converted is listed by a **local source** instead, a relative path Quartz links into
`.quartz/plugins/`; local sources are retired once every plugin is a package (#95, #96). A
package listed a second time, to place its component elsewhere, is an object source named for its
placement, `{ repo: "<package>", name: "email-subscribe-sidebar" }`, which Quartz imports by that
name: the site package also depends on the plugin under it, as an alias (VENDORED.md).
_Avoid_: npm source, registry plugin, package path

**Plugin note**:
A shareable plugin's README, published on this site as a content note at `/plugins/<dir>`, named for
the package's directory (`/plugins/quartz-graph`), through a symlink in the vault's `plugins/`. The
same file is the plugin's documentation on GitHub and its page on the site. Libraries and site
plugins have none. Every plugin note carries the tag `projects/site/plugins`, so that tag's page
lists them all, under the **plugin DAG**.
_Avoid_: plugin page, docs page

**Plugin DAG**:
The flowchart of how every package here depends on the others, on the description note of the tag
`projects/site/plugins`: a solid edge from a plugin to each plugin its manifest's `dependencies`
names, and a dotted one from a package to each **library** it builds with, with the site plugins
drawn apart. Generated from the manifests by `site-v5:plugin-dag` (#86), never edited by hand, and
guarded by a spec that fails when the note drifts from the packages.
_Avoid_: dependency graph (the graph is quartz-graph's), plugin map (the FORK-LEDGER's is the v4 → v5 map)

**Upstream proposal**:
The pull request that retires a vendored change by getting it accepted upstream. Every vendored
change is supposed to have one.

**Release**:
One version shared by every package in `plugins/` and `libs/`, cut together whenever any of them
changes, and named by a `v<semver>` tag. A downstream site pins a release, never a package's own
version or a branch. Recorded in [ADR-0005](../docs/adr/0005-plugins-ship-as-npm-packages.md); the
publishing ticket (#90) settles it after cutover. Nothing rewrites a package's metadata at a release:
`pnpm publish` turns each `workspace:*` into the published version.
_Avoid_: package version, plugin version

### Plugin composition

How a family of related plugins holds together. Recorded in
[ADR-0002](../docs/adr/0002-plugin-composition-through-published-artifacts.md).

**Plugin name**:
A plugin's identity within a site: its npm package name, `@chaoticgoodcomputing/quartz-<name>`
(#89). It is the `source:` a site lists and the name a consumer declares it by as a dependency,
since Quartz matches a dependency against the name it takes from each source, which for a package
is the whole package name. The same at every site that loads the plugin.
_Avoid_: plugin id, manifest name (that is the `cgc-<name>` inside the package)

**Manifest name**:
The `name` in a plugin's `quartz` manifest, `cgc-<name>`, kept when the packages took their
`quartz-<name>` names (#89). It names the plugin's CSS: its BEM block and its sublayer of the
**family layer**, so a plugin's published class names never change with its package name. Not what
a site lists, nor what a consumer depends on.
_Avoid_: plugin name, package name, block name (in prose)

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

**Library-CSS check**:
ADR-0003's rules for library CSS, checked by machine in one library,
[`@chaoticgoodcomputing/css-check`](./libs/css-check/CONTEXT.md). Every styled plugin's build runs
it before bundling, and the widgets library's lint. It reads CSS and rewrites nothing.
_Avoid_: lint (the widgets target that runs it), stylelint, prefixing pass (a transform)

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
as one `--cgc-tag-<tag>` custom property per tag. It is decorative: it paints a **tag bubble**'s
rim and nothing else of the bubble, and never text, and never sits under text. The tag explorer's
icons, which are not bubbles, are the one mark it paints whole
([ADR-0003](../docs/adr/0003-library-css-in-plugins-application-css-at-the-site.md)'s tag bubble
amendment). Not the same thing as a theme's `--tag-color`, which is the text colour of a stock tag
pill.
_Avoid_: tag background, category colour, `--tag-color` (for ours)

### Tags

The parts of a tag as the site shows one, named in the owner's review notes of 2026-09-26 (#82).

**Tag slug**:
A tag's full path, every level from the top with `/` between them:
`engineering/languages/typescript`. How every plugin and rule names a tag. Not a page's slug.
_Avoid_: tag path, full tag, tag (where the name is meant)

**Tag name**:
The last level of a tag slug: `typescript` in `engineering/languages/typescript`. What a reader
reads a tag by.
_Avoid_: label, leaf, short name, segment

**Tag icon**:
The icon a tag is drawn with, as the reader sees it: its own **icon id**, or its nearest
ancestor's, drawn. A tag with none in its lineage has no icon.
_Avoid_: glyph (except for what the reader sees), emoji, symbol

**Tag bubble**:
The circle that holds a tag's icon, drawn the same wherever the site shows one, in a badge or as a
graph node: a rim in the tag colour, a circle in the theme's light or dark gray, and the icon in its
black or white. It holds no text. In a **tag badge**, whose own background is that gray, the circle
is the page's background colour instead, so it stands out from the badge.
_Avoid_: ring (its old name), dot, icon badge, node (for the bubble itself)

**Tag badge**:
A tag bubble followed by `#` and the tag name, as one string, and, where a plugin shows it, the
count of pages under the tag, all centred on one line. How a tag appears among text: under a
page's title, and in the post listing.
_Avoid_: pill, chip, tag link, tag button

### Icons

**Icon id**:
A `prefix:name` string naming one icon, such as `mdi:robot` or `custom:d20`. Engines publish
icon ids, never drawn icons; the plugin that draws one resolves the id itself. A **tag icon** is
a tag's icon id, drawn.
_Avoid_: icon (for the string), icon name, icon key

**Icon collection**:
A named set of icons addressed by one prefix. Either an installed third-party set (`mdi`) or one
a site supplies from its own SVG files (`custom`). A collection belongs to whoever supplies it, and
a site-supplied one is site configuration, never part of a shareable plugin or library.
_Avoid_: icon provider, icon pack, icon library

### Repo guards

**Repo guard**:
A fast, lint-style Node script that checks one rule about the repository's architecture against its
current state, lists every violation, and exits non-zero if there is any. No browser; seconds, not
minutes. Each is `utils/guards/<name>.guard.mjs`, built test-first against a scratch copy or fixture
that breaks its rule, and `site-v5:guards` runs them all, cached by Nx on the files they read. They
keep architecture checks out of the Playwright suite, which stays for what a reader, crawler or
downstream site sees. Quartz Core's (#97): `core-drift` (no **drift** beyond the recorded **vendored
changes**), `core-pruned`, `core-lock` (the **lock check**, plus a fresh `pnpm import`) and
`site-config` (the **site config** against Core's plugin config schema).
_Avoid_: lint (the formatters and linters are something else), check (alone), test (the e2e suite and
the `node --test` suites are tests; a guard checks the repo itself)

### Distinguishing the two copies

**`quartz/`** (repo root):
The Quartz 4 copy that builds the live site. Nx project `site`.

**`quartz-v5/`**:
This context — Quartz Core, its tooling, and our plugins. Nx project `site-v5`.
_Avoid_: referring to either as just "quartz" while both exist
