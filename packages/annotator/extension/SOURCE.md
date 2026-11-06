# Building the Annotator extension from source

For a reviewer of a signed build: how the extension's files come from this source.

The extension is a fork of the Hypothesis browser extension (NOTICE.md). Its own code is in
`src/`, bundled by Rollup into `extension.bundle.js`. The sidebar and the scripts it injects into a
page are the Hypothesis client, unmodified but for one line, from npm: `hypothesis` 1.1769.0
(`client/build/`), with the patch in `packages/annotator/plugin/patches/` applied by pnpm on
installing it. PDF.js 2.14.137 is upstream's own vendored build (`src/vendor/pdfjs/`).

## Building

With Node 22 and pnpm 11, from the repository's root (the archive keeps its layout):

```sh
pnpm install --filter @chaoticgoodcomputing/annotator-extension...
cd packages/annotator/extension
make clean-build && make build SETTINGS_FILE=settings/firefox-local.json
```

`build/` is then the extension, as signed.
