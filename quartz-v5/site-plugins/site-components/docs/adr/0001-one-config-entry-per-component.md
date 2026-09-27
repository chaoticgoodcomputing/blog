---
status: accepted
date: 2026-09-25
---

# One site config entry per component

[Where do the ledger's unassigned pieces live?](https://github.com/chaoticgoodcomputing/blog/issues/44)
put the site's page title and footer in one site plugin, `site-components`. But Quartz 5 lays out
one component per config entry. So the site config lists the plugin once for each component it
places, and gives each entry a name of its own, through an object source:

```yaml
- source: { repo: ../site-plugins/site-components, name: site-page-title }
  layout: { position: left, priority: 10 }
- source: { repo: ../site-plugins/site-components, name: site-footer }
  layout: { position: footer, priority: 50 }
```

> Source links point at upstream Quartz at
> [`97a2d05`](https://github.com/jackyzha0/quartz/tree/97a2d05f80c4c50534959b1d0d41cc4b3895625e)
> (v5.0.0), the ref `quartz-v5/upstream.json` pins.

## Why

**An entry's layout places one component, which the loader finds by the entry's name.** It
takes the plugin name from the source
([config-loader.ts:749](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/config-loader.ts#L749)).
Then it looks for a component registered under that name, and after that under its PascalCase
([:751-773](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/config-loader.ts#L751-L773)).
A plugin's components are registered under their export names. The plugin's own name is registered
only when the manifest declares exactly one component
([componentLoader.ts:52-65](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/componentLoader.ts#L52-L65)).
So a plain `source: ../site-plugins/site-components` entry places neither of the two components.
Every stock plugin has at most one.

**The name of an object source's entry is the site's to choose.** A local object source takes its
name from `name` when one is given
([gitLoader.ts:76-79](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/gitLoader.ts#L76-L79)).
The config schema documents the field for monorepo plugins. Entries named `site-page-title` and
`site-footer` find `SitePageTitle` and `SiteFooter` by PascalCase. Both entries resolve to the same
directory, and Node loads one copy of the module through both links.

## Consequences

- The plugin is still one package. Its directory, Nx project and manifest name are all
  `site-components`. Each **placement** (CONTEXT.md) has a name of its own, and that name is what
  the loader reports and what `byPageType.exclude` takes.
- The plugin is component-only, so listing it twice runs no hook twice. It has no transformer,
  because its components' CSS is the site's, in site-styles.
- Whatever reads the site config's sources has to accept an object source: `site-v5:prebuild`, and
  the e2e harness's `siteConfig()`, which rebases `repo` as it rebases a string source. Both builds
  still build the plugin once.
- The export names are prefixed `Site…` so the bare-name registrations don't collide with stock's
  `PageTitle` and `Footer`.

## Considered alternatives

- **One site plugin per component** (`site-page-title`, `site-footer`). This is the ecosystem's shape,
  and it needs no object sources. Rejected because it undoes #44's grouping, which named one
  `site-components` plugin beside `site-styles`.
- **A composite component.** Rejected: the title and the footer sit in different layout positions,
  and one entry has one position.
- **A vendored change** to let an entry name the component it places. Rejected: a config-level
  workaround exists, so there is no case for a third vendored change (ADR-0001).

## Amendment: the package name, and an alias per placement

_2026-09-27, from [Site plugins as repo-only packages, and local plugin paths retired](https://github.com/chaoticgoodcomputing/blog/issues/96)._

The plugin is now the repo-only package `@chaoticgoodcomputing/site-components`, listed by package
name, and the entries read:

```yaml
- source: { repo: "@chaoticgoodcomputing/site-components", name: site-page-title }
- source: { repo: "@chaoticgoodcomputing/site-components", name: site-footer }
```

Quartz imports an object source whose `repo` is a package by its `name`, not its `repo`
([gitLoader.ts:84-93](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/gitLoader.ts#L84-L93),
[config-loader.ts:441-442](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/config-loader.ts#L441-L442)).
So the site package, `quartz-v5/package.json`, depends on the plugin under each placement name as
well, a pnpm workspace alias: `"site-page-title": "workspace:@chaoticgoodcomputing/site-components@*"`,
and the same for `site-footer`. #94 found this pattern for the subscribe box the site lists twice.
Without the alias, stock Quartz skips the entry with a warning and places nothing. The harness's
`siteConfig()` no longer rebases `repo`: it is a package name, the same from any root.
