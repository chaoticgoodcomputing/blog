# Plugin e2e suite

The end-to-end suite every `quartz-*` plugin is developed against: a small fixture vault, built into a
real Quartz site and driven by a browser. Inherits the family glossary in
[`quartz/CONTEXT.md`](../CONTEXT.md); the decision is [ADR-0004](../../docs/adr/0004-playwright-e2e-as-the-plugin-tdd-loop.md).

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
Where one of ours replaces a stock plugin whose pages the baseline would otherwise lose, the stock
one is on in its place (`STANDS_IN_FOR` in `harness/site.mjs`): stock tag-page, for `quartz-tag-page`.
_Avoid_: control, vanilla site, stock site

**Fixture root**:
The directory a fixture site is built from — Quartz Core symlinked in, with the suite's own
config beside it. One per variant. It outlives the plugins it was first built with, and Quartz never prunes
`.quartz/plugins/`, so every build first removes the links there to a plugin that has gone, renamed
or now a package (`pruneGonePlugins`, #94). Quartz bundles `quartz.ts` from Core's own path, so every
fixture and scratch root runs the site's steering file; its one rule (the home page's components, #70)
applies only to a config that loads `site-components`, so a fixture site stays a stock one.
_Avoid_: shadow root (collides with the DOM's), sandbox, workspace

**Fixture icon collection**:
The fixture's own icon collection, `custom:`, at `fixture-icons/`: SVG files painted in hard-coded
colours, so a spec can see them turned into `currentColor`. The fixture config names it once, on
`quartz-tag-list`, and every plugin that draws icons shares it through the `*iconCollections` anchor.
_Avoid_: test icons, custom icons (the site's own set, in `quartz/icons/`)

**Fixture plugin**:
A plugin that exists only for the suite, under `fixture-plugins/`: a stand-in for a third-party
plugin the fixture must not run (`fixture-theme`, for `@quartz-themes/core`), or the smallest
consumer of one of our engines (`fixture-consumer` for quartz-styles; `fixture-tag-reader`, which
writes out the tag data quartz-tags publishes on each page). Plain ESM with no build step. One the
fixture config enables counts as one of our plugins, so the baseline disables it.
Listed by a local source, `../fixture-plugins/<name>`, resolved against the fixture root: the one
sanctioned exception to "every plugin loads by package name" (#96). Quartz imports a package source
only through the site package's `node_modules`, so making these packages would list test-only
plugins among the real site's dependencies; and they need no build, so the harness still has no
code path that builds or rewrites a local source. Quartz links each into the root's
`.quartz/plugins/`. A scratch root is always made beside the fixture roots, so the same source
resolves there.
_Avoid_: test plugin, mock plugin, stub (in prose)

**Owned element**:
An element one of our plugins rendered, recognised by a `cgc-` class on it or an ancestor.
_Avoid_: plugin element, our DOM

**Bleed**:
A computed style on an element no plugin owns that differs between the fixture site and the baseline.
The rendered-page form of breaking ADR-0003's rule 2.
_Avoid_: leak, collision, style pollution

**Harness**:
The shared `test` and `expect`, with their fixtures, that every spec imports from `harness/test.mjs`,
and the modules beside it that specs share rather than copy: scratch sites and configs (`site.mjs`),
the page's cascade layers (`layers.mjs`), the stand-ins, probe plugins and source hosts. Every
build it starts takes the build lock, so builds run one at a time (ADR-0004).
_Avoid_: test utils, helpers

**Scratch site**:
A one-off site a spec builds from content it supplies itself, for cases the content fixture must not
carry, chiefly builds that are supposed to fail, or a site built from the **site config** rather than
the fixture's (the harness's `siteConfig()`, with `routeSite()` to browse it), or a **serve run**
(`serve: true`) for what a plugin does under `quartz build --serve`. Its content lives outside the
repo, because Quartz's content glob honours `.gitignore`. Content that imports packages, as the
vault's `.mdx` articles do, gets a `node_modules` link among its files, which the site's
`ignorePatterns` keep out of the site. A spec that keeps one removes it when it is done: the
`scratch` fixture does that when the test ends.
_Avoid_: temp site, throwaway build

**Serve run**:
A **scratch site** built as `quartz build --serve` and stopped once its server is up, on ports the
OS picks. Only for what a plugin does differently under serve (ADR-0004). Left up instead
(`serveScratchSite`), it shows what a rebuild does when the spec changes the content under it.

**Probe plugin**:
A throwaway plugin a library's spec compiles from source (`harness/probe.mjs`) and loads into a
scratch site, standing in for a plugin that uses (or will one day use) that capability of the
library, so the library is tested on its own. It inlines everything, Quartz's shared packages as
Core's copies, since a library never has its own (#98).
_Avoid_: test plugin, mock plugin, fake

**Source host**:
A local web server a spec starts to stand in for a remote site that a build fetches from, such as
the host of an annotation page's source document (`harness/source-host.mjs`). It listens on a port the
OS picks, so a build never reaches the network.
_Avoid_: mock server, fake remote, test server

**Fixture cache**:
What a fixture build would otherwise fetch from the network, written by the harness into each
fixture root's `.cache/` before it builds (`FIXTURE_CACHE` in `harness/site.mjs`): the source
document of the fixture's annotation page, `fixturePaper()` from `harness/source-host.mjs`, by
mirror name under `cgc-annotator/`. So that page's Viewer has a document to show though its
`annotation-target` never resolves. Generated rather than tracked, since no PDF goes in git (#59).
_Avoid_: fixture downloads, test cache

**Analytics stand-in**:
What answers a page's requests to PostHog in the suite (`harness/analytics.mjs`). Every context the
harness hands a spec answers PostHog's hosts with nothing, so no spec sends real analytics; a spec
about analytics puts a stand-in for PostHog's library there instead, which records each `init` and
`capture` the page makes.
_Avoid_: mock PostHog, fake analytics

**Bluesky stand-in**:
What answers a page's requests to Bluesky in the suite (`harness/bluesky.mjs`). Every context the
harness hands a spec answers Bluesky's hosts itself: the public API from made-up accounts and posts
in `fixture-bluesky/xrpc.json`, keyed by method and by the post, handle or actor asked for, and the
image CDN with one small picture. A post it doesn't hold is not found, as the real API says. A spec
about a failure routes the API on its page, which takes precedence.
_Avoid_: mock Bluesky, fake API

**GitHub stand-in**:
What answers a page's requests to GitHub in the suite (`harness/github.mjs`), as the **Bluesky
stand-in** answers Bluesky's: every context the harness hands a spec answers GitHub's REST API from
the made-up users in `fixture-github/users.json`, the contributions API with a made-up year for each
(a Thursday to a Wednesday, so both end weeks are partial), and the avatar host with one small
picture. A user it doesn't hold is not found. A spec about a failure routes the host on its page.
Both stand-ins answer through `harness/stand-in.mjs`, and so does a spec's own failure: an API's
JSON answer, with CORS headers.
_Avoid_: mock GitHub, fake API

### The seam

**Fixture seam**:
Where a plugin's behaviour is proven: specs against the fixture site, the baseline and scratch sites,
built cold from content the suite supplies. Everything above belongs to it.
_Avoid_: unit tests, plugin tests
