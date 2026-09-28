# Quartz Core

`quartz/core/` is **Quartz Core**: upstream Quartz's install root, vendored for the v4 → v5
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
quartz/
├── project.json          Nx targets (this project is `site`)
├── package.json          the site package, `site`: repo-only, a member of the repo's pnpm workspace,
│                         depending on each plugin that is a package, which the site loads by name
├── CONTEXT.md            glossary for this context
├── VENDORED.md           this file
├── upstream.json         the pinned upstream ref — machine-readable source of truth
├── robots.txt            the site's own robots.txt — copied into the build by postbuild.mjs
├── BingSiteAuth.xml      Bing Webmaster's verification file — copied to the site root by postbuild.mjs
├── a6e41ab6-….txt        the IndexNow key file — copied to the site root by postbuild.mjs
├── icon.png              the site's own icon — put over stock's in the build by postbuild.mjs
├── icons/                the site's own icon collection, `custom:` — SVG files, drawn by @chaoticgoodcomputing/icons
├── plugins/              our Quartz plugins, each a package, `@chaoticgoodcomputing/quartz-<name>`
├── site-plugins/         this site's own plugins, repo-only packages (`@chaoticgoodcomputing/site-<name>`)
├── libs/                 our non-plugin packages (`@chaoticgoodcomputing/*`)
├── tests/                Playwright suite and `content-fixture/`
├── utils/                tooling for this context — `core-tiers.mjs`, `upstream.mjs`, `core-lock.mjs`,
│                         `upgrade.mjs`, `api-report.mjs`, `upstream-cache.mjs`, `upstream-tree.mjs`,
│                         `core-drift.mjs`, `site-config-schema.mjs`, `prebuild.mjs`, `postbuild.mjs`,
│                         `plugin-packages.mjs`, `packages.mjs`,
│                         and `guards/`, the repo guards
├── .upstream-cache/      gitignored: the upgrade's bare git repo of the upstream commits it has fetched,
│                         and `trees/<sha>/`, the repo guards' checkouts of the pinned ref
└── core/                 Quartz Core: upstream's install root, in four tiers plus its pnpm files
    ├── quartz/               Core source — protected
    ├── quartz.ts             steering file
    ├── quartz.config.yaml    steering file: the site config
    ├── package.json, …       scaffolding — upstream's, verbatim
    └── pnpm-workspace.yaml,  Core's own pnpm project and its lock, imported from upstream's
        pnpm-lock.yaml
