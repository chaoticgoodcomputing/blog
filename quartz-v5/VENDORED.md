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
├── project.json     Nx targets (this project is `site-v5`)
├── CONTEXT.md       glossary for this context
├── VENDORED.md      this file
├── upstream.json    the pinned upstream ref — machine-readable source of truth
└── quartz/          the vendored copy: upstream's repo root, verbatim
```

Everything of ours lives _outside_ `quartz/`. That is what makes the invariant below absolute
rather than "identical except for a few files of ours".

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

`quartz-v5/quartz/` is **byte-identical to the pinned commit. No exceptions, no additions.**

```bash
pnpm nx run site-v5:diff-upstream
```

A clean run proves we carry no undocumented changes. It exits non-zero on drift, so it works as
a CI guard. Anything it reports is either a change that needs a ticket and a `quartz:vendored`
label, or a change that needs reverting.

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

`sync` refuses to run while the copy has drifted, so local changes are never silently
discarded. After syncing, update the Provenance table above.

## Dependencies

Self-contained in `quartz/node_modules`. Upstream uses **npm** with its own `package-lock.json`,
and its versions conflict with the v4 tree at the repo root (preact, unified, shiki). This
directory is deliberately _not_ a pnpm workspace package, so the root `pnpm install` ignores it.

## Relationship to `quartz/` at the repo root

The root `quartz/` is the **Quartz 4 copy that builds the live site**, untouched by any of this.
Both exist in parallel for the duration of the migration; the v4 copy goes away only at cutover.
