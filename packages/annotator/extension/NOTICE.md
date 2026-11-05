# Notice

This directory is a **modified version** of the [Hypothesis browser extension](https://github.com/hypothesis/browser-extension),
by the Hypothes.is Project and contributors, hard-forked into this repository on **2026-11-05**.

- **Forked from**: upstream commit
  [`a29dd56bc736aa231e229e34dc42a1ded49151fc`](https://github.com/hypothesis/browser-extension/commit/a29dd56bc736aa231e229e34dc42a1ded49151fc),
  "Update Hypothesis client to 1.1769.0", 2026-10-15.
- **How it came in**: as a verbatim snapshot of every file upstream tracks, without upstream's
  history, in one commit. Every change since is in this repository's history under
  `packages/annotator/extension/` (`git log --follow -- packages/annotator/extension`).

## License

The Hypothesis browser extension is licensed under the **BSD 2-Clause license**
([LICENSE](./LICENSE)), © 2013-2020 Hypothes.is Project and contributors, and so is this modified
version. Every change made to it here is © 2026 Spencer Elkington, under the same license.

Nothing of the Annotator plugin (`../plugin`), which is under the GNU AGPL, is in the extension or
its build: the extension talks to the plugin over HTTP, as to any Hypothesis service. Code moved
from the plugin into the extension would bring the AGPL with it; code written for both belongs in
a library of its own, under a license both can take.

That license covers this directory only. The rest of this repository is not part of the program and
is not licensed by it.

## Names and logos

The license grants no right to Hypothesis's name or logos. The extension's own name is changed
(`src/manifest.json.mustache`), but upstream's icons (`src/images/`) and the help and settings
pages' wording (`src/help/`, `src/options/`) are still Hypothesis's. They are fine in a build kept on
this machine, and must be replaced before a build is given to anyone else.

## Third-party components

The extension, as built (`build/`, and `dist/`'s zip of it), carries other people's work under
their own licenses.

| Component | In the build | License | Notice |
| --- | --- | --- | --- |
| [Hypothesis client](https://github.com/hypothesis/client), the `hypothesis` npm package, with the workspace's one patch to it ([../plugin/patches/README.md](../plugin/patches/README.md)), which does nothing here unless a page asks for it | `client/build/` | BSD 2-Clause, © Hypothes.is Project and contributors | `client/LICENSE` |
| [PDF.js](https://github.com/mozilla/pdf.js) 2.14.137, vendored by upstream (`src/vendor/pdfjs/`, `tools/update-pdfjs`) | `pdfjs/` | Apache 2.0, © Mozilla Foundation | `pdfjs/LICENSE` |
| The packages the bundles hold besides: Preact, Redux, DOMPurify, KaTeX and its fonts, showdown, Sentry and the rest of the 27 | `client/build/scripts/`, `extension.bundle.js` | MIT for most; DOMPurify MPL 2.0 or Apache 2.0; highlight.js BSD 3-Clause; Hypothesis's own BSD 2-Clause; wouter-preact the Unlicense | `licenses/`, one folder each, listed in [licenses/README.md](./licenses/README.md) |

The last row is written by `tools/third-party.js update`, from the bundles' source maps, and run by
hand when the client or a dependency changes. The build runs `tools/third-party.js check`, which
fails when a bundle holds a package `licenses/` has no notice for.