```

## The tiers

Every file upstream ships at the pinned ref, and every file in `core/`, falls in one of four tiers,
except Core's own pnpm files, which `tierOf` classifies as a fifth class, "pnpm". The lists
live in one place, [`utils/core-tiers.mjs`](./utils/core-tiers.mjs), which the upstream tooling and the
upgrade read (and the repo guards will).

| Tier | Files | Rule |
| ---- | ----- | ---- |
| **Core source** | `quartz/` | Protected. Changes only through a vendored change, with its ticket. Its name stays `quartz/`, because Quartz's own `bin` and imports point at it. |
| **Steering files** | `quartz.ts`, `quartz.config.yaml` | Edited as Quartz's docs intend: a TS layout override and `registerCondition` in `quartz.ts`, the site's own configuration in `quartz.config.yaml`. The site's `quartz.ts` goes further, into Core internals (see The site's `quartz.ts`). Never drift; an upgrade never overwrites one. |
| **Scaffolding** | `package.json`, `tsconfig.json`, `globals.d.ts`, `index.d.ts`, `.gitignore`, `.prettierignore`, `.prettierrc`, `LICENSE.txt` | Upstream's toolchain, taken from upstream on each upgrade. `package.json` is exactly upstream's: nothing of ours is in it. Upstream's MIT LICENSE stays with its code. |
| **Pruned files** | `docs/`, `.github/`, `README.md`, `CODE_OF_CONDUCT.md`, `Dockerfile`, `.gitattributes`, `content/.gitkeep`, `.node-version`, `quartz.config.default.yaml`, `package-lock.json`, `.npmrc` | Deliberately absent (pruned on 1792aba3, the npm lock on #91). Never counted as drift, and never brought back by an upgrade. |

Beside the four tiers are Core's own pnpm files, `pnpm-workspace.yaml` and `pnpm-lock.yaml`, which are
ours and which `tierOf` classifies as "pnpm". They are not drift either (see Dependencies).

## The site's `quartz.ts`

`core/quartz.ts` is upstream's template plus one rule of the site's (#70): v4's home page components,
the post listing, the "Newsletter" subscribe box and the social cards, are kept to the index and the
page types named for each. Quartz 5 ships no `is-index` condition, and the owner decided the site
adds none (#70). The rule doesn't go through the TS layout override upstream's docs describe,
`loadQuartzLayout`'s `layoutOverrides` with `byPageType`, which #70 named: that override replaces a
slot's whole array rather than merging into it
([`config-loader.ts:712-720`](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/config-loader.ts#L712-L720)),
and nothing reads what it builds, as the first point below says. Two things about Core shape the
file:

- Core builds its page dispatcher from the YAML layout inside `loadQuartzConfig`
  ([`config-loader.ts:510-518`](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/config-loader.ts#L510-L518)), and only the default
  export of `quartz.ts` is read
  ([`build.ts:11`](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/build.ts#L11)), so the `layout` export upstream's docs describe
  changes nothing by itself. The site's `quartz.ts` rebuilds the dispatcher from its layout.
- Quartz bundles `quartz.ts` from Core's own path, so every root the e2e harness builds, fixture
  roots included, runs the site's file. Its rule applies only to a config that loads
  `site-components`, which no fixture config does, so a fixture site stays a stock one.

So the file works on Core's own layout build, and leans on three things about Core that no API
promises:

- **The component registry.** For one extra `loadQuartzLayout()` build, `quartz.ts` swaps each home
  page component's constructor in `componentRegistry` for one that marks what it builds by its
  `displayName`, then puts the constructor back. It finds the entry under its plain name or its
  name in PascalCase, two of the keys Core's loader looks it up by (the third,
  `<source>/<name>`, it doesn't try)
  ([`config-loader.ts:751-771`](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/config-loader.ts#L751-L771)).
- **Display wrappers copy `displayName`.** A component placed `desktop-only` or `mobile-only` is
  wrapped, and the wrapper copies the inner component's `displayName`
  ([`DesktopOnly.tsx:13`](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/components/DesktopOnly.tsx#L13),
  [`MobileOnly.tsx:13`](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/components/MobileOnly.tsx#L13)), so the
  outermost component in a slot still says which entry it is. `quartz.ts` wraps that outermost
  component in an index-only `ConditionalRender` on every other page type, so no empty wrapper is
  left behind. A `condition` wrapper copies no `displayName`, so a home page component takes no
  `condition` in the site config.
- **The dispatcher emitter.** `quartz.ts` replaces the emitter named `PageTypeDispatcher` in
  `config.plugins.emitters` with one built from its own layout, placing each page type by its
  `layout` name.

A change to any of the three fails the build loudly, rather than letting the components render on
every page: an enabled home page component the registry holds under neither key, one found in no
slot marked (a wrapper that stopped copying `displayName` loses the mark), no `PageTypeDispatcher`
emitter, and no page types all throw at build time, naming `quartz.ts`. A change in how the
dispatcher picks a page type's layout would throw nothing. The API-surface report catches only a
removed or renamed import, not a change in how these behave, so an upgrade must re-check them:
build the site and run
`tests/specs/site-index-only.spec.mjs` and `tests/specs/site-annotations.spec.mjs`.
`utils/test/site-home-page.test.mjs` checks the configs' side: the site config leaves these
components' pages to `quartz.ts`, and no fixture config loads `site-components`.

The upgrade never overwrites the file, and reports upstream's template changes for a manual merge.

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
loader under a dump of its usage, so `site:prebuild` (`utils/prebuild.mjs`), which `build` and
`serve` depend on, refuses first and says why when the site config is missing, empty, or has no
`plugins` list. The e2e harness writes each fixture root's own config and links everything else of
Core's into it.

A plugin of ours that is a package is listed by its package name,
`source: "@chaoticgoodcomputing/quartz-graph"`, a **package source**: Quartz imports it by name
([`config-loader.ts:441-442`](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/config-loader.ts#L441-L442)),
and the site package (below, Dependencies) is where the name resolves. Every plugin in `plugins/` is
a package (#93-#95), and so is each site plugin in `site-plugins/`, a **repo-only** one
(`"private": true`) named `@chaoticgoodcomputing/site-<name>`, whose directory and manifest name
stay `site-<name>` (#96). So the site config lists no local path, and neither prebuild nor the e2e
harness has a code path that builds or rewrites a local source. Quartz would resolve a local
`source:` with `path.resolve()` against cwd
([`gitLoader.ts:99`](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/gitLoader.ts#L99)),
which is Core's root; only the e2e fixture's own plugins are still listed so, against the fixture
root (`tests/CONTEXT.md`, "Fixture plugin"). A plugin option that names a file resolves the same way,
so the site's icon is `icon: ../icon.png` on `quartz-og-image`, and the harness's `siteConfig()`
rebases such an option for a scratch site built from the site config.

## Building the site

`site:build` builds the real vault, `content/public`, into `core/public`, then finishes it with
`utils/postbuild.mjs`: it copies in the site's own root-level files (`robots.txt`, Bing Webmaster's
verification file `BingSiteAuth.xml` and the IndexNow key file), since v5's Static emitter writes only
under `/static/`, and puts the site's icon over stock's, `static/icon.png` and
`favicon.ico` (#44, #70). Quartz reads the icon from `quartz/static/icon.png` in Core source, so there
is no other way to swap it without drift, and a site emitter would race the Static emitter's copy.
Extra flags go to `quartz build`, e.g.
`pnpm nx run site:build --concurrency=4`. The e2e suite proves the site config itself on a
scratch site built from it (`tests/specs/site-config.spec.mjs`, through the harness's
`siteConfig()`).

The Lighthouse targets sit beside it, ported from v4's `site` project and run with the repo's
`utils/lighthouse/` tooling. `site:eval` builds the site, serves `core/public` on port 8080
(`_serve-static`) and audits its home page. `site:eval:multi` audits the first public pages of
that build's sitemap, and `site:eval:live` audits the live site.

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
pnpm nx run site:diff-upstream   # the complete unified diff of Core's drift from the pinned commit
pnpm nx run site:vendored-log    # the commits that made it, and the tickets each cites
```

