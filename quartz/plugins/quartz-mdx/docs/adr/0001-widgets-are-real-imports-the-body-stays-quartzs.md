---
status: accepted
date: 2026-09-24
---

# Widgets are real ES imports; the body stays Quartz's

An MDX page brings in widgets with ordinary `import` statements. `cgc-mdx` resolves those
statements the way a bundler would: relative to the `.mdx` file, or from `node_modules`. There is
no registry, no alias, no configured widget directory, and the plugin ships no widgets of its own.
Only the imports are bundled, using esbuild. The page body is **not** compiled into an MDX module.
It stays on the markdown→hast pipeline that `cgc-mdx` reconstructs from Quartz's configured
transformers, and each widget element is rendered into that tree.

> Links to v4 code point at this repo's
> [`9e48f89`](https://github.com/chaoticgoodcomputing/blog/tree/9e48f89b256f511a94f07d473d46395d91730c53).
> Links to Quartz 5 point at upstream
> [`97a2d05`](https://github.com/jackyzha0/quartz/tree/97a2d05f80c4c50534959b1d0d41cc4b3895625e)
> (v5.0.0), the ref `quartz/upstream.json` pins.

## Why

**MDX leaves resolution to the host, so bundler resolution is the canonical rule.** MDX defines
`import`/`export` as plain ESM and assumes
["an integration is used to compile MDX -> JS"](https://mdxjs.com/docs/using-mdx/). Every
framework that supports imports inherits its bundler's rules: relative paths from the file, bare
specifiers from `node_modules`, and aliases layered on top. Examples are
[`@next/mdx`](https://nextjs.org/docs/app/guides/mdx),
[Docusaurus](https://docusaurus.io/docs/markdown-features/react) and
[mdx-bundler](https://github.com/kentcdodds/mdx-bundler). Taking those rules with **no** aliases
is what makes `cgc-mdx` pass [ADR-0001](../../../../../docs/adr/0001-customization-through-plugins.md)'s
shareability test for authors as well as code. A site laid out nothing like ours can write
`import { X } from './widgets/x'` and it works with zero configuration.

**v4's mechanism was a registry dressed as an import.** It matched specifiers against two
hard-coded prefixes
([mdx.ts:65-72](https://github.com/chaoticgoodcomputing/blog/blob/9e48f89b256f511a94f07d473d46395d91730c53/quartz/plugins/transformers/mdx.ts#L65-L72)),
deleted the import nodes
([:96-103](https://github.com/chaoticgoodcomputing/blog/blob/9e48f89b256f511a94f07d473d46395d91730c53/quartz/plugins/transformers/mdx.ts#L96-L103))
and looked each widget up by its path string. That made our vault layout (`@content/widgets/*`)
a prescription for every site, and adding a widget meant editing a registry that only repeated
the folder listing.

**Widgets cannot live inside a plugin and stay editable.** Quartz 5 symlinks a local plugin and
never builds it
([gitLoader.ts:476](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/gitLoader.ts#L476)).
`serve` watches source and config but never rebuilds a plugin
([handlers.js:588-603](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/cli/handlers.js#L588-L603)).
A widget compiled into a plugin's `dist` is frozen until a manual rebuild, and every site owner
who wants a widget would have to write a plugin to get it. Because `cgc-mdx` bundles the imports
itself, widgets can sit in the vault, in any package, or anywhere a bundler can reach.

**Why not compile the MDX itself?** `@mdx-js/mdx`'s `compile` would give real JSX expressions,
real children and working `export`s. The cost is that the body stops being a hast tree Quartz
renders and becomes a JS module that _produces_ the page. The wikilink, transclusion, TOC and
backlink parity proven for `.md` would then have to be re-established through `compile`'s plugin
hooks from scratch. We chose the smaller step, the one most likely to work, so the migration can
finish. Full compilation remains the escape hatch if the limits below start to bite.

## Consequences

- **Known limitations:** JSX children are flattened to text, and props are static literals
  evaluated from the expression tree `remark-mdx` already parses, never through `eval`. v4 used
  `eval`
  ([mdx.ts:145](https://github.com/chaoticgoodcomputing/blog/blob/9e48f89b256f511a94f07d473d46395d91730c53/quartz/plugins/transformers/mdx.ts#L145)).
  `JSON.parse` is not a substitute, because live pages write props with unquoted keys and
  comments.
- **Bundling is per widget, with shared chunks.** One esbuild build covers every widget the corpus
  imports, with code splitting. Each page loads only the chunks its own imports reach. That keeps
  per-page loading, which v4 already had
  ([mdx.ts:174-197](https://github.com/chaoticgoodcomputing/blog/blob/9e48f89b256f511a94f07d473d46395d91730c53/quartz/plugins/transformers/mdx.ts#L174-L197)),
  while letting a heavy dependency such as plotly cache across pages.
- **`cgc-mdx` emits the chunk files and loads them itself.** Quartz 5 has **no** per-page
  resources: every page gets the same global script set, and a per-page `<script>` does not survive
  SPA navigation
  ([SPA research](https://github.com/chaoticgoodcomputing/blog/issues/34)). v4's
  `fileData.pageResources` was our own fork's addition, not upstream behaviour. Instead of
  `<script>` tags, a page carries **markers**: an element per widget naming its entry chunk. The
  runtime ([ADR-0002](./0002-widgets-are-islands.md)) loads each entry with `import()`.
- **An unresolved import, or a widget that throws while rendering at build time, fails the
  build**, naming the `.mdx` file and the specifier. A silently broken widget on a published page
  is worse than a red build.
- **Reusable widgets ship as libraries, not plugins.** This repo's `pdf-viewer` and
  `bluesky-post` become a plain package that MDX imports like any other dependency. If a widget
  cannot come from an npm package, the contract is wrong.

## Amendment, 2026-09-24: proven on game-of-life

The contract held when real code ran it
([Prove the widget contract with `game-of-life`](https://github.com/chaoticgoodcomputing/blog/issues/35)).
A fixture page imports the widget by an extensionless relative path laid out nothing like our
vault, and the build resolves, bundles, renders and hydrates it with zero configuration. What the
implementation added to this ADR:

- **One package, two roles.** `cgc-mdx` is a page type _and_ an emitter. The loader files one
  package under every category it declares
  ([config-loader.ts:342-350](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/config-loader.ts#L342-L350)), and one
  object can satisfy both shapes
  ([:536-539](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/config-loader.ts#L536-L539)). The page type's
  `generate` and the emitter's `emit` await the same compile, memoised per `buildId`, so the
  corpus is parsed and bundled once. The emitter writes the chunks to `static/cgc-mdx/`.
  _[ADR-0004](./0004-mdx-pages-at-their-clean-urls.md) adds a third role, a transformer, and
  exports the two shapes from two factories._
- **Preact is pinned to the host's copy.** A widget resolves Preact from wherever it sits, and in
  this repo that is the v4 tree's `preact@10.28.2`, not Quartz 5's `10.29.8`. Two Preacts on
  one page break hooks. So every `preact`/`preact-render-to-string` import in a widget build
  resolves to the Preact the plugin itself sees, which is the host's, because Preact is a peer and a
  loader singleton ([gitLoader.ts:806](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/gitLoader.ts#L806)). This is how
  an islands framework owns its renderer, and it is the one resolution the plugin overrides.
- **A widget's own `tsconfig.json` is not read.** JSX is always `preact`'s automatic runtime, so
  a stray config above the vault cannot re-point it. Aliases were already ruled out.
- **The MDX surface is narrower than MDX.** Only `import` is allowed: `export` and namespace
  imports fail the build. A capitalised element that was never imported fails the build.
  Lowercase JSX renders as plain HTML with its attributes evaluated as data. `{…}` in the body,
  including `{/* comments */}`, is dropped, since there is no evaluation context.
- **Widget source is published.** Quartz's asset emitter copies every non-page file under the
  content directory, so a vault's widget `.tsx` and `.css` land in `public/`, as v4's
  `widgets/` did. `cgc-mdx` reads widgets from the filesystem, never from `ctx.allFiles`, so a
  site can exclude its widget directories with `ignorePatterns`. That is the site's call.
