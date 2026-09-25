---
status: accepted
date: 2026-09-25
---

# Plugins ship as source, in batch releases

A downstream site installs a `cgc-*` plugin straight from this monorepo, through Quartz's own
`quartz plugin add` with a git source, a `subdir` and a `name`. Three rules make that work:

- **Source only.** A package never commits its `dist/`, so Quartz's loader builds it on install.
- **A package `.npmrc` with `legacy-peer-deps=true`.** Any package with peers carries one.
- **One version for everything.** Every package in `plugins/` and `libs/` shares a single semver,
  cut as a batch whenever any of them changes and tagged `v<semver>`. A downstream site pins that
  tag as its `ref`. This is the **Release** in `quartz-v5/CONTEXT.md`.

> Source links point at upstream Quartz at
> [`97a2d05`](https://github.com/jackyzha0/quartz/tree/97a2d05f80c4c50534959b1d0d41cc4b3895625e)
> (v5.0.0). _Measured_ claims were run on the throwaway `prototype/plugin-install` branch (commit
> `8ebffa2`). Its `quartz-v5/tests/proto-install/run.sh` rebuilds a stock site for each variant,
> installs `cgc-mdx` with the real CLI and runs the plugin's own specs against it.

## Why

**No committed `dist/`.** With a `dist/` present, the loader skips `npm install` altogether
([gitLoader.ts:374-381](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/gitLoader.ts#L374-L381)).
A package's runtime dependencies are then never installed. `cgc-mdx` needs `esbuild` at site-build
time. _Measured:_ it still worked, but only because stock Quartz happens to carry `esbuild` as a
_devDependency_, and a site installed with `--omit=dev` would lose it. The manifest's
`requiresInstall` hook would install it, but only the build-time loader reads that hook. The CLI's
`plugin add` ignores it. Without a `dist/`, the loader runs `npm install`, then the package's
`build`, then `npm prune --omit=dev`. _Measured:_ `build.mjs` runs stand-alone in the clone with no
borrowed toolchain, and the output is byte-identical to a committed `dist/`. The cost is that
installing a plugin needs npm and about a second. In exchange, `main` carries no generated files.

**The `.npmrc`.** The loader means to link every peer to the host Quartz's copy
([gitLoader.ts:332-370](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/gitLoader.ts#L332-L370)).
But it runs a plain `npm install` first
([:389](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/gitLoader.ts#L389)),
npm 7+ installs peers by default, and the link step skips any peer that already exists
([:344](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/gitLoader.ts#L344)).
_Measured:_ the plugin got its own `preact` and `preact-render-to-string`. The specs still passed,
because `cgc-mdx` pins widgets to "the Preact this plugin resolves" and today both copies are
10.29.8. But the claim in `cgc-mdx` ADR-0002, one Preact per page and it's Quartz's, was false, and
the first version skew would have split the page. A package-local `.npmrc` is the only lever a
package has over how the loader calls npm. _Measured:_ with it, both peers are symlinks to the host,
`esbuild` installs locally, and all 21 `cgc-mdx` specs pass. The harness's own
`npm ci --omit=peer` is unaffected.

**Tags rather than the lockfile.** `quartz.lock.json` records a commit for every git install, but
both restore paths check out that commit only for whole-repo sources. For a `subdir` source they
clone the ref's tip and print the locked hash anyway
([plugin-git-handlers.js:1100-1116](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/cli/plugin-git-handlers.js#L1100-L1116),
[:828-851](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/cli/plugin-git-handlers.js#L828-L851)).
_Measured:_ after the branch moved, a fresh restore reported `488424e` and installed the new tip. So
a site installing from a monorepo is pinned only by its `ref`, and the ref has to be a tag.

**One version, not one per package.** Per-package tags (`cgc-mdx@0.3.1`) would let packages move
independently. But plugins inline libraries at build time and an engine's consumers read its
artifacts, so a mismatched set is the likely failure. One number answers "which versions go
together" by construction.

## Consequences

- **Downstream config** sets `name:`, or the plugin installs under the repo's name, `blog`, each
  over the last
  ([gitLoader.ts:86](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/gitLoader.ts#L86)).
  `plugin add --name cgc-mdx` writes it. A package README's install snippet is:
  `quartz plugin add git+https://github.com/chaoticgoodcomputing/blog.git#v<x.y.z> --subdir quartz-v5/plugins/<pkg> --name <pkg>`.
  The path loses `quartz-v5/` at cutover.
- **A plugin's dependencies must install from a registry.** An install-time build can't see this
  repo's workspace, so a plugin that inlines one of our libraries can't name it by `workspace:*`.
  Settled by the *libraries inlined by a plugin* amendment below.
- **No release is cut before cutover,** per the no-publishing rule. The release tooling waits
  until then.
- **Two upstream proposals, both deferred until after cutover:** honour the locked commit for
  `subdir` sources, and install plugin dependencies without peers so the peer link can happen. With
  both landed, the `.npmrc` and the tag-only pinning become belt-and-braces rather than load-bearing.

## Amendment: libraries inlined by a plugin

_2026-09-25, from [How does a plugin that inlines one of our libraries build on a downstream install?](https://github.com/chaoticgoodcomputing/blog/issues/52)._

A plugin that inlines one of our libraries lists it as a **`devDependency`**. On `main` the spec is
`file:../../libs/<name>`. At a release, the tag carries the exact release version instead, and
every library is published to npm at that version.

- **Libraries are published to npm on every release** as `@chaoticgoodcomputing/<name>@x.y.z`,
  source only: `exports` still points at `./src/index.ts`, and the consuming plugin's build inlines
  it, just as it does locally.
- **The tag points at a release commit off `main`.** It is a child of `main`'s head that changes
  package metadata only. Every package's `version` becomes `x.y.z`, and every plugin's
  `file:../../libs/*` spec becomes `x.y.z`. `main` never contains it, and `main`'s versions stay
  `0.0.0`. The **Release commit** in `quartz-v5/CONTEXT.md`.
- **`devDependencies`, not `dependencies`.** The loader installs, builds, then prunes dev
  dependencies. An inlined library is needed only for the build. `dependencies` stays for what the
  plugin needs while the site builds, like `cgc-mdx`'s `esbuild`.
- **Libraries depend on each other by `workspace:*`**, in `dependencies`, and `pnpm publish`
  rewrites that to the exact version itself. A library's third-party dependencies are
  `dependencies` too, so npm installs them transitively under the plugin's devDependency. The pnpm
  workspace still lists only `libs/*`, and plugins keep installing with npm, the way the loader
  installs them downstream.
- **Except a library whose dependencies can't be inlined.** Its consumers carry those packages as
  their own `dependencies`, at the library's exact versions, and keep them external. The first is
  `@chaoticgoodcomputing/icons`, whose Iconify packages load data files at run time:
  [libs/icons ADR-0001](../../quartz-v5/libs/icons/docs/adr/0001-consumers-carry-iconify.md) (#71).

**Why a rewrite at all.** No spec satisfies both installs before the first release. Locally, no
published version exists. Downstream, nothing outside the plugin's folder exists: a `subdir`
install shallow-clones the repo, moves the subdirectory out and
[deletes the rest](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/gitLoader.ts#L525-L541)
before `npm install` runs, so a `file:` path finds nothing. The release commit is where the
spec changes from one to the other.

**Alternatives ruled out.**

- **A git dependency with a subdirectory.** npm has no syntax for one (pnpm's and Yarn's
  `#path:` forms don't exist in npm), and the loader runs npm.
- **`workspace:*` in plugins,** with `plugins/*` joining the pnpm workspace. npm rejects the
  `workspace:` protocol outright, so it still needs the rewrite, and plugins would install with
  pnpm locally but npm downstream.
- **Committing `dist/` for plugins that inline a library.** This is the case ruled out above: the
  loader would skip `npm install`, and runtime dependencies would never install.
- **GitHub release tarballs, or copying libraries into each plugin at release.** Both work without
  a registry. But the libraries are useful outside our plugins, and we hold the npm scope.

**Consequences.**

- **Releasing never writes to `main`.** Because the release commit sits off `main`, cutting a
  release can't loop back into the pipeline. A release is cut only when something under `plugins/`
  or `libs/` changes. Vault content, the site and `site-plugins/` never trigger one. The release
  automation still waits for cutover.
- **The first plugin to inline a library proves the shape.** It extends the `proto-install` run to
  `pnpm pack` the libraries, rewrite the plugin's specs to those tarballs and install it into a
  stock site. That tests the rewrite and inlining TypeScript from `node_modules`, with nothing
  published.