`diff-upstream` answers _what_ differs. It compares the files git tracks in Core, plus any new file
git doesn't ignore, with the files upstream tracks at the pinned ref, leaving out the tiers that are
not drift. Its stdout is a patch that `git apply` accepts from the repo root, and the file count goes
to stderr, so `> vendored.patch` captures it cleanly. `vendored-log` answers _why_. It lists every
commit since the last upgrade (the commit that brought in the ref `upstream.json` pins) that made drift in Core, with
the files and the `#<n>` tickets its message cites, flags any commit that cites none, and lists
uncommitted drift, which has no commit to carry a ticket yet. Commits that only moved Core (#91 did,
from its old path, and the cutover did again), or only touched steering, pruned or pnpm files, are left
out; the log follows Core's renames back through history. The rule is that every file
`diff-upstream` names traces to a flagged-clean commit in `vendored-log`. The ticket itself carries
the `quartz:vendored` label and the upstream proposal.

Both, and `diff-latest`, fetch upstream from exactly the URL `upstream.json` names, whatever
`url.<base>.insteadOf` rewrite a user's git config has (upstream is public, so no credentials are
needed).

Current vendored changes:

| Files | Why | Upstream proposal |
| ----- | --- | ----------------- |
| `quartz/plugins/types.ts`, `quartz/plugins/pageTypes/dispatcher.ts` | [#19](https://github.com/chaoticgoodcomputing/blog/issues/19): four default transformers are async, so a page type cannot run the pipeline from a synchronous `generate`. Makes `generate` awaitable. Needed by `quartz-mdx`. | [#25](https://github.com/chaoticgoodcomputing/blog/issues/25), filed after cutover |
| `quartz/plugins/loader/config-loader.ts` | [#40](https://github.com/chaoticgoodcomputing/blog/issues/40): the loader matches `manifest.dependencies` only against exact `source:` strings, and a local source differs by site root, so no one dependency string holds at the real site, the e2e fixture and a downstream install. `validateDependencies` now resolves each dependency by exact source, then by plugin name, and its presence, order and cycle checks all use the resolved entry. Additive: a dependency that matches a source exactly behaves as before. Landed with `quartz-styles` on [#63](https://github.com/chaoticgoodcomputing/blog/issues/63), proven by `tests/specs/dependencies-by-name.spec.mjs`. Since [#95](https://github.com/chaoticgoodcomputing/blog/issues/95) every consumer names its engine by package name, which is the engine's `source:` at every site and so matches exactly, as on stock Quartz; the change is needed only by a dependency on a plugin listed by a local source. Since [#96](https://github.com/chaoticgoodcomputing/blog/issues/96) neither config has one: only the fixture's own plugins are local sources, and nothing depends on them. The change is exercised only by the spec's scratch cases now; retiring it is a vendored change of its own (ADR-0001), not yet taken. | [#47](https://github.com/chaoticgoodcomputing/blog/issues/47), filed after cutover |

The `core-drift` repo guard (below) reads the first column of this table: every file drift is
allowed in, as a code span, one row per vendored change. Adding a vendored change means adding its
row here in the same commit, and a row whose change upstream has taken fails the guard until it goes.

Generated and installed files inside Core (`node_modules/`, `.quartz/`, `.quartz-cache/`,
`public/`, `tsconfig.tsbuildinfo`) are gitignored, by upstream's own `.gitignore` and the repo's, and
so never compared. **Nothing else of ours is committed there** but the steering files and the pnpm
files. Adding to the tiers is a decision about the invariant itself, not a convenience.

This matters because it is easy to violate by accident. `prettier . --write` from the repo root
(v4's `site:format` target ran exactly that) _will_ rewrite upstream files unless
`quartz/core` is excluded in `.prettierignore` — which is why it is. The ignore is scoped to
Core deliberately, so our own files under `quartz/` are still formatted.

## Repo guards

`pnpm nx run site:guards` runs the **repo guards** (`utils/guards/`, glossary in
[CONTEXT.md](./CONTEXT.md)). Four hold Core to this file, five hold our packages to how the site
loads them (four from #98, and `plugin-index` from #89), and two hold the plugin notes to the
packages (#86):

| Guard | Rule |
| ----- | ---- |
| `core-drift` | No drift beyond the files the vendored-changes table above records, and no recorded file that no longer drifts. `diff-upstream`, as a guard. |
| `core-pruned` | Every pruned file is absent from Core, tracked or not. |
| `core-lock` | Core's `package.json` is upstream's, byte for byte; its `pnpm-lock.yaml` passes the lock check against upstream's `package-lock.json`, and equals what a fresh `pnpm import` of it writes. |
| `site-config` | The site config validates against Core's plugin config schema (`quartz/plugins/quartz-plugins.schema.json`), and exists, isn't empty, and has a plugins list. |
| `package-contract` | Every plugin and site plugin meets the **package contract**: its package, directory, Nx project and manifest names agree; `exports` has `./package.json`, has `.`, and has `{ types, import }` for every other entry, `types` a `.d.ts`, both emitted; it has `files`, `license`, `publishConfig` and `repository`; it is repo-only exactly when it is a site plugin, and the site package is repo-only; and no manifest sets `requiresInstall`. |
| `shared-packages` | One copy of each of Quartz's **shared packages** (Preact, `preact-render-to-string`, `vfile`, `unified`, `lightningcss`, `@quartz-community/*`), Core's: no plugin, site plugin or library declares one but as a peer; from each plugin's real path every one resolves into Core's `node_modules`, and every peer resolves; no library has one installed beside it; and no plugin's `dist/` inlines one (read from esbuild's path comments, which every unminified, server-side bundle keeps). And no plugin or site plugin source imports `picomatch` or `string-width`, which Core's hoisted install places unlike npm (see Dependencies). |
| `package-sources` | Every source of ours in the site config and the fixture config is a package name, but the fixture's own plugins (`../fixture-plugins/<name>`, which must exist); each names a workspace package; every manifest dependency (plugins, site plugins, fixture plugins) names a workspace package; every plugin of ours either config enables is a dependency of the site package, under the name Quartz imports it by (an object source's `name` as an alias of its `repo`), and one under its own name is `workspace:*`; and both configs list every plugin, and the site config every site plugin. |
| `clean-packs` | `pnpm pack --dry-run` of every publishable package (each plugin not repo-only) lists only `dist/`, README, LICENSE and `package.json`, and has each; and a workspace publish (`pnpm -r --filter … publish --dry-run`) leaves out every site plugin and the site package. Publishable means the plugins only: the libraries are not repo-only, but are left out on purpose, as whether they are published at all is [#90](https://github.com/chaoticgoodcomputing/blog/issues/90)'s to decide. |
| `plugin-index` | Core's own `install-plugins` step, run in a scratch root on a config listing every plugin and site plugin by package name, skips none of them, and its generated plugin index (`.quartz/plugins/index.ts`, what a TypeScript site imports from) exports from every plugin. |
| `plugin-notes` | Every shareable plugin's README carries the plugins' tag and is linked into the vault as its plugin note: a symlink to it in `content/public/plugins/`, under any name and extension. |

Each lists every violation and exits 1 on any. The target is cached on the files the guards read and
the package builds' outputs, so a second run with nothing changed is a cache hit. `package-contract`,
`shared-packages`, `clean-packs` and `plugin-index` read built output, so the target depends on every package's
`build` (`^build`: the site package depends on every plugin and site plugin), which Nx takes from its
cache when a package is unchanged; the package guards take a couple of seconds, most of it clean-packs' `pnpm pack` runs. `core-drift` and `core-lock` compare against the
pinned ref's tree, fetched once (a depth-1 fetch, a few seconds) into the gitignored
`quartz/.upstream-cache/trees/<sha>/` (`utils/upstream-tree.mjs`, beside the upgrade's bare repo;
`diff-upstream`, `diff-latest` and `site:core-lock` read their upstream trees from there too); after that they need no network, but
the fresh `pnpm import` reads pnpm's metadata cache or the registry. Run one guard alone with
`node quartz/utils/guards/<name>.guard.mjs`; each test, in `utils/test/guard-<name>.test.mjs`,
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
pnpm nx run site:diff-latest                    # what would an upgrade to the tip of v5 pull in?
pnpm nx run site:upgrade-report --ref=<ref>     # the API-surface report alone; writes nothing
pnpm nx run site:upgrade --ref=<commit|branch|tag>
pnpm nx run site:upgrade --ref=<ref> --verify
```

It is [`utils/upgrade.mjs`](./utils/upgrade.mjs) ([#99](https://github.com/chaoticgoodcomputing/blog/issues/99)),
and runs these steps in order, stopping at the first that fails:

1. **Refuse a dirty tree.** Any uncommitted change in the working tree, tracked or untracked, stops
   it, so neither the upgrade nor `--verify`'s checks ever mix with work in progress, and an upgrade
   can always be undone with git. The one path left out is `content/private`, the private vault: a
   submodule of its own, which routinely holds uncommitted notes and which the upgrade never writes.
2. **Fetch** the pinned ref and the target into the upstream cache, `quartz/.upstream-cache/`
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

     The report never stops the upgrade. `site:upgrade-report --ref=<ref>` runs the fetch and the
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
   first failure with a non-zero exit: the repo guards (`site:guards`, every repo guard, Core's
   and the packages'), the typechecks (`nx run-many -t typecheck`: every package's, and
   `site:typecheck`, Core's own `tsc` over Core source and the site's `quartz.ts`, which the
   esbuild build never type-checks), the e2e suite (`site-e2e:e2e`), the
   real-site build (`site:build`). A failure here leaves the
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
`pnpm nx run site:test-utils`), offline apart from the pnpm store. `--verify`'s order and its
stop at the first failure are tested with stand-in steps (`QUARTZ_VERIFY_STEPS`, a JSON file of
`{ name, command }`), so the tests never run the real suite.

## Dependencies

**Core is a pnpm project of its own**, installed by `pnpm nx run site:install`: a frozen install
of `core/pnpm-lock.yaml` into `core/node_modules`. Its `core/pnpm-workspace.yaml` makes it a
workspace of its own, and pnpm stops at the nearest workspace file, so the repo's root install never
reaches it itself. The root install runs it anyway, from its `postinstall` script,
`nx run-many -t postinstall`, which runs `site:postinstall`, which depends on `site:install`: one
`pnpm install` at the root prepares everything. The root workspace sets
`optimisticRepeatInstall: false`, because pnpm's repeat-install shortcut checks only the root lock and
manifests, and would skip the postinstall when only Core is stale. Any project may add a `postinstall`
target to run after the install. It goes in `project.json`, never as a `package.json` script, which
pnpm would run itself and Nx would infer as a target and run again. Core's own settings:

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

`allowBuilds` is pnpm 11's, so `site:install` runs pnpm 11 by exact version through `npx`
(`npx --yes pnpm@11.27.1`), whatever pnpm the repo root pins. The upgrade and the `core-lock` guard
import Core's lock with the same pnpm, `CORE_PNPM` in `utils/core-tiers.mjs`: bump it and the
install target together. Inside `core/` the nearest workspace
root is Core's, whose `package.json` names no `packageManager`, so pnpm never switches versions there.

**The lock is upstream's, converted.** `core/pnpm-lock.yaml` is `pnpm import` of upstream's
`package-lock.json` at the pinned ref, so Core installs exactly the versions upstream shipped and
tested. Letting pnpm resolve Core's `package.json` fresh would move 62 of its packages instead,
`@quartz-community/remark-obsidian` 1.0.0 → 1.1.0 among them. The **lock check** proves the
conversion held, every package at the same version and nothing on either side the other lacks:

```bash
pnpm nx run site:core-lock     # against the pinned ref's package-lock.json, fetched from upstream
node quartz/utils/core-lock.mjs --npm-lock <file>   # against a local npm lock
```

At 97a2d05 it reads 415 of 415 packages matching. The hoisted layout places two packages
differently from npm (the top-level `picomatch` and `string-width` are another of the versions the
lock holds), which no code of ours imports: the `shared-packages` repo guard fails a plugin or site
plugin source that does. The upgrade converts the lock at a new ref, from that
ref's own `package-lock.json` (see Upgrading).

**Our plugins resolve the host's dependencies through `plugins/node_modules`,** a gitignored
symlink to `../core/node_modules` that the e2e harness and `site:prebuild` create. A plugin runs
from its real path under `plugins/`, where the site package's link leads. A git-installed plugin
sits at `.quartz/plugins/<name>/` inside Core, so its bare `import "preact"` finds Quartz's copy, and
that is what the loader's shared externals assume. A package of ours is loaded from its real path
instead, from which Node would otherwise walk up to the `node_modules` at the repo root, which is not
Quartz's, and at worst a second Preact. The workspace install therefore
never installs a peer beside a plugin (`autoInstallPeers: false`, below), and a plugin declares
Quartz's shared packages (Preact, `vfile`, `unified`, `lightningcss`, `@quartz-community/*`) only
as peers, never as devDependencies too, so its own `node_modules` never shadows a host singleton. A
library does the same, and a plugin that inlines one takes the library's shared packages as its own
peers, so its build leaves them external instead of bundling a second copy (the pipeline library's
`unified` and `vfile`, which `quartz-annotator` and `quartz-mdx` inline, #98). A library's typecheck
reads Core's copies through its `tsconfig.json` `paths`. The `shared-packages` repo guard checks all
of it.
`site-plugins/` needs the same link, `site-plugins/node_modules`, for the same reason. It's decided on
[#39](https://github.com/chaoticgoodcomputing/blog/issues/39) and wired on
[#64](https://github.com/chaoticgoodcomputing/blog/issues/64): `site:prebuild` makes it for the
real site once the site config enables a site plugin, and the e2e harness makes it beside
`plugins/node_modules`, building every site plugin too, because scratch sites built from the site
config load them. No fixture config lists a site plugin. Both replace a link left pointing anywhere
else, such as Core's old path.

**Everything else of ours is one pnpm workspace**
([#92](https://github.com/chaoticgoodcomputing/blog/issues/92)). `pnpm-workspace.yaml` at the repo
root lists the libraries, every plugin, every site plugin, the e2e suite and the site package
(`quartz/package.json`, **repo-only**, named `site` like its Nx project), so one
`pnpm install --frozen-lockfile` at the root prepares all of them from one lock, `pnpm-lock.yaml`.
The only other lock is Core's. The root pins pnpm by `packageManager` (`pnpm@11.27.1`, the version
`site:install` runs for Core), and pnpm switches to it whatever version is installed; it is the
repo's one pnpm pin, installed as no dependency. The
workspace settings:

```yaml
autoInstallPeers: false    # a plugin's peers are Core's copies, reached through the host links above
optimisticRepeatInstall: false  # always run the postinstall, which installs Core (above)
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

**The site package loads every plugin of ours.** `quartz/package.json` depends on each by
`workspace:*`, so pnpm links `quartz/node_modules/@chaoticgoodcomputing/quartz-<name>`, and each
site plugin's `@chaoticgoodcomputing/site-<name>`, to its directory. A site plugin is repo-only:
pnpm's workspace publish (`pnpm -r publish`) leaves it out, and a real publish refuses it
(`EPRIVATE`); a single package's `pnpm publish --dry-run` stops before that check, so it can't
show the refusal (pnpm 11.27.1). Quartz imports a package source from Core source, `core/quartz/`, and Node's upward
walk from there reaches `quartz/node_modules` after Core's own, so Core's `package.json` stays
upstream's. A new package is added there, in the same change that lists it in a config (#93). Its
build emits a `.d.ts` beside each `dist/` entry through `@chaoticgoodcomputing/declarations`, since
Quartz's generated plugin index (`install-plugins`) skips a package without `dist/index.d.ts`.
A package the site lists twice, to place its component in two places, is its dependency twice: once
by its own name, and once under an alias, the second entry's placement name
(`"email-subscribe-sidebar": "workspace:@chaoticgoodcomputing/quartz-email-subscribe@*"`). The
second entry is an object source, `{ repo: "<package>", name: "<placement name>" }`, and Quartz
imports an object source whose repo is a package by its `name`
([`gitLoader.ts:84-93`](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/gitLoader.ts#L84-L93),
[`config-loader.ts:441-442`](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/config-loader.ts#L441-L442)),
which the alias resolves to the same directory (#94). site-components is listed so twice more,
once per component it places, under the aliases `site-page-title` and `site-footer` (#96).
Quartz never prunes `.quartz/plugins/`, so a plugin that became a package leaves its old link
there, live or pointing nowhere; `site:prebuild` and the e2e harness remove every such link, and
every link into `plugins/` or `site-plugins/`, before every build (`pruneGonePlugins` in
`utils/plugin-packages.mjs`).

**Nx infers targets from the workspace members' `package.json` scripts,** now that plugins and the
e2e suite are members (#92): a `typecheck` script on a package without a `typecheck` target in its
`project.json` (`quartz-mdx`, `quartz-og-image`, `site-styles`) becomes one, and `site-e2e` gets `test`
from the suite's `test` script. So `nx run-many -t test` starts the whole e2e suite. A target in
`project.json` wins over an inferred one of the same name. The e2e harness and
`site:prebuild` take the same two steps from one module, `utils/plugin-packages.mjs`: the frozen
workspace install, a no-op when nothing has moved, then an Nx build of the packages they load
(`pluginDirOf` maps a package name, or an object source's `repo`, to its directory).
Content reaches a library the same way: the root `package.json` depends on
`@chaoticgoodcomputing/widgets` by `workspace:*`, so an `.mdx` page in the vault or the e2e fixture
resolves `@chaoticgoodcomputing/widgets/<widget>` by Node's upward walk to the root `node_modules` (#36).

## Before the cutover

Until the cutover (#81) this tree was `quartz-v5/`, beside the root `quartz/` that held the Quartz 4
copy building the live site. The cutover deleted the v4 copy and renamed this tree to `quartz/`, so
Core now sits at `quartz/core/`. Commits and links before then name the old paths.
