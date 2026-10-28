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

The plugin, as built (`dist/`, and a vault's copy of it), carries other people's work under their
own licenses. The build copies each one's notices beside it.

| Component | In the build | License | Notice |
| --- | --- | --- | --- |
| [Hypothesis client](https://github.com/hypothesis/client), the `hypothesis` npm package, with one patch of ours ([patches/README.md](./patches/README.md)) | `frames/hypothesis/build/` | BSD 2-Clause, © Hypothes.is Project and contributors | `frames/hypothesis/LICENSE` |
| [PDF.js](https://github.com/mozilla/pdf.js), the `pdfjs-dist` npm package | bundled into `frames/viewer.js`; its worker, styles and data in `frames/pdfjs/` | Apache 2.0, © Mozilla Foundation; its CMaps, standard fonts, ICC profile and WebAssembly decoders under their own licenses | `frames/pdfjs/LICENSE`, and the `LICENSE*` files in each folder of `frames/pdfjs/` |
| [monkey-around](https://github.com/pjeby/monkey-around) | bundled into `main.js` | ISC, © PJ Eby | `licenses/monkey-around.LICENSE` |

## History

Up to 0.2.11, upstream's plugin carried pages and API responses saved from hypothes.is and
via.hypothes.is, two copies of PDF.js, Dark Reader, and code adapted from Algolia's
youtube-captions-scraper, each under its own license, and built the Hypothesis client from Elias
Sundqvist's fork of it. This fork carried them, with their notices put in order, until 0.3.0, which
replaced them with the components above and dropped EPUB, web and video annotation. They are in
this repository's history (`git log -- packages/annotator/plugin/resources`).

`package.json` named the license as MIT. It names AGPL-3.0, the license in `LICENSE.TXT` and
upstream's README.
