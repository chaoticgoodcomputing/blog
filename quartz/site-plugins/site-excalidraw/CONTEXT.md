# site-excalidraw

The site plugin that embeds the vault's Excalidraw drawings as the SVGs Obsidian's Excalidraw plugin
exports beside each one, the light or the dark export by the page's theme, and keeps each drawing's
own note off the site. It is a transformer and a filter. Inherits the family vocabulary in
[`quartz/CONTEXT.md`](../../CONTEXT.md). No fixture config loads it, so its spec builds a scratch
site from the site config.

**Vendored, temporarily, for testing.** It is a port of a third party's plugin, not a plugin of ours
by design: whether the site keeps it, and in what form, is still open.

## Provenance

|          |                                                                                                    |
| -------- | -------------------------------------------------------------------------------------------------- |
| Upstream | https://github.com/dinolupo/quartz-excalidraw                                                      |
| Commit   | [`8de8290`](https://github.com/dinolupo/quartz-excalidraw/tree/8de8290a75c4eade3b21ce5ec0df653c5259dd7d) (2026-09-26) |
| License  | MIT, © 2026 Dino Lupo: [`LICENSE`](./LICENSE), upstream's, kept with its code                       |

Upstream is a Quartz 4 drop-in, a single
[`index.ts`](https://github.com/dinolupo/quartz-excalidraw/blob/8de8290a75c4eade3b21ce5ec0df653c5259dd7d/index.ts)
cloned into a site's `quartz/plugins/transformers/`. It can't be installed on Quartz 5 as it stands:
its `package.json` has no `quartz` manifest, no build and no `dist/`, only `"main": "index.ts"`,
and it imports `QuartzTransformerPlugin` as a value from Quartz 4's `quartz/plugins/types`. Quartz
5's loader, finding no manifest, imports the module to learn its category, which should fail, and
then skips the plugin with a warning, so a build would still pass with no drawing rendered (read from
the loader, `config-loader.ts`, not tried).

## Language

**Drawing**:
An Excalidraw drawing in the vault: its **note**, `<name>.md` (or `<name>.excalidraw.md`), which
opens with the `excalidraw-plugin` frontmatter key and holds the scene data, and its **exports**
beside it, `<name>.light.svg` and `<name>.dark.svg` (or one `<name>.svg`), which Obsidian's
Excalidraw plugin writes on save with auto-export on.
_Avoid_: diagram, doodle (the vault's folder name, not a kind), canvas (Obsidian's other format)

**Embed**:
How a post places a drawing: `![[<target>]]`, sized by an alias of `600` or `600x400`, or upstream's
`![alt](<target>.excalidraw)`.
_Avoid_: transclusion (what OFM makes of an embed the plugin leaves alone)

## What the port changed

- **A Quartz 5 package.** A site plugin in the package contract's shape, with a `quartz` manifest
  (`transformer` and `filter`, one factory each, as site-styles has), bundled to `dist/`.
- **The vault's embeds.** Upstream matched only a target spelled with `.excalidraw`. The vault embeds
  a drawing by its note's path from the vault root, one folder above the content folder, and with no
  extension (`![[public/assets/doodles/panic-01-engineering-loop]]`). So a target is tried as
  written, then with each leading folder dropped, then by name alone when one drawing has it
  (`src/resolve.ts`). A target without `.excalidraw` names a drawing only when its note carries the
  `excalidraw-plugin` key, so an embed of a plain note is never taken for one.
- **The file list, not the disk.** Exports are found in Quartz's `ctx.allFiles`, not by probing the
  content folder, and each `src` is the export's slug from the content root, which crawl-links
  makes relative to the page. Upstream wrote the raw path, which misses any export whose name
  Quartz slugifies.
- **The drawings' notes are unpublished** by the filter. Upstream left them to be built as pages of
  scene data.
- **No CSS of its own.** The rules that show one export per theme are application CSS, in
  site-styles' components tier (ADR-0003's site-plugin amendment), keyed on darkmode's `saved-theme`.
- **Alt text** is the alias when it is not a size, else the drawing's name, and is escaped.

Order: `defaultOrder: 25`, below obsidian-flavored-markdown's 30, so an embed is rewritten before OFM
reads it as a transclusion.

## Proof

`e2e/site-excalidraw.spec.mjs`, on a scratch site built from the site config, in both themes: an
embed by vault path shows one export per theme, swapping on the darkmode toggle; one by name alone
is sized by its alias; upstream's spelling still works; a plain note's embed is left alone though an
SVG shares its name; and the drawings' notes are 404s while their exports are served.
