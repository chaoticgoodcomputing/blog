# Quartz Core

`quartz-v5/core/` is **Quartz Core**: upstream Quartz's install root, vendored for the v4 → v5
migration ([#18](https://github.com/chaoticgoodcomputing/blog/issues/18)) and given its name and tiers
on [#89](https://github.com/chaoticgoodcomputing/blog/issues/89).

Quartz 5 has no npm package — it is `private: true` and unpublished, and its own upgrade path
(`npx quartz upgrade`) works by adding a git remote and merging. Vendoring is the supported way
to consume it, not a workaround.

**Read [ADR-0001](../docs/adr/0001-customization-through-plugins.md), with its tiers amendment,
before changing anything in `core/`.** Customization belongs in plugins. Edits to Core source are a
last resort, and each one needs a ticket plus a strategy for proposing it upstream, tracked under the
`quartz:vendored` label.

## Layout

```
quartz-v5/
├── project.json          Nx targets (this project is `site-v5`)
├── package.json          the site package, `site-v5`: repo-only, a member of the repo's pnpm workspace,
│                         depending on each plugin that is a package, which the site loads by name
├── CONTEXT.md            glossary for this context
├── VENDORED.md           this file
├── upstream.json         the pinned upstream ref — machine-readable source of truth
├── robots.txt            the site's own robots.txt — copied into the build by postbuild.mjs
├── BingSiteAuth.xml      Bing Webmaster's verification file — copied to the site root by postbuild.mjs
├── a6e41ab6-….txt        the IndexNow key file — copied to the site root by postbuild.mjs
├── icon.png              the site's own icon — put over stock's in the build by postbuild.mjs
├── icons/                the site's own icon collection, `custom:` — SVG files, drawn by @chaoticgoodcomputing/icons
├── plugins/              our Quartz plugins: packages (`quartz-*`) and those not yet converted (`cgc-*`)
├── site-plugins/         this site's own plugins, which fail the shareability test on purpose
├── libs/                 our non-plugin packages (`@chaoticgoodcomputing/*`)
├── tests/                Playwright suite and `content-fixture/`
├── utils/                tooling for this context — `core-tiers.mjs`, `upstream.mjs`, `core-lock.mjs`,
│                         `upgrade.mjs`, `api-report.mjs`, `upstream-cache.mjs`, `upstream-tree.mjs`,
│                         `core-drift.mjs`, `site-config-schema.mjs`, `prebuild.mjs`, `postbuild.mjs`,
│                         `local-plugins.mjs`,
│                         and `guards/`, the repo guards
├── .upstream-cache/      gitignored: the upgrade's bare git repo of the upstream commits it has fetched,
│                         and `trees/<sha>/`, the repo guards' checkouts of the pinned ref
└── core/                 Quartz Core: upstream's install root, in four tiers
    ├── quartz/               Core source — protected
    ├── quartz.ts             steering file
    ├── quartz.config.yaml    steering file: the site config
    ├── package.json, …       scaffolding — upstream's, verbatim
    └── pnpm-workspace.yaml,  Core's own pnpm project and its lock, imported from upstream's
        pnpm-lock.yaml
```

## The tiers

Every file upstream ships at the pinned ref, and every file in `core/`, falls in one tier. The lists
live in one place, [`utils/core-tiers.mjs`](./utils/core-tiers.mjs), which the upstream tooling and the
upgrade read (and the repo guards will).

| Tier | Files | Rule |
| ---- | ----- | ---- |
| **Core source** | `quartz/` | Protected. Changes only through a vendored change, with its ticket. Its name stays `quartz/`, because Quartz's own `bin` and imports point at it. |
| **Steering files** | `quartz.ts`, `quartz.config.yaml` | Edited as Quartz's docs intend: a TS layout override and `registerCondition` in `quartz.ts`, the site's own configuration in `quartz.config.yaml`. Never drift; an upgrade never overwrites one. |
| **Scaffolding** | `package.json`, `tsconfig.json`, `globals.d.ts`, `index.d.ts`, `.gitignore`, `.prettierignore`, `.prettierrc`, `LICENSE.txt` | Upstream's toolchain, taken from upstream on each upgrade. `package.json` is exactly upstream's: nothing of ours is in it. Upstream's MIT LICENSE stays with its code. |
| **Pruned files** | `docs/`, `.github/`, `README.md`, `CODE_OF_CONDUCT.md`, `Dockerfile`, `.gitattributes`, `content/.gitkeep`, `.node-version`, `quartz.config.default.yaml`, `package-lock.json`, `.npmrc` | Deliberately absent (pruned on 1792aba3, the npm lock on #91). Never counted as drift, and never brought back by an upgrade. |

Core's pnpm files, `pnpm-workspace.yaml` and `pnpm-lock.yaml`, are ours and sit outside the tiers.
They are not drift either (see Dependencies).

## The site config

The site config, `core/quartz.config.yaml`, is a steering file, tracked where Quartz reads it. Source
links below point at upstream at
[`97a2d05`](https://github.com/jackyzha0/quartz/tree/97a2d05f80c4c50534959b1d0d41cc4b3895625e)
(v5.0.0), the ref [`upstream.json`](./upstream.json) pins:

- [`config-loader.ts:35`](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/config-loader.ts#L35)
  reads `path.join(process.cwd(), "quartz.config.yaml")`, and cwd has to be Core's root:
  [`constants.js:15`](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/cli/constants.js#L15)
  does `readFileSync("./package.json")` at module load and
  [`:14`](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/cli/constants.js#L14)
  sets `fp = "./quartz/build.ts"`, both relative to cwd.
- There is no `--config` flag ([`args.js`](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/cli/args.js)) and no environment override.

Upstream's default config, `quartz.config.default.yaml`, is pruned, so there is nothing for
[`resolveConfigPath`](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/config-loader.ts#L40-L46)
to fall back on. Quartz itself then fails the build, but only with a `TypeError` from its config
loader under a dump of its usage, so `site-v5:prebuild` (`utils/prebuild.mjs`), which `build` and
`serve` depend on, refuses first and says why when the site config is missing, empty, or has no
`plugins` list. The e2e harness writes each fixture root's own config and links everything else of
Core's into it.

A plugin of ours that is a package is listed by its package name,
`source: "@chaoticgoodcomputing/quartz-graph"`, a **package source**: Quartz imports it by name
([`config-loader.ts:441-442`](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/config-loader.ts#L441-L442)),
and the site package (below, Dependencies) is where the name resolves. The rest are still local
sources (#94–#96). Local `source:` entries are resolved with `path.resolve()` against cwd
([`gitLoader.ts:99`](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/gitLoader.ts#L99)),
which is Core's root. Local plugins are therefore `../plugins/cgc-tags`. A plugin option that names a
file resolves the same way, so the site's icon is `icon: ../icon.png` on `cgc-og-image`.

## Building the site

`site-v5:build` builds the real vault, `content/public`, into `core/public`, then finishes it with
`utils/postbuild.mjs`: it copies in the site's own root-level files (`robots.txt`, Bing Webmaster's
verification file `BingSiteAuth.xml` and the IndexNow key file), since v5's Static emitter writes only
under `/static/`, and puts the site's icon over stock's, `static/icon.png` and
`favicon.ico` (#44, #70). Quartz reads the icon from `quartz/static/icon.png` in Core source, so there
is no other way to swap it without drift, and a site emitter would race the Static emitter's copy.
Extra flags go to `quartz build`, e.g.
`pnpm nx run site-v5:build --concurrency=4`. The e2e suite proves the site config itself on a
scratch site built from it (`tests/specs/site-config.spec.mjs`, through the harness's
`siteConfig()`).

The Lighthouse targets sit beside it, ported from v4's `site` project and run with the repo's
`utils/lighthouse/` tooling. `site-v5:eval` builds the site, serves `core/public` on port 8080
(`_serve-static`) and audits its home page. `site-v5:eval:multi` audits the first public pages of
that build's sitemap, and `site-v5:eval:live` audits the live site.

`site-v5:plugin-dag` writes the **plugin DAG** (`utils/plugin-dag.mjs`, #86): the Mermaid flowchart of
how every package under `plugins/`, `libs/` and `site-plugins/` depends on the others, between the
generated markers in the description note of the plugins' tag, the vault's
`tags/projects/site/plugins/index.md`. It reads only the packages' manifests, so run
it after changing a manifest's `quartz.dependencies` or a library dependency, or adding a package.
`tests/specs/plugin-dag.spec.mjs` fails while the note has drifted, and `node
utils/plugin-dag.mjs --check` says so without writing.

## Provenance

|          |                                            |
| -------- | ------------------------------------------ |
| Upstream | https://github.com/jackyzha0/quartz        |
| Branch   | `v5`                                       |
| Commit   | `97a2d05f80c4c50534959b1d0d41cc4b3895625e` |
| Version  | 5.0.0                                      |
| Vendored | 2026-09-24                                 |

Authoritative values live in [`upstream.json`](./upstream.json); this table mirrors them for
readers. If they disagree, `upstream.json` wins — it is what the tooling reads.

## The invariant

**Quartz Core has no drift but its vendored changes, and every vendored change is made in a commit
that cites its ticket.** Drift is any difference between Core and its pinned ref except in steering
files, pruned files and Core's pnpm files.

Vendored changes are never stored separately. Two targets generate everything there is to know
about them from the tree and its history:

```bash
pnpm nx run site-v5:diff-upstream   # the complete unified diff of Core's drift from the pinned commit
pnpm nx run site-v5:vendored-log    # the commits that made it, and the tickets each cites
```

`diff-upstream` answers _what_ differs. It compares the files git tracks in Core, plus any new file
git doesn't ignore, with the files upstream tracks at the pinned ref, leaving out the tiers that are
not drift. Its stdout is a patch that `git apply` accepts from the repo root, and the file count goes
to stderr, so `> vendored.patch` captures it cleanly. `vendored-log` answers _why_. It lists every
commit since the last upgrade (the last commit to touch `upstream.json`) that made drift in Core, with
the files and the `#<n>` tickets its message cites, flags any commit that cites none, and lists
uncommitted drift, which has no commit to carry a ticket yet. Commits that only moved Core (#91 did,
from its old path, and the cutover will), or only touched steering, pruned or pnpm files, are left
out; the log follows Core's renames back through history. The rule is that every file
`diff-upstream` names traces to a flagged-clean commit in `vendored-log`. The ticket itself carries
the `quartz:vendored` label and the upstream proposal.

Both, and `diff-latest`, fetch upstream from exactly the URL `upstream.json` names, whatever
`url.<base>.insteadOf` rewrite a user's git config has (upstream is public, so no credentials are
needed).

Current vendored changes:

| Files | Why | Upstream proposal |
| ----- | --- | ----------------- |
| `quartz/plugins/types.ts`, `quartz/plugins/pageTypes/dispatcher.ts` | [#19](https://github.com/chaoticgoodcomputing/blog/issues/19): four default transformers are async, so a page type cannot run the pipeline from a synchronous `generate`. Makes `generate` awaitable. Needed by `cgc-mdx`. | [#25](https://github.com/chaoticgoodcomputing/blog/issues/25), filed after cutover |
| `quartz/plugins/loader/config-loader.ts` | [#40](https://github.com/chaoticgoodcomputing/blog/issues/40): the loader matches `manifest.dependencies` only against exact `source:` strings, and a local source differs by site root, so no one dependency string holds at the real site, the e2e fixture and a downstream install. `validateDependencies` now resolves each dependency by exact source, then by plugin name, and its presence, order and cycle checks all use the resolved entry. Additive: a dependency that matches a source exactly behaves as before. Needed by every consumer of `cgc-styles`; landed with it on [#63](https://github.com/chaoticgoodcomputing/blog/issues/63), proven by `tests/specs/dependencies-by-name.spec.mjs`. | [#47](https://github.com/chaoticgoodcomputing/blog/issues/47), filed after cutover |

The `core-drift` repo guard (below) reads the first column of this table: every file drift is
allowed in, as a code span, one row per vendored change. Adding a vendored change means adding its
row here in the same commit, and a row whose change upstream has taken fails the guard until it goes.

Generated and installed files inside Core (`node_modules/`, `.quartz/`, `.quartz-cache/`,
`public/`, `tsconfig.tsbuildinfo`) are gitignored, by upstream's own `.gitignore` and the repo's, and
so never compared. **Nothing else of ours is committed there** but the steering files and the pnpm
files. Adding to the tiers is a decision about the invariant itself, not a convenience.

This matters because it is easy to violate by accident. `nx run site:format` runs
`prettier . --write` from the repo root and _will_ rewrite upstream files unless
`quartz-v5/core` is excluded in `.prettierignore` — which is why it is. The ignore is scoped to
Core deliberately, so our own files under `quartz-v5/` are still formatted.

## Repo guards

`pnpm nx run site-v5:guards` runs the **repo guards** (`utils/guards/`, glossary in
[CONTEXT.md](./CONTEXT.md)), four of which hold Core to this file:

| Guard | Rule |
| ----- | ---- |
| `core-drift` | No drift beyond the files the vendored-changes table above records, and no recorded file that no longer drifts. `diff-upstream`, as a guard. |
| `core-pruned` | Every pruned file is absent from Core, tracked or not. |
| `core-lock` | Core's `package.json` is upstream's, byte for byte; its `pnpm-lock.yaml` passes the lock check against upstream's `package-lock.json`, and equals what a fresh `pnpm import` of it writes. |
| `site-config` | The site config validates against Core's plugin config schema (`quartz/plugins/quartz-plugins.schema.json`), and exists, isn't empty, and has a plugins list. |

Each lists every violation and exits 1 on any. The target is cached on the files the guards read, so
a second run with nothing changed is a cache hit. `core-drift` and `core-lock` compare against the
pinned ref's tree, fetched once (a depth-1 fetch, a few seconds) into the gitignored
`quartz-v5/.upstream-cache/trees/<sha>/` (`utils/upstream-tree.mjs`, beside the upgrade's bare repo); after that they need no network, but
the fresh `pnpm import` reads pnpm's metadata cache or the registry. Run one guard alone with
`node quartz-v5/utils/guards/<name>.guard.mjs`; each test, in `utils/test/guard-<name>.test.mjs`,
says how to break its rule by hand.

Upstream's schema lags upstream's own loader: the loader's types take the `header` and `footer`
layout positions and a page type's frame `template`, which the site config uses, and the schema has
neither. The validator (`utils/site-config-schema.mjs`, which takes any ref's schema, for the upgrade's
report) adds exactly those, as `SCHEMA_AMENDMENTS`, each citing the upstream line it follows. An
amendment a schema no longer needs fails `site-config` until it is retired.

## Upgrading

**The upgrade** moves Core to another upstream commit and keeps what's ours: the vendored changes,
the steering files, the pruning and Core's pnpm settings.

```bash
pnpm nx run site-v5:diff-latest                    # what would an upgrade to the tip of v5 pull in?
pnpm nx run site-v5:upgrade-report --ref=<ref>     # the API-surface report alone; writes nothing
pnpm nx run site-v5:upgrade --ref=<commit|branch|tag>
pnpm nx run site-v5:upgrade --ref=<ref> --verify --v4=<a built v4 site>
```

It is [`utils/upgrade.mjs`](./utils/upgrade.mjs) ([#99](https://github.com/chaoticgoodcomputing/blog/issues/99)),
and runs these steps in order, stopping at the first that fails:

1. **Refuse a dirty tree.** Any uncommitted change in `core/` or `upstream.json` stops it, so an
   upgrade never mixes with work in progress and can always be undone with git.
2. **Fetch** the pinned ref and the target into the upstream cache, `quartz-v5/.upstream-cache/`
   (gitignored, [`utils/upstream-cache.mjs`](./utils/upstream-cache.mjs)): a bare git repo that never
   fetches a commit twice. The fetch goes to exactly the URL `upstream.json` names; `--upstream=<url>`
   or `QUARTZ_UPSTREAM` fetches from another (the tests point it at a fixture).
   - **The API-surface report** ([`utils/api-report.mjs`](./utils/api-report.mjs),
   [#100](https://github.com/chaoticgoodcomputing/blog/issues/100)) prints next, before anything is
   written: what changed between the pinned ref and the target in every upstream API the site
   depends on. Each category says so when it has nothing to report:
     - the default config (pruned from Core, so read from the upstream cache): plugins and option
       keys added, removed or renamed (a rename is the same value under a new key, or the same
       package under a new source), and plugins turned on or off by default;
     - the plugin config schema: each constraint added, removed or changed, and **our site config
       validated against the target's schema**, with every error listed (the `site-config` guard's
       validator and schema amendments; an amendment the target no longer needs is noted);
     - the `quartz.ts` template, as a diff;
     - the exported plugin, component, loader, condition and frame APIs: each export added, removed,
       moved or changed (a function by its signature, a type or interface by its declaration), the
       built-in conditions and frames, and the state of `registerCondition`, `loadQuartzLayout` and
       every name `quartz.ts` imports;
     - Core's `package.json`: its version, dependencies and engines;
     - **our packages' peer ranges** (every workspace package) that the version at the top of the
       target's npm lock no longer satisfies, naming the package and the dependency.

     The report never stops the upgrade. `site-v5:upgrade-report --ref=<ref>` runs the fetch and the
     report alone (`--report-only`), writes nothing but the upstream cache, and needs no clean tree.
3. **Re-apply the vendored changes.** Each Core source file's drift from the pinned ref is split into
   its hunks, and each hunk is applied to the target's version of the file. A hunk that is already
   there is reported as **absorbed**, so its ticket and upstream proposal can be retired. A hunk that
   neither applies nor is already there is a conflict: the upgrade stops, names the file and the hunk,
   and writes nothing. Resolve it by hand, as a vendored change with its ticket.
4. **Take the scaffolding.** `package.json` is taken verbatim. The other scaffolding files are
   three-way merged (ours, the pinned ref's, the target's), stopping on a conflict. A file upstream
   adds at Core's root in no tier is taken and named, to be added to `core-tiers.mjs`.
5. **Leave the steering files alone.** Upstream's template changes to them (between the pinned
   ref and the target) are printed as a diff to merge by hand.
6. **Keep the pruning.** No pruned file comes back, even one upstream has changed or added.
7. **Convert the lock.** The target's `package.json` and `package-lock.json` (taken from the
   fetched ref, never from Core, which has no npm lock) go into a temporary project with Core's
   `pnpm-workspace.yaml`, where `pnpm import` converts the lock. The lock check must then find every
   package at the same version on both sides, or the upgrade stops. Only then is Core written, and the
   converted lock installed into it frozen. If that install fails, Core's files are restored from git.
8. **Record** the target in `upstream.json`, last, so a failed upgrade never claims a ref.
9. **`--verify`** then proves the result, running from the repo root, in order, stopping at the
   first failure with a non-zero exit: the repo guards (`site-v5:guards`; guards added to it later
   join them), the typechecks (`nx run-many -t typecheck`), the e2e suite (`site-v5-e2e:e2e`), the
   real-site build (`site-v5:build`) and the acceptance report against it. The v4 build is not kept
   working, so the acceptance report compares against a v4 site built earlier: `--v4=<dir>`
   (default `dist/public`), which must exist before the upgrade starts. A failure here leaves the
   upgrade written and recorded (the output says so), for fixing or undoing with git.

Every step up to the lock check only plans, so a stop there leaves Core, its lock and `upstream.json`
exactly as they were. Upgrading to the pinned ref changes nothing at all. After an upgrade, review
the changes, update the Provenance table above, remove from the vendored-changes table any change
upstream absorbed, and commit.

`npx quartz upgrade` is a different thing and does **not** work here: it runs
`git remote add upstream …` against the enclosing repository, which is this blog, not Quartz.

Upstream symbolic links are recreated as links in Core, and any other special git mode stops the
upgrade.

The upgrade is tested with Node's test runner at its command line, against a synthetic
Quartz-shaped upstream and site repo made in a temp dir (`utils/test/upgrade*.test.mjs`, run by
`pnpm nx run site-v5:test-utils`), offline apart from the pnpm store. `--verify`'s order and its
stop at the first failure are tested with stand-in steps (`QUARTZ_VERIFY_STEPS`, a JSON file of
`{ name, command }`), so the tests never run the real suite.

## Dependencies

**Core is a pnpm project of its own**, installed by `pnpm nx run site-v5:install`: a frozen install
of `core/pnpm-lock.yaml` into `core/node_modules`. Its `core/pnpm-workspace.yaml` makes it a
workspace of its own, and pnpm stops at the nearest workspace file, so the repo's root install never
reaches it:

```yaml
packages:
  - "."
nodeLinker: hoisted        # a flat, npm-shaped node_modules, which plugins resolve Core's packages from
autoInstallPeers: false
allowBuilds:               # pnpm 11 fails an install on any other dependency's build script
  "@parcel/watcher": true
  esbuild: true
  sharp: true
```

`allowBuilds` is pnpm 11's, so `site-v5:install` runs pnpm 11 by exact version through `npx`
(`npx --yes pnpm@11.27.1`), whatever pnpm the repo root pins. Inside `core/` the nearest workspace
root is Core's, whose `package.json` names no `packageManager`, so pnpm never switches versions there.

**The lock is upstream's, converted.** `core/pnpm-lock.yaml` is `pnpm import` of upstream's
`package-lock.json` at the pinned ref, so Core installs exactly the versions upstream shipped and
tested. Letting pnpm resolve Core's `package.json` fresh would move 62 of its packages instead,
`@quartz-community/remark-obsidian` 1.0.0 → 1.1.0 among them. The **lock check** proves the
conversion held, every package at the same version and nothing on either side the other lacks:

```bash
pnpm nx run site-v5:core-lock     # against the pinned ref's package-lock.json, fetched from upstream
node quartz-v5/utils/core-lock.mjs --npm-lock <file>   # against a local npm lock
```

At 97a2d05 it reads 415 of 415 packages matching. The hoisted layout places two packages
differently from npm (the top-level `picomatch` and `string-width` are another of the versions the
lock holds), which no code of ours imports. The upgrade converts the lock at a new ref, from that
ref's own `package-lock.json` (see Upgrading).

**Our plugins resolve the host's dependencies through `plugins/node_modules`,** a gitignored
symlink to `../core/node_modules` that the e2e harness and `site-v5:prebuild` create. A plugin runs
from its real path under `plugins/` whether it is listed by local path or by package name. A git-installed
plugin sits at `.quartz/plugins/<name>/` inside Core, so its bare `import "preact"` finds Quartz's
copy, and that is what the loader's shared externals assume. A local plugin is only symlinked there,
and Node resolves from the symlink's target under `plugins/`, which would otherwise walk up to the v4
tree's `node_modules` at the repo root: a second, older Preact. The workspace install therefore
never installs a peer beside a plugin (`autoInstallPeers: false`, below), and a plugin declares
Quartz's shared packages (Preact, `vfile`, `unified`, `lightningcss`, `@quartz-community/*`) only
as peers, never as devDependencies too, so its own `node_modules` never shadows a host singleton.
`site-plugins/` needs the same link, `site-plugins/node_modules`, for the same reason. It's decided on
[#39](https://github.com/chaoticgoodcomputing/blog/issues/39) and wired on
[#64](https://github.com/chaoticgoodcomputing/blog/issues/64): `site-v5:prebuild` makes it for the
real site once the site config enables a site plugin, and the e2e harness makes it beside
`plugins/node_modules`, building every site plugin too, because scratch sites built from the site
config load them. No fixture config lists a site plugin. Both replace a link left pointing anywhere
else, such as Core's old path.

**Everything else of ours is one pnpm workspace**
([#92](https://github.com/chaoticgoodcomputing/blog/issues/92)). `pnpm-workspace.yaml` at the repo
root lists the libraries, every plugin, every site plugin, the e2e suite and the site package
(`quartz-v5/package.json`, **repo-only**, named `site-v5` like its Nx project), so one
`pnpm install --frozen-lockfile` at the root prepares all of them from one lock, `pnpm-lock.yaml`.
The only other lock is Core's. The root pins pnpm by `packageManager` (`pnpm@11.27.1`, the version
`site-v5:install` runs for Core), and pnpm switches to it whatever version is installed. The
workspace settings:

```yaml
autoInstallPeers: false    # a plugin's peers are Core's copies, reached through the host links above
allowBuilds:               # pnpm 11 fails an install on any other dependency's build script
  "@parcel/watcher": true
  esbuild: true
  sharp: true
  nx: false                # its postinstall only prepares the daemon; never run under pnpm 10 either
```

A plugin names a library it inlines, or one its build runs (`@chaoticgoodcomputing/css-check`), as a
`workspace:*` devDependency (ADR-0005), which pnpm links: whatever the library imports resolves from
the library's own install, never the plugin's. Every plugin and site plugin has a cacheable Nx
`build` target (`node build.mjs`), whose inputs are the package's manifest, build script, tsconfig
and sources, `^production` (the libraries it depends on, as nx.json's `production` named input has
them: sources and manifests, never their Markdown, `docs/`, `e2e/` or specs, so a doc edit rebuilds
nothing), Core's lock and the workspace's external dependencies, and whose output is its `dist/`. A
second build with nothing changed is a cache hit.

**The site package loads the plugins that are packages.** `quartz-v5/package.json` depends on each by
`workspace:*`, so pnpm links `quartz-v5/node_modules/@chaoticgoodcomputing/quartz-<name>` to its
directory. Quartz imports a package source from Core source, `core/quartz/`, and Node's upward
walk from there reaches `quartz-v5/node_modules` after Core's own, so Core's `package.json` stays
upstream's. A new package is added there, in the same change that lists it in a config (#93). Its
build emits a `.d.ts` beside each `dist/` entry through `@chaoticgoodcomputing/declarations`, since
Quartz's generated plugin index (`install-plugins`) skips a package without `dist/index.d.ts`.

**Nx infers targets from the workspace members' `package.json` scripts,** now that plugins and the
e2e suite are members: a `typecheck` script on a package without a `typecheck` target in its
`project.json` (`cgc-mdx`, `cgc-og-image`, `site-styles`) becomes one, and `site-v5-e2e` gets `test`
from the suite's `test` script. So `nx run-many -t test` starts the whole e2e suite. A target in
`project.json` wins over an inferred one of the same name. The e2e harness and
`site-v5:prebuild` take the same two steps from one module, `utils/local-plugins.mjs`: the frozen
workspace install, a no-op when nothing has moved, then an Nx build of the plugins they load, by
either kind of source (`pluginDirOf`, which also reads a package name).
Content reaches a library the same way: the root `package.json` depends on
`@chaoticgoodcomputing/widgets` by `workspace:*`, so an `.mdx` page in the vault or the e2e fixture
resolves `@chaoticgoodcomputing/widgets/<widget>` by Node's upward walk to the root `node_modules` (#36).

## Relationship to `quartz/` at the repo root

The root `quartz/` is the **Quartz 4 copy that builds the live site**, untouched by any of this.
Both exist in parallel for the duration of the migration; the v4 copy goes away only at cutover,
when `quartz-v5/` becomes `quartz/` and Core sits at `quartz/core/` (#81).
