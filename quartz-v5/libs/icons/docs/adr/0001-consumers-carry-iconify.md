---
status: accepted
date: 2026-09-25
---

# A consuming plugin carries Iconify's packages as its own dependencies

The library draws icons while the site builds, with three of Iconify's packages: `@iconify/utils`
to draw, `@iconify-json/mdi` for MDI, and `@iconify/tools` to normalise a site collection's SVG
files (#29). ADR-0005's amendment has a plugin inline our libraries and list them as
`devDependencies`, with each library's third-party dependencies installed only for that build,
because the loader installs, builds, then prunes dev dependencies
([gitLoader.ts:389-410](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/gitLoader.ts#L389-L410)).
That only works for a library whose whole dependency tree can be inlined, and this one's can't.
Decided while building the library into its first consumer, `cgc-tag-list`, on
[`@chaoticgoodcomputing/icons`, drawn in tag badges](https://github.com/chaoticgoodcomputing/blog/issues/71).

**`@iconify/tools` can't be bundled for Node.** Its `cleanupSVG`, which every import runs, converts
styles to attributes with SVGO
([cleanup.ts:7](https://github.com/iconify/tools/blob/bd16da78f29c7df335508fac47fb36d327530914/@iconify/tools/src/svg/cleanup.ts#L7),
[svgo-style.ts:8](https://github.com/iconify/tools/blob/bd16da78f29c7df335508fac47fb36d327530914/@iconify/tools/src/svg/cleanup/svgo-style.ts#L8)).
SVGO parses CSS with css-tree, which loads its data files at run time through a `require` of its own
([data-patch.js:1-4](https://github.com/csstree/csstree/blob/8a6caba481be4cae4b0e8690af643ff8e59271f2/lib/data-patch.js#L1-L4)).
esbuild leaves that call alone, so a bundle for Node fails on load looking for `../data/patch.json`
beside the plugin's `dist/`. css-tree maps those files to prebuilt ones only through its `browser`
field, which esbuild honours only when building for the browser. _Measured:_ bundling the library
with `platform: "node"` builds, and the bundle throws `Cannot find module '../data/patch.json'` on
import.

## Decision

A plugin that inlines `@chaoticgoodcomputing/icons` keeps the library's `dependencies` external and
lists each one in its own `dependencies`, at exactly the library's version. The library itself stays
a `devDependency`, inlined as ADR-0005 has it. The plugin's `build.mjs` reads the library's
`package.json`, marks its dependencies (and their subpaths) external, and fails the build when the
plugin's `package.json` doesn't carry every one at the same spec, so the two lists can't drift.

The library pins its dependencies exactly, since every consumer must repeat them. MDI is then pinned
twice over: by the pnpm lockfile for the library's own install, and by each plugin's
`package-lock.json` for the copy it runs with. Nothing is fetched while the site builds.

An installed set resolves from wherever the library's code runs, which is the consuming plugin's
`dist/`, so the set a plugin can draw from is the one its own install holds.

## Consequences

- **Every consumer repeats three dependencies.** `cgc-tag-list` does now, and the tag explorer,
  backlinks, the graph and the Bluesky widget will, with the same check in each `build.mjs`.
- **A second installed set is two edits per consumer's worth:** the library's `dependencies` and each
  consumer's. The build check names any consumer that was missed.
- **The plugin's `dist/` stays small.** MDI's 3 MB of icon data stays in `node_modules`, read on the
  first icon drawn rather than parsed with the plugin.
- **Downstream, a plugin install also installs Iconify's packages,** from the plugin's own
  `dependencies`, and the prune leaves them.
- **Loading `@iconify/tools` costs about 0.2s per process** that imports the consumer's module,
  parse workers included, because the component must draw synchronously and so can't import it on
  demand.

## Considered alternatives

- **Inline everything, with an esbuild plugin that serves css-tree's prebuilt data.** It works for
  one consumer, but every consumer's build would carry a workaround for a transitive dependency's
  packaging.
- **Drop `@iconify/tools` and normalise site collections with `@iconify/utils` alone.** The decision
  on #29 chose `@iconify/tools` for exactly this job, and `@iconify/utils` has no SVG cleanup.
- **List the library in `dependencies`, not `devDependencies`, so the prune keeps its tree.** Locally
  npm only links a `file:` dependency and installs nothing behind it, so the plugin would still find
  no Iconify packages in its own `node_modules`.

## Amendment: the Bluesky widget draws ahead

_2026-09-25, from [`@chaoticgoodcomputing/widgets`: `bluesky-post` and the `/bluesky` client](https://github.com/chaoticgoodcomputing/blog/issues/75)._

The Bluesky widget turned out not to be a consumer in this ADR's sense. It lives in a library,
draws its icons in the browser, and has no build of its own, so it can't carry Iconify's packages
the way a plugin does. It draws its icons ahead of time with this library, a dev-time dependency,
into a committed module that its `lint` target checks against what this library draws
([`widgets`' ADR-0002](../../../widgets/docs/adr/0002-browser-icons-are-drawn-ahead.md)). The first
consequence above no longer names it: the plugins that inline this library still repeat its
dependencies, and a widget carries none of them.
