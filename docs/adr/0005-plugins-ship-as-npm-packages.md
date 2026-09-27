---
status: accepted
date: 2026-09-25
rewritten: 2026-09-27
---

# Plugins ship as npm packages

_Rewritten in place on 2026-09-27, from
[Quartz Core, a custom upgrade, and our plugins as npm packages](https://github.com/chaoticgoodcomputing/blog/issues/89)
([#93](https://github.com/chaoticgoodcomputing/blog/issues/93)), before anything was published. It
first recorded plugins installed from git source in batch releases; that route is summarised under
"Superseded approach" below._

Each shareable plugin is an npm package, `@chaoticgoodcomputing/quartz-<name>`, and a site loads it
by package name, exactly as it loads Quartz's own `@quartz-community/*` plugins:

```sh
npm install @chaoticgoodcomputing/quartz-graph
```

```yaml
plugins:
  - source: "@chaoticgoodcomputing/quartz-graph"
```

- **A package carries its built `dist/`.** `files: ["dist"]`, so the tarball holds `dist/`, the
  README, the LICENSE and `package.json`, and a site installs it with no build. `dist/` is still
  never committed: the registry tarball carries it.
- **Type declarations beside every entry.** A plugin's build emits a bundled `.d.ts` beside each
  `dist/` entry, through the `@chaoticgoodcomputing/declarations` library, and its `exports` name
  `types` and `import` for `.` and each subpath (`./components`, `./frames`), plus `./package.json`.
- **Quartz's shared packages are peers only**: Preact, `preact-render-to-string`, `vfile`, `unified`,
  `lightningcss`, `@quartz-community/*`. They resolve to the site's own copies, so a page has one
  Preact, with no `.npmrc` and nothing installed beside the plugin. A library takes them as peers
  too, and a plugin that inlines it takes the library's as its own, so no build bundles a copy (#98).
- **Our libraries are inlined, and are never a published plugin's dependencies.** A plugin lists each
  library it inlines, or whose code its build runs, as a `workspace:*` devDependency. The consumer's
  esbuild inlines its TypeScript source, and the declarations inline its types, so a site never
  installs a library. `pnpm publish` rewrites `workspace:*` to the published version, so no commit
  rewrites package metadata at a release.
- **Except a library whose dependencies can't be inlined.** Its consumers carry those packages as
  their own `dependencies`, at the library's exact versions, and keep them external. The first is
  `@chaoticgoodcomputing/icons`, whose Iconify packages load data files at run time:
  [libs/icons ADR-0001](../../quartz/libs/icons/docs/adr/0001-consumers-carry-iconify.md) (#71).
- **Names.** The package, its directory and its Nx project are `quartz-<name>`. The manifest's
  `quartz.name` stays `cgc-<name>`, and a plugin's CSS block and family layer are named from it, so
  its published class names never change with its package name.
- **No `requiresInstall`**, and no `private` flag. `version` is `0.0.0` on `main`.
- **Repo guards hold these rules** (`site:guards`, #98): the package contract, one copy of each
  shared package, package sources, and packs holding only `dist/`, README, LICENSE and
  `package.json`.
- **One version for everything**, cut together and tagged `v<semver>` (the **Release** in
  `quartz/CONTEXT.md`), until the publishing ticket,
  [#90](https://github.com/chaoticgoodcomputing/blog/issues/90), settles versioning after cutover.

> Source links point at upstream Quartz at
> [`97a2d05`](https://github.com/jackyzha0/quartz/tree/97a2d05f80c4c50534959b1d0d41cc4b3895625e)
> (v5.0.0). _Measured_ claims were run on the throwaway `spike/npm-package-plugins` branch (commit
> `844c2ad5`, not pushed), then on #93.

## Why

**It is Quartz's own route.** A `source:` that is a scoped package name is an npm package to Quartz
([gitLoader.ts:136-144](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/gitLoader.ts#L136-L144)).
The loader skips installing it
([config-loader.ts:272-274](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/config-loader.ts#L272-L274)),
reads its manifest through `import.meta.resolve("<name>/package.json")`
([:209-210](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/config-loader.ts#L209-L210))
and imports it by name
([:441-442](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/config-loader.ts#L441-L442)).
Nothing is cloned into `.quartz/plugins/`, and Quartz runs no npm on the plugin's behalf: no install,
no build, no prune. Every workaround the git route needed, below, was a workaround against Quartz's
other install routes.

**The declarations.** Quartz's plugin index, which a TypeScript layout override imports a plugin's
exports from, reads a package's exports from its `dist/index.d.ts` and skips a package without one
([gitLoader.ts:990-1006](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/gitLoader.ts#L990-L1006)).
It reads them with regular expressions that match only `export { … }`
([:1145-1148](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/gitLoader.ts#L1145-L1148)),
the one statement a tsup build writes. So the declarations are bundled per entry, one
`export { …, type Name }` each, as `@quartz-community/*` ship theirs. _Measured:_ the spike's graph
resolved and was skipped only for a missing `dist/index.d.ts`; with declarations it is in the index.

**One Preact.** A peer is never installed beside a plugin, by pnpm here (`autoInstallPeers: false`) or
by npm downstream, where a site's own Preact satisfies the peer. _Measured:_ from the graph's real
path, Preact, `lightningcss` and `@quartz-community/types` resolve to Core's copies.

**In this repo**, the site loads a package the way a downstream site does. The repo-only site package,
`quartz/package.json`, depends on each plugin by `workspace:*`, so its `node_modules` links to the
plugin's directory, and Quartz's `import(name)` from Core source reaches it by Node's upward walk.
Quartz Core's own `package.json` stays upstream's (VENDORED.md). _Measured:_ the real-site build
renders the graph by package name (#93), as does a fixture serve (`package-plugins.spec`). The real
site's serve was measured on the spike, and again on 2026-09-27 at `main` `26e5d077`, after every #89
ticket had merged: `quartz build --serve` over the real site config served `/`,
`/plugins/quartz-graph`, `/tags/projects/site/plugins` and `/resume.mdx` with the graph's markup, and
Core's `.quartz/plugins/` held no entry, so every plugin of ours, site plugins included, came by
package name.

**A plugin's CSS is named from its manifest.** A scoped package name isn't a CSS identifier, and the
**library-CSS check** would reject every selector in a block named `@chaoticgoodcomputing/quartz-…`.
Keeping `cgc-<name>` keeps every published class name and family layer as it was.

## Consequences

- **Nothing is published before cutover.** Publishing, the CI publish job with npm trusted
  publishing, versioning and the first release are #90's. `main` keeps every version at `0.0.0`.
- **A package README's install snippet** is `npm install @chaoticgoodcomputing/quartz-<name>` and a
  `source:` entry, with no git subdirectory, `.npmrc` or tag to pin.
- **The conversion is expand–contract.** #93 made package names load beside local paths and converted
  `quartz-graph`; #94 and #95 convert the rest; #96 retires local paths. A consumer declares an engine
  by package name once the engine is a package (#95), since Quartz matches a dependency on a package
  source by the full package name.
- **The site plugins stay out of this.** They become repo-only packages (#96), loaded by name the
  same way and never published.

## Superseded approach: plugins from git source, in batch releases

Until #89 a downstream site installed a plugin from this monorepo through `quartz plugin add` with a
git source, a `subdir` and a `name`. What that route needed, and why each piece is retired:

- **Source only; the loader builds.** With a `dist/` present the git loader skips `npm install`
  ([gitLoader.ts:374-381](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/gitLoader.ts#L374-L381)),
  so runtime dependencies would never install. Without one it runs `npm install`, the package's
  `build`, then `npm prune --omit=dev`. _Measured:_ `build.mjs` ran stand-alone in the clone, output
  byte-identical. The npm route needs no install-time build: the tarball carries `dist/`.
- **A package `.npmrc` with `legacy-peer-deps=true`.** The loader runs a plain `npm install` before
  it links peers to the host's copies, and skips any peer that already exists
  ([gitLoader.ts:332-370](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/gitLoader.ts#L332-L370),
  [:389](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/gitLoader.ts#L389)).
  _Measured:_ without the `.npmrc`, `cgc-mdx` got its own Preact. A site's npm install of a package
  satisfies its peers from the site instead, so the rule is retired, with the `.npmrc` files (#92).
- **Tags rather than the lockfile.** Both restore paths check out the locked commit only for
  whole-repo sources, and for a `subdir` source clone the ref's tip
  ([plugin-git-handlers.js:1100-1116](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/cli/plugin-git-handlers.js#L1100-L1116)).
  A registry version is immutable, so nothing needs pinning by tag.
- **A release commit.** A `subdir` install deletes the rest of the repo before `npm install`
  ([gitLoader.ts:525-541](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/gitLoader.ts#L525-L541)),
  so a `file:` library spec found nothing, and every library had to be published and every spec
  rewritten to its version in a commit off `main`, which the tag pointed at. The libraries are now
  inlined and never installed downstream, and `pnpm publish` rewrites `workspace:*` itself, so the
  release commit is retired.
- **`name:` on every entry.** A `subdir` install without it is named after the repository, `blog`,
  each over the last
  ([gitLoader.ts:86](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/gitLoader.ts#L86)).
  A package is named by its package name.

The two upstream proposals that route needed, honouring the locked commit for `subdir` sources and
installing plugin dependencies without peers, are no longer ours to make.
