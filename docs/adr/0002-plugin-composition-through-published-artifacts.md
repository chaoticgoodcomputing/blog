---
status: accepted
date: 2026-09-24
---

# Compose plugins through published artifacts, not shared configuration

[ADR-0001](./0001-customization-through-plugins.md) says customizations live in plugins. It
doesn't say how a _family_ of related plugins holds together. Quartz 5 plugins are separately
versioned npm packages that cannot read each other's configuration, so a group of customizations
sharing one body of config — six-plus consumers of one tag table, in the case that prompted this
— needs a composition pattern or it degenerates into duplicated config and private conventions.

We compose through an **engine and its consumers**. One non-visual engine plugin owns a domain's
configuration and publishes it as typed artifacts; consumer plugins declare a hard dependency on
the engine and read those artifacts. No plugin knows anything about another plugin's domain.

> Source links below point at **upstream Quartz** at
> [`97a2d05`](https://github.com/jackyzha0/quartz/tree/97a2d05f80c4c50534959b1d0d41cc4b3895625e)
> (v5.0.0) — the ref `quartz-v5/upstream.json` pins our vendored copy to. `nx run
site-v5:diff-upstream` reports that copy byte-identical to it, so the line numbers hold for
> both.

## Why

**Options are unreachable across plugins, by design.** The loader merges a plugin's defaults,
config options and registry overrides into a local, hands it to the factory, and discards it
([config-loader.ts:465-466](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/config-loader.ts#L465-L466)).
[`PluginTypes`](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/types.ts#L15-L20)
stores constructed _instances_, and
[the instance types](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/types.ts#L27-L33)
declare a name plus hook functions and nothing else. Core's own cross-plugin coordination is
presence detection on a name string
([Head.tsx:34](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/components/Head.tsx#L34)).
There is no supported path from one plugin to another's configuration, so any design that wants
one is building a private convention.

**`fileData` is the sanctioned channel, and it is typed.** `QuartzPluginData` is vfile's `Data`
— an index signature plus the declaration-merging target `DataMap` — and the ecosystem augments
it exactly this way: `@quartz-community/types` declares the base field set, and plugins like
`note-properties` and `bases-page` each add their own slice. Publishing per-file data through
`fileData` gets first-class types and reaches components, page types, frames, filters and
emitters alike.

**Artifacts must be plain data, because of the worker boundary.** Parsing goes multi-threaded
above 191 markdown files
([parse.ts:154-155](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/processors/parse.ts#L154-L155))
and every vfile is structured-cloned across the thread boundary. Plain objects, arrays, `Date`,
`Map` and `Set` survive; functions, class instances with methods, symbols and closures do not. A
design that publishes a _resolver_ rather than _resolved values_ works on a small vault and
breaks silently once the corpus grows. This repo's corpus is already past the threshold.

**`ctx` is not a parse-to-emit channel.** Workers receive
[a stripped, serializable context](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/processors/parse.ts#L174-L181)
and [rebuild their own from a re-imported config](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/worker.ts#L20-L23),
so a write made during parse in a worker lands on a throwaway object in another thread.

**Emitter-to-emitter handoff is unreliable.** Every emitter except `ComponentResources` and
`PageTypeDispatcher` runs
[under `Promise.all` in a full build](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/processors/emit.ts#L82-L90)
but [sequentially on watch rebuild](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/build.ts#L324-L350),
and `order` does not constrain it. An emitter reading another emitter's output passes under
`serve` and fails in CI.

**Dependencies are enforced, so the pattern has teeth.** `manifest.dependencies` is
[validated before the build runs](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/config-loader.ts#L100-L192):
a missing dependency, an order inversion, and a dependency cycle each produce an error, and any
error [aborts the load](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/config-loader.ts#L313-L320).
A consumer cannot silently run without its engine.

**Shareability is the constraint that shapes the rest** (ADR-0001). An engine that knows about a
consumer's domain cannot be installed by anyone who doesn't share that domain. The alternative to
an engine — duplicating the table into each consumer's own options — makes a human edit N copies
and lets them drift apart silently.

## The rule

1. **One owner per domain of configuration.** The engine holds the table. Nothing else holds a
   copy of it.
2. **Publish through two channels, never a third.** Per-file resolved values on `fileData`, typed
   by declaration merging; and a pre-resolved JSON file for client-side consumers. Not `ctx`, not
   another plugin's emitted output, not extra properties smuggled onto a plugin instance.
3. **Consumers declare `manifest.dependencies` on the engine**, so the coupling is checked by the
   build rather than documented in a README.
4. **Shared logic travels as a plain npm library, not as a plugin.** A library has no Quartz
   hooks, no presence in plugin config, and no exposure to the shareability test. Reserve
   "plugin" for things the plugin system loads.
5. **An engine knows nothing about its consumers' domains.** Extension is artifact-side: a
   consumer resolves its own table and merges its own slice into the published structure,
   declaring the added fields by augmenting an `interface`. Config-side extension — a consumer
   adding keys to the engine's options — is forbidden, because it puts knowledge of a downstream
   concern into the engine's configuration.
6. **Artifacts carry plain cloneable data only.** Publish resolved values, not resolvers.
7. **An engine publishes identifiers, never rendered output.** Rendering is a consumer concern,
   and keeping it out is what lets an engine stay non-visual.

## Considered alternatives

- **One large plugin holding the domain and all its consumers.** Rejected. It forfeits
  independent versioning, makes every consumer's concern part of the engine's configuration, and
  fails the shareability test the moment any one concern is site-specific.
- **Extra keys under `configuration:`.** This genuinely works: `QuartzPluginsJson.configuration`
  is `Record<string, unknown>` and is
  [spread wholesale](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/config-loader.ts#L259-L262)
  into `ctx.cfg.configuration`, reachable by every plugin. The schema's `additionalProperties:
false` is not enforced — there is no JSON-schema validator in the dependency tree, per-plugin
  `configSchema` is read but never applied, and upstream's own shipped configs already violate
  the schema. Rejected as the default anyway: it depends on a non-standard config key that a
  stock installer's editor flags as an error, and it couples every consumer to something outside
  the plugin system. **Retained as an explicit fallback** if plugin options prove unworkable.
- **Self-publishing resolved options on the plugin instance.** Also works — instance types are
  structural and core strips no extra properties — and a sibling could read them by finding the
  instance by name. Rejected: a convention wearing an API's clothes, invisible in the type
  system, and silently broken the day core seals those objects.
- **Post-processing another plugin's emitted output.** Rejected outright on the non-deterministic
  emitter ordering above.
- **An open metadata bag on the engine's table**, letting consumers add arbitrary keys the engine
  passes through. Tempting, because a tag would be declared in exactly one place. Rejected: it
  imports downstream knowledge into the engine's config and leaves the engine holding keys it
  cannot validate or explain.

## Consequences

- **Declaring a thing in two domains touches two files.** Accepted deliberately: they are two
  decisions, and pretending otherwise is what the open metadata bag would have done.
- **A consumer that extends the published structure must be a transformer**, since transformers
  are the only hook handed `(tree, file)`. A component-only or emitter-only consumer can read the
  artifact but not add to it.
- **Upstream packages cannot participate.** An upstream component reads only its own options and
  the global `fetchData` promise, which core
  [hardcodes to `static/contentIndex.json`](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/components/renderPage.tsx#L74-L75).
  Where we want upstream behaviour _and_ our artifacts, we ship our own component, or replace
  only the rendering body and inherit upstream's generation — and accept the maintenance that
  creates.
- **Each engine is one more package to version and publish.** Packaging is a separate concern,
  tracked on [Plugin packaging and shared SCSS tokens](https://github.com/chaoticgoodcomputing/blog/issues/22).
- **The pattern is a convention, not a framework.** Nothing in Quartz enforces rules 1, 2, 5, 6
  or 7; only rule 3 is machine-checked. Reviews carry the rest.

## Worked example: the tag engine

Tag colours and icons are read by `TagList`, `TagExplorer`, graph tag nodes, the tag index, post
listings, OG image generation and structured data. In v4 all of it was one config block read
directly by seven forked files.

Under this ADR it becomes: a **library** (`@cgc/tags-core`) holding the resolution rule, the
`TagProperties` interface and the `fileData` type augmentation; an **engine** (`cgc-tags`)
owning the tag table as plugin options, writing resolved per-tag properties and a resolved
page-level primary onto `fileData`, and emitting a pre-resolved flat map for client code; and
**consumers** — `cgc-graph`, `cgc-structured-data`, a tag-page body, the private-page protection
— each declaring `cgc-tags` as a dependency and reading its artifacts. `cgc-structured-data`
keeps its own tag table and resolves it with the library, rather than the engine growing an
opinion about schema.org. Icon rendering is a further consumer: the engine publishes
`"mdi:robot"` and never a pixel.

## Amendment: library scope

_2026-09-25, from [Widget library: name, home and shape for `pdf-viewer` and `bluesky-post`](https://github.com/chaoticgoodcomputing/blog/issues/36)._

Libraries are published under **`@chaoticgoodcomputing/`**, the npm scope we own, not `@cgc/`.
The worked example's `@cgc/tags-core` is `@chaoticgoodcomputing/tags-core`. Each library lives
at `quartz-v5/libs/<name>`, and its Nx project name is its npm name. Plugins keep unscoped
`cgc-*` names, because for a local source the loader takes a plugin's identity from its directory.

## Amendment: consumers declare an engine by its plugin name

_2026-09-25, from [One manifest.dependencies string can't match both the site and the e2e fixture](https://github.com/chaoticgoodcomputing/blog/issues/40)._

Rule 3 is refined. A consumer names its engine by **plugin name**:
`manifest.dependencies: ["cgc-styles"]`. It never uses a `source:` path.

**Why.** The loader matches dependency strings against the site's `source:` strings
[verbatim](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/config-loader.ts#L122-L130),
and local sources are relative to wherever the site runs. The same consumer is loaded at three
sites: the real site (`../plugins/cgc-styles`), the e2e fixture (`../../plugins/cgc-styles`) and a
downstream stock site. The downstream site installs from this monorepo with an object source
carrying `subdir`, and the loader keys object sources by `JSON.stringify`, so no dependency string
can match it. One `package.json` can't satisfy all three. The plugin name is the one identity a
plugin has at every site: every plugin installs to
[`.quartz/plugins/<name>`](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/gitLoader.ts#L433),
so names are already unique within a site.

**This needs a vendored change.** Stock `validateDependencies` never matches by name, although it
builds a name map it never reads. The change resolves each dependency by exact source first, then
by name. The presence, order and cycle checks all use the resolved entry, so the order check can't
silently fall back to `defaultOrder` 50. It is tracked with its upstream proposal on
[Upstream proposal: match `manifest.dependencies` by plugin name](https://github.com/chaoticgoodcomputing/blog/issues/47),
and until that proposal lands, **every consumer fails the shareability test**. That is the same
trade `cgc-mdx` makes for awaitable `generate`, and it costs nothing before cutover, since no
`cgc-*` package is published before then.

**A downstream site sets `name:` on the source.** A `subdir` install is named after the repo unless
the site overrides it, which would make every `cgc-*` plugin `blog`, all installing over each
other. Each package's README shows the source with `name:` set.

**Rejected:** putting the fixture roots at the vendored root's depth, or symlinking
`tests/plugins → ../plugins`, which reconcile our two sites and leave every consumer unshareable;
and dropping `manifest.dependencies` for a runtime check on the engine's artifact, which loses
the loader's order check, the guarantee the family layer's position rests on.
