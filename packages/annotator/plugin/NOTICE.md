# Notice

This directory is a **modified version** of [Obsidian Annotator](https://github.com/elias-sundqvist/obsidian-annotator),
by Elias Sundqvist and contributors, hard-forked into this repository on **2026-10-28**.

- **Forked from**: upstream commit
  [`3647dd92d0d803bae9a3f34a1aac19eacb2fd52d`](https://github.com/elias-sundqvist/obsidian-annotator/commit/3647dd92d0d803bae9a3f34a1aac19eacb2fd52d),
  release 0.2.11, 2024-01-08.
- **How it came in**: as a verbatim snapshot, without upstream's history, in one commit. Every change
  since is in this repository's history under `packages/annotator/plugin/`
  (`git log --follow -- packages/annotator/plugin`).
- **Upstream contributors**, from its history (2021-04-30 to 2024-01-08): Elias Sundqvist,
  Andrey Aleksandrov, Vacodwave, Hardway, Jonas Schumacher, Matthew Turk, Riccardo Di Maio, Sam Xie.

## License

Obsidian Annotator is licensed under the **GNU Affero General Public License, version 3**
([LICENSE.TXT](./LICENSE.TXT)), and so is this modified version, including every change made to it
here. Anyone who receives this program, or interacts with a modified version of it over a network,
is entitled to its source under that license.

That license covers this directory only. The rest of this repository is not part of the program and
is not licensed by it.

## Third-party components

Parts of this directory are other people's work under their own licenses, each kept beside the work
it covers.

| Component | Where | License | Notice |
| --- | --- | --- | --- |
| Hypothesis web pages and API responses, saved from hypothes.is, including the EPUB.js demo | `resources/hypothes.is`, `resources/cdn.hypothes.is` | BSD 2-Clause, © Hypothes.is Project and contributors | `LICENCE` in each folder |
| Via, Hypothesis's proxy, saved from via.hypothes.is | `resources/via.hypothes.is` | BSD 2-Clause, © Hypothes.is Project and contributors | `resources/via.hypothes.is/LICENCE` |
| PDF.js 3.17.2 and 2.3.160, as Via ships them | `resources/via.hypothes.is/static/*/vendor/pdfjs-2` | Apache 2.0, © Mozilla Foundation; its CMaps and standard fonts under their own licenses | `LICENSE` in each `pdfjs-2`, and `LICENSE*` in `web/cmaps` and, where it exists, `web/standard_fonts` |
| Dark Reader | `resources/dark-reader` | MIT, © Alexander Shutau | `resources/dark-reader/LICENCE` |
| youtube-captions-scraper 1.0.3, adapted | `src/youtube-captions-scraper.tsx` | MIT, © Algolia, Inc. | [`licenses/youtube-captions-scraper.LICENSE`](./licenses/youtube-captions-scraper.LICENSE) |

Upstream changed some of the saved Hypothesis files; [Modified Resources.md](./Modified%20Resources.md)
lists the changes.

The npm dependencies in `package.json` are bundled into a release's `main.js` under their own
licenses, which a release build does not yet collect.

### Changed here for licensing

- The PDF.js 2.3.160 copy (`resources/via.hypothes.is/static/ef2d733d262c3d7cbfc8d072f760f240/vendor/pdfjs-2`)
  had no license file. It now has PDF.js's Apache 2.0 `LICENSE`, copied from the 3.17.2 copy beside it.
- `src/youtube-captions-scraper.tsx` came without credit. It now names its source, and its MIT
  license is in `licenses/`.
- `package.json` named the license as MIT. It now names AGPL-3.0, the license in `LICENSE.TXT` and
  upstream's README.
