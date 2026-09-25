# @chaoticgoodcomputing/widgets

Preact widgets for [Quartz 5](https://github.com/jackyzha0/quartz) pages written in MDX, rendered
at build time and hydrated in the browser by
[`cgc-mdx`](https://github.com/chaoticgoodcomputing/blog/tree/main/quartz-v5/plugins/cgc-mdx).
Each widget is its own subpath export, and the package has no root export. Import a widget in an
`.mdx` page like any other package:

```mdx
import { PDFViewer } from "@chaoticgoodcomputing/widgets/pdf-viewer"

<PDFViewer src="/assets/resume.pdf" title="Resume" height="800px" />
```

The package ships as TypeScript source, which the page's bundler compiles. Preact is a peer
dependency: `cgc-mdx` gives every widget the host Quartz's copy.

## `/pdf-viewer`

A PDF drawn page by page with [PDF.js](https://mozilla.github.io/pdf.js/), which is bundled rather
than fetched from a CDN. The text is selectable, and links in the PDF open in a new tab. Before
hydration, and when the PDF can't be loaded, readers get a download button and a link to the PDF.

| Prop     | Default          | What it is                                |
| -------- | ---------------- | ----------------------------------------- |
| `src`    | required         | The PDF's URL, as the page would link it. |
| `title`  | `"PDF Document"` | Shown in the toolbar.                     |
| `width`  | `"100%"`         | A CSS width.                              |
| `height` | `"600px"`        | A CSS height. The pages scroll inside it. |

Its skin is Quartz's colour properties (`--light`, `--lightgray`, `--gray`, `--darkgray`,
`--secondary`, `--tertiary`, `--textHighlight`), so it follows the site's theme and colour scheme.
A site with a Content Security Policy must allow `blob:` in `worker-src`, since PDF.js's worker
starts from a `blob:` URL. The reasons are in
[ADR-0001](https://github.com/chaoticgoodcomputing/blog/blob/main/quartz-v5/libs/widgets/docs/adr/0001-pdf-js-rides-in-the-widget-chunk.md).

## CSS

Every widget's CSS is one BEM block, `cgc-<widget>`, and never selects anything outside it. The
package's `lint` script checks this (`npm run lint`).
