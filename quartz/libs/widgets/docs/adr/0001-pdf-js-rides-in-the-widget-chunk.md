---
status: accepted
date: 2026-09-25
---

# PDF.js rides in the widget's own chunk, worker included

`pdf-viewer` bundles `pdfjs-dist`, which #36 decided. This records how: PDF.js is a chunk that the
widget imports from its effect, and its worker is carried inside that chunk as text and started
from a `blob:` URL. Its text-layer CSS is copied into the widget's block by hand, and nothing else
of PDF.js's is shipped. Decided while building
[`pdf-viewer`](https://github.com/chaoticgoodcomputing/blog/issues/66).

> PDF.js links point at [`mozilla/pdf.js` at `v5.4.530`](https://github.com/mozilla/pdf.js/tree/50cc4adac01b8f35cf7d311b9eced150502936fe),
> the version `pdfjs-dist` is pinned to. v4 links point at this repo at `9e48f89`.

## Why

**v4 fetched everything from jsDelivr.** It fetched the viewer CSS
([script.inline.ts:10](https://github.com/chaoticgoodcomputing/blog/blob/9e48f89b256f511a94f07d473d46395d91730c53/quartz/widgets/pdf-viewer/script.inline.ts#L10)),
scoped it with a regex ([:15](https://github.com/chaoticgoodcomputing/blog/blob/9e48f89b256f511a94f07d473d46395d91730c53/quartz/widgets/pdf-viewer/script.inline.ts#L15)),
and then loaded the library ([:45](https://github.com/chaoticgoodcomputing/blog/blob/9e48f89b256f511a94f07d473d46395d91730c53/quartz/widgets/pdf-viewer/script.inline.ts#L45))
and the worker ([:56](https://github.com/chaoticgoodcomputing/blog/blob/9e48f89b256f511a94f07d473d46395d91730c53/quartz/widgets/pdf-viewer/script.inline.ts#L56))
from the same CDN. Bundling removes all three. What remains is the worker: PDF.js starts it from a
script URL, and a library has no way to emit a file next to its chunk. The page's bundler emits the
files, and `cgc-mdx`'s esbuild has no asset handling for `new URL(…, import.meta.url)`.

**So the worker is text.** `document.ts` imports `pdfjs-dist/build/pdf.worker.min.mjs` with
`with { type: "text" }`, which esbuild honours with no configuration, the same way
`island-runtime` ships its runtime. Once per page load it wraps the text in a `Blob` and sets
`GlobalWorkerOptions.workerSrc` to the blob's URL. A `blob:` URL has the page's origin, so PDF.js
starts it as a module worker directly, with no cross-origin wrapper
([api.js:2186-2198](https://github.com/mozilla/pdf.js/blob/50cc4adac01b8f35cf7d311b9eced150502936fe/src/display/api.js#L2186-L2198)).
Each document gets its own worker, and unmounting the island destroys the loading task, which
terminates the worker. After an SPA navigation away from the page, nothing of PDF.js is left
running.

**PDF.js loads only when an island hydrates.** The component imports `./document` from its
effect, so PDF.js is a chunk of its own, fetched only by a page whose viewer hydrates. It never
runs in `cgc-mdx`'s build-time render.

**The text layer's CSS is PDF.js's, prefixed by hand.** Rule 9's vendor layer can't reach a
widget (#45), and the ledger's plan to put PDF.js's CSS there assumed it could. So
`pdf-viewer.css` carries only the rules that `TextLayer`'s markup needs, copied from
[text_layer_builder.css](https://github.com/mozilla/pdf.js/blob/50cc4adac01b8f35cf7d311b9eced150502936fe/web/text_layer_builder.css#L16-L142)
into the `cgc-pdf-viewer__text-layer` element, where the library-CSS check can see them.
`--min-font-size`, `--font-height`, `--scale-x` and `--rotate` are PDF.js's own custom properties,
which PDF.js writes on the elements. The widget only reads them, with fallbacks standing in for
the defaults PDF.js's CSS declares. That way the only custom properties its stylesheet declares
are `--cgc-pdf-viewer-…`.

**Three of PDF.js's properties are set by the widget's script, unprefixed.** `TextLayer` sizes its
container in terms of `--total-scale-factor`, `--scale-round-x` and `--scale-round-y`
([display_utils.js:648-667](https://github.com/mozilla/pdf.js/blob/50cc4adac01b8f35cf7d311b9eced150502936fe/src/display/display_utils.js#L648-L667)),
which PDF.js's own viewer CSS declares on each page. The widget ships none of that CSS, so
`document.ts` writes the three inline on each `cgc-pdf-viewer__page`. This is a named exception to
ADR-0003 rule 7 (prefix every custom property we define with `--cgc-`): PDF.js fixes the names, and
set inline on the widget's own element they reach only its own canvas, text layer and links, and
no inherited value can override them. The library-CSS check can't see them, since they are set
from script.

**PDF.js's measuring canvas is removed, not hidden.** `TextLayer` measures text on a canvas that it
appends to `<body>`, and only PDF.js's global `.hiddenCanvasElement` rule hides it
([text_layer.js:447-463](https://github.com/mozilla/pdf.js/blob/50cc4adac01b8f35cf7d311b9eced150502936fe/src/display/text_layer.js#L447-L463)).
The widget can't ship that rule. Instead, it calls `TextLayer.cleanup()` as soon as each page's
text is laid out
([text_layer.js:435-445](https://github.com/mozilla/pdf.js/blob/50cc4adac01b8f35cf7d311b9eced150502936fe/src/display/text_layer.js#L435-L445)).
`cleanup()` does nothing while another viewer's text layer is still drawing, and that viewer
removes the canvas when it finishes.

## Considered

- **PDF.js's "fake worker":** import the worker module on the main thread, and PDF.js uses its
  `WorkerMessageHandler` without a URL. It's simpler, but every PDF would then parse on the main
  thread, and a long document would block the reader's scrolling.
- **Teaching `cgc-mdx` to emit worker files:** give it a loader option or a worker convention.
  That puts a PDF.js-shaped feature into a plugin that ships no widgets, which is the opinionated
  coupling that `cgc-mdx`'s ADR-0003 rules out.
- **Keeping the CDN for the worker alone:** that's the dependency this widget exists to remove.

## Consequences

- **The PDF.js chunk is about 1.5 MB minified**, of which the worker text is about 1.07 MB. That's
  roughly what v4 fetched from the CDN, but it's now same-origin, cached under the site's own hash,
  and fetched only by pages that hydrate a viewer. The widget's entry chunk is about 2 KB.
- **A site with a Content Security Policy must allow `blob:` in `worker-src`.** This site sets
  none.
- **No wasm, cMaps or standard-font data are shipped.** PDF.js has no URL to fetch them from, so it
  requests nothing. JPEG 2000 images and ICC colour profiles don't decode, CJK text in non-embedded
  fonts may not render, and non-embedded standard fonts draw with system fonts. v4 set no URLs
  either. A PDF that needs these is a case for the annotator's Viewer, which emits its own files.
- **`pdfjs-dist` is pinned exactly** (`5.4.530`), because the prefixed text-layer rules must match
  the `TextLayer` that writes the markup. An upgrade means re-diffing `text_layer_builder.css`.
- **Pages are fitted to the column once, when they load, and don't redraw on resize,** as in v4.
- **Aligned with `cgc-annotator`'s Viewer, but no code is shared** (#36). Both bundle the same
  PDF.js version, and a shared PDF core is extracted once the Viewer shows the overlap.
