# Plugin e2e suite

The end-to-end suite every `cgc-*` plugin is developed against: a small fixture vault, built into a
real Quartz site and driven by a browser. Inherits the family glossary in
[`quartz-v5/CONTEXT.md`](../CONTEXT.md); the decision is [ADR-0004](../../docs/adr/0004-playwright-e2e-as-the-plugin-tdd-loop.md).

## Language

**Content fixture**:
The vault at `content-fixture/` that the suite builds. Small on purpose, and grown one page at a time
as a plugin needs a case.
_Avoid_: test vault, sample content, fixture vault

**Fixture site**:
The Quartz site built from the content fixture with our plugins enabled.
_Avoid_: test site, fixture build

**Baseline**:
The same fixture site with every one of our plugins disabled. What the no-bleed check compares against.
_Avoid_: control, vanilla site, stock site

**Fixture root**:
The directory a fixture site is built from — the vendored copy symlinked in, with the suite's own
config beside it. One per variant.
_Avoid_: shadow root (collides with the DOM's), sandbox, workspace

**Fixture plugin**:
A plugin that exists only for the suite, under `fixture-plugins/`: a stand-in for a third-party
plugin the fixture must not run (`fixture-theme`, for `@quartz-themes/core`), or the smallest
consumer of one of our engines (`fixture-consumer`). Plain ESM with no build step. One the fixture
config enables counts as one of our plugins, so the baseline disables it.
_Avoid_: test plugin, mock plugin, stub (in prose)

**Owned element**:
An element one of our plugins rendered, recognised by a `cgc-` class on it or an ancestor.
_Avoid_: plugin element, our DOM

**Bleed**:
A computed style on an element no plugin owns that differs between the fixture site and the baseline.
The rendered-page form of breaking ADR-0003's rule 2.
_Avoid_: leak, collision, style pollution

**Harness**:
The shared `test` and `expect`, with their fixtures, that every spec imports from `harness/test.mjs`.
_Avoid_: test utils, helpers

**Scratch site**:
A one-off site a spec builds from content it supplies itself, for cases the content fixture must not
carry, chiefly builds that are supposed to fail, or a site built from the **site config** rather than
the fixture's (the harness's `siteConfig()`, with `routeSite()` to browse it), or a **serve run**
(`serve: true`) for what a plugin does under `quartz build --serve`. Its content lives outside the
repo, because Quartz's content glob honours `.gitignore`.
_Avoid_: temp site, throwaway build

**Serve run**:
A **scratch site** built as `quartz build --serve` and stopped once its server is up, on ports the
OS picks. Only for what a plugin does differently under serve (ADR-0004).

**Probe plugin**:
A throwaway plugin a library's spec compiles from source (`harness/probe.mjs`) and loads into a
scratch site, standing in for the plugin that will one day use that capability of the library.
_Avoid_: test plugin, mock plugin, fake

**Source host**:
A local web server a spec starts to stand in for a remote site that a build fetches from, such as
the host of an annotation page's source document (`harness/source-host.mjs`). It listens on a port the
OS picks, so a build never reaches the network.
_Avoid_: mock server, fake remote, test server
