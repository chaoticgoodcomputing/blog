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

**Upstream proposal**:
The pull request that retires a vendored change by getting it accepted upstream. Every vendored
change is supposed to have one.

### Plugin composition

How a family of related plugins holds together. Recorded in
[ADR-0002](../docs/adr/0002-plugin-composition-through-published-artifacts.md).

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

### Distinguishing the two copies

**`quartz/`** (repo root):
The Quartz 4 copy that builds the live site. Nx project `site`.

**`quartz-v5/`**:
This context — the Quartz 5 vendored copy and its tooling. Nx project `site-v5`.
_Avoid_: referring to either as just "quartz" while both exist
