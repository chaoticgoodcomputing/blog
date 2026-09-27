# @chaoticgoodcomputing/icons

The library every plugin that draws an icon uses to draw it (#29). It turns an **icon id** into
inline SVG when the site builds, from an installed Iconify set or from an **icon collection** the
site supplies as SVG files, and it knows nothing about tags or any other caller. Engines publish icon
ids and never drawn icons (ADR-0002 rule 7), so each consumer draws its own: `quartz-tag-list` first,
then the tag explorer, backlinks, the graph and the post listing. The Bluesky widget draws with it ahead of time, into
its own source (`widgets`' ADR-0002). It ships as TypeScript source,
and a consuming plugin's build inlines it (ADR-0005). Inherits the family vocabulary in
[`quartz/CONTEXT.md`](../../CONTEXT.md), where **Icon id** and **Icon collection** are defined.

## Language

**Installed collection**:
An icon collection that is an npm package, `@iconify-json/<prefix>`, such as MDI's. It needs no
configuration: its prefix is its package name. Pinned by the lockfile, never fetched.
_Avoid_: icon font, CDN icons, provider

**Site collection**:
An icon collection a site supplies as a directory of SVG files, one icon per file, named after the
file, and registers under a prefix through its consumers' `iconCollections` option. The SVG files are
its source of truth; nothing generated from them is committed. This site's is `custom:`, in
`quartz/icons/`.
_Avoid_: custom icons (the prefix is the site's choice), icon folder, sprite

**Drawn icon**:
What the library returns for an icon id: one `<svg>` element, sized `1em` with its `viewBox`,
`aria-hidden`, and with every mark painted in `currentColor`. A consumer gives it a class of its own
and skins it with CSS, so the icon takes the colour of the element it sits in.
_Avoid_: rendered icon, icon markup, glyph (fine for what the reader sees, not for the string)

**Normalising**:
What a site collection's files go through when the site builds, by `@iconify/tools`: cleaned of
editor markup, every colour they paint turned into `currentColor` (an unpainted mark, `fill="none"`,
stays unpainted), and optimised by SVGO. Installed sets are drawn in `currentColor` already.
_Avoid_: converting, compiling, sanitising

## Constraints

- **An unknown icon id throws.** A misspelt name, an unknown prefix, or a site collection whose
  directory is missing all throw an `IconError`, and the consumer lets it fail the build. v4 only
  warned in the reader's console.
- **Server-side only.** It reads the file system and resolves installed sets from wherever it runs.
  A script that needs icons in the browser gets them drawn into its plugin's own published artifact.
  A widget, which has no build of its own, gets them drawn into a committed `icons.ts` beside it
  ([`widgets`' ADR-0002](../widgets/docs/adr/0002-browser-icons-are-drawn-ahead.md)).
- **A consumer carries Iconify's packages itself.** They run while the site builds and can't all be
  inlined, so a consuming plugin keeps the library's dependencies external and lists each as its own
  dependency, at the library's exact versions ([ADR-0001](./docs/adr/0001-consumers-carry-iconify.md)).
- **Colour and size come from CSS** (ADR-0003): a consumer never writes a colour into an icon.
  A canvas, which CSS can't reach, is the one exception: `quartz-graph` sets an icon's `currentColor` to
  a theme colour it resolves in script, and resolves it again on a scheme switch.
- **Normalised once per process.** A site collection is read the first time one of its icons is
  drawn, and kept for the rest of the process, so a file added under `--serve` needs a restart.
- **Tested through its consumers**, `quartz-tag-list`'s `e2e/icons.spec.mjs` and `e2e/site.spec.mjs`,
  `quartz-graph`'s `e2e/icons.spec.mjs` and `quartz-post-listing`'s, against the fixture's own collection
  (`tests/fixture-icons/`) and the site's.
