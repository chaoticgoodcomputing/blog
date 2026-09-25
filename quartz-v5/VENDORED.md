# Vendored copy of Quartz 5

`quartz-v5/quartz/` is an **unmodified copy of upstream Quartz**, vendored for the v4 → v5
migration ([#18](https://github.com/chaoticgoodcomputing/blog/issues/18)).

Quartz 5 has no npm package — it is `private: true` and unpublished, and its own upgrade path
(`npx quartz upgrade`) works by adding a git remote and merging. Vendoring is the supported way
to consume it, not a workaround.

**Read [ADR-0001](../docs/adr/0001-customization-through-plugins.md) before changing anything in
`quartz/`.** Customization belongs in plugins. Edits to the vendored tree are a last resort, and
each one needs a ticket plus a strategy for proposing it upstream, tracked under the
`quartz:vendored` label.

## Layout

```
quartz-v5/
├── project.json          Nx targets (this project is `site-v5`)
├── CONTEXT.md            glossary for this context
├── VENDORED.md           this file
├── upstream.json         the pinned upstream ref — machine-readable source of truth
├── quartz.config.yaml    our Quartz 5 configuration — tracked here, symlinked into quartz/
├── plugins/              our Quartz plugins (`cgc-*`)
├── site-plugins/         this site's own plugins, which fail the shareability test on purpose
├── libs/                 our non-plugin packages (`@chaoticgoodcomputing/*`)
├── tests/                Playwright suite and `content-fixture/`
├── utils/                tooling for this context — `upstream.mjs`
└── quartz/               the vendored copy: upstream's repo root, verbatim
```

Every file of ours that is _tracked_ lives _outside_ `quartz/`. That is what makes the invariant
below meaningful rather than "identical except for a few files of ours".

## The one file of ours that has to sit inside

`quartz.config.yaml` is the exception, and it is forced rather than chosen. Source links below
point at upstream at [`97a2d05`](https://github.com/jackyzha0/quartz/tree/97a2d05f80c4c50534959b1d0d41cc4b3895625e) (v5.0.0), the ref
[`upstream.json`](./upstream.json) pins:

- [`config-loader.ts:35`](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/config-loader.ts#L35) reads `path.join(process.cwd(), "quartz.config.yaml")`.
- cwd cannot be moved up to `quartz-v5/`. [`constants.js:15`](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/cli/constants.js#L15) does
  `readFileSync("./package.json")` at module load and [`:14`](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/cli/constants.js#L14)
  sets `fp = "./quartz/build.ts"`, both
  relative to cwd — so cwd must be the directory holding upstream's `package.json` and its `quartz/`
  source dir, which is `quartz-v5/quartz/`.
- There is no `--config` flag ([`args.js`](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/cli/args.js)) and no environment override.

So the tracked file is `quartz-v5/quartz.config.yaml`, and `quartz-v5/quartz/quartz.config.yaml`
is a symlink to it, created by a `site-v5` prebuild step. The symlink is gitignored and excluded
from the drift check; `sync` destroys it along with the rest of the tree, and prebuild recreates it.

> **Not yet wired.** Neither the tracked config nor the prebuild step exists yet — this records the
> arrangement decided on [#22](https://github.com/chaoticgoodcomputing/blog/issues/22), so that the
> guard rails (`.gitignore`, `EXCLUDES`) are in place before the first plugin needs them. Do not
> create an empty `quartz.config.yaml` as a placeholder:
> [`resolveConfigPath`](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/install-plugins.ts#L14-L17)
> prefers it over `quartz.config.default.yaml`, so an empty one silently disables every default
> plugin.

One consequence to remember: `source:` entries inside that config are resolved with
`path.resolve()` against cwd ([`gitLoader.ts:99`](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/gitLoader.ts#L99)), which is the
vendored root —
**not** the directory the tracked file lives in. Local plugins are therefore `../plugins/cgc-tags`,
not `./plugins/cgc-tags`.

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

`quartz-v5/quartz/` is **byte-identical to the pinned commit across every tracked file, except for
vendored changes — and every vendored change is made in a commit that cites its ticket.**

Vendored changes are never stored separately. Two targets generate everything there is to know
about them from the tree and its history:

```bash
pnpm nx run site-v5:diff-upstream   # the complete unified diff against the pinned commit
pnpm nx run site-v5:vendored-log    # the commits that made it, and the tickets each cites
```

`diff-upstream` answers _what_ differs. Its stdout is a patch that `git apply` accepts from the
repo root, and the file count goes to stderr, so `> vendored.patch` captures it cleanly.
`vendored-log` answers _why_. It lists every commit since the last sync (the last commit to touch
`upstream.json`) that changed the vendored copy, with the `#<n>` tickets its message cites, flags any
commit that cites none, and lists uncommitted edits, which have no commit to carry a ticket yet.
The rule is that every file `diff-upstream` names traces to a flagged-clean commit in
`vendored-log`. The ticket itself carries the `quartz:vendored` label and the upstream proposal.

Current vendored changes:

| Files | Why | Upstream proposal |
| ----- | --- | ----------------- |
| `quartz/plugins/types.ts`, `quartz/plugins/pageTypes/dispatcher.ts` | [#19](https://github.com/chaoticgoodcomputing/blog/issues/19): four default transformers are async, so a page type cannot run the pipeline from a synchronous `generate`. Makes `generate` awaitable. Needed by `cgc-mdx`. | [#25](https://github.com/chaoticgoodcomputing/blog/issues/25), filed after cutover |

The only things permitted inside it are generated and gitignored, and they are an explicit
allowlist rather than a judgement call — `EXCLUDES` in `quartz-v5/utils/upstream.mjs`:
`node_modules/`, `.quartz/`, `.quartz-cache/`, `public/`, `tsconfig.tsbuildinfo`, and
`quartz.config.yaml` (see above). **Nothing else, ever, and nothing of ours committed.** Adding to
that list is a decision about the invariant itself, not a convenience.

This matters because it is easy to violate by accident. `nx run site:format` runs
`prettier . --write` from the repo root and _will_ rewrite upstream files unless
`quartz-v5/quartz` is excluded in `.prettierignore` — which is why it is. The ignore is scoped to
the vendored subtree deliberately, so our own files under `quartz-v5/` are still formatted.

## Upgrading

`npx quartz upgrade` does **not** work here: it runs `git remote add upstream …` against the
enclosing repository, which is this blog, not Quartz. Use the targets instead.

```bash
pnpm nx run site-v5:diff-latest                    # what would an upgrade pull in?
pnpm nx run site-v5:sync --args="--ref=<commit>"   # re-vendor at that ref
pnpm nx run site-v5:install                        # refresh dependencies
```

`sync` replaces the whole tree, so it refuses while the copy carries vendored changes, and they are
never silently discarded. To upgrade anyway, save them, sync with `--force`, and re-apply whatever
upstream has not taken in the meantime:

```bash
pnpm -s nx run site-v5:diff-upstream > vendored.patch
node quartz-v5/utils/upstream.mjs sync <ref> --force
git apply vendored.patch      # drop hunks upstream now has; commit what remains with its ticket
```

After syncing, update the Provenance table above, and remove any row from the vendored-changes table
whose change upstream has taken.

## Dependencies

Self-contained in `quartz/node_modules`.

**Local plugins resolve the host's dependencies through `plugins/node_modules`,** a gitignored
symlink to `../quartz/node_modules` that the e2e harness creates. A git-installed plugin sits at
`.quartz/plugins/<name>/` inside the Quartz root, so its bare `import "preact"` finds Quartz's copy,
and that is what the loader's shared externals assume. A local plugin is only symlinked there, and
Node resolves from the symlink's target under `plugins/`, which would otherwise walk up to the v4
tree's `node_modules` at the repo root: a second, older Preact. A plugin's own install therefore
omits peers (`npm ci --omit=peer`), so its local `node_modules` never shadows a host singleton. `site-plugins/` needs the same link, `site-plugins/node_modules`, for the same reason. It's
decided on [#39](https://github.com/chaoticgoodcomputing/blog/issues/39) but not wired yet. Upstream uses **npm** with its own `package-lock.json`,
and its versions conflict with the v4 tree at the repo root (preact, unified, shiki). This
directory is deliberately _not_ a pnpm workspace package, so the root `pnpm install` ignores it.

## Relationship to `quartz/` at the repo root

The root `quartz/` is the **Quartz 4 copy that builds the live site**, untouched by any of this.
Both exist in parallel for the duration of the migration; the v4 copy goes away only at cutover.
