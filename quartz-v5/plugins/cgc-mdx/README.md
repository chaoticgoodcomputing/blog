---
title: cgc-mdx
tags:
  - projects/site
  - engineering/languages/typescript
  - engineering/frontend
aliases:
  - widgets/README
---

`cgc-mdx` lets a [Quartz 5](https://quartz.jzhao.xyz/) site publish `.mdx` pages: Markdown that imports interactive Preact **widgets** and places them in the text. Each widget is drawn into the page when the site builds, then comes alive in the browser, and a page loads only the widget code it uses.

It started as the MDX half of this site's Quartz 4 fork. It ships no widgets of its own. It runs on Quartz 5 with one change upstream hasn't taken yet: a page type's `generate` has to be awaitable ([#25](https://github.com/chaoticgoodcomputing/blog/issues/25)). On a stock Quartz 5 the build fails with `virtualPages is not iterable`, so until that change lands upstream the plugin can't be shared ([ADR-0001](https://github.com/chaoticgoodcomputing/blog/blob/main/docs/adr/0001-customization-through-plugins.md)).

## What it does

- **An `.mdx` page is a page like any other.** Its body goes through the same transformers your `.md` pages do, so wikilinks, callouts, tables, code highlighting, LaTeX, the table of contents, search, backlinks and popovers all work on it.
- **It lives at its own URL, and its clean URL redirects there.** `notes/dice.mdx` is published at `/notes/dice.mdx`, as Quartz's stock page types keep a file's extension (a canvas lives at `/notes/map.canvas`). `/notes/dice` redirects to it, if your site has the stock `alias-redirects` plugin. A link to the page reaches it however it's written: `[[dice]]`, `[[notes/dice.mdx]]` or `[dice](notes/dice.mdx)`. Backlinks and the graph count those links too.
- **Widgets are ordinary imports.** A widget comes from a file beside the page or from an npm package, the way any bundler resolves an `import`. There's no registry and no alias to configure.
- **Widgets are islands.** Each one renders to HTML at build time, so the page reads correctly before any script runs, and then hydrates in the browser. Widgets keep working across Quartz's page navigation.
- **Broken widgets fail the build.** An import that doesn't resolve, a widget that throws while rendering, or a prop that isn't plain data stops the build and names the page, so a broken article never deploys.

## Install

```shell
npx quartz plugin add git+https://github.com/chaoticgoodcomputing/blog.git#v<version> --subdir quartz-v5/plugins/cgc-mdx --name cgc-mdx
```

It needs a Quartz 5 whose page-type `generate` is awaitable ([#25](https://github.com/chaoticgoodcomputing/blog/issues/25)). Stock v5.0.0 isn't yet.

Releases are `v<semver>` tags on [the monorepo](https://github.com/chaoticgoodcomputing/blog). Every package there shares one version.

It is a page type, an emitter and a transformer in one package. The transformer has to run before `crawl-links`, which its default order (45, to `crawl-links`' 60) takes care of, so leave its `order` below that.

It has one option:

| Option | Default | |
| --- | --- | --- |
| `cleanUrlAliases` | `true` | Adds each `.mdx` page's clean URL, its path without the extension, to the page's aliases, so `alias-redirects` redirects it to the page. Leave it on if your pages were ever served without the extension. It's skipped for a page whose clean URL another page already lives at. |

## A first widget

The smallest widget there is says one thing when the site builds and another once the browser has hydrated it. It takes three files in the content folder: a page, the widget, and the widget's CSS.

```mdx title="hello.mdx"
---
title: Hello, widgets
---

import { Initialization } from "./widgets/initialization"

<Initialization />
```

```tsx title="widgets/initialization.tsx"
import { useEffect, useState } from "preact/hooks"
import "./initialization.css"

export function Initialization() {
  const [ready, setReady] = useState(false)
  // Effects run only in the browser, once the widget has hydrated.
  useEffect(() => setReady(true), [])
  return (
    <p class={ready ? "initialization initialization--ready" : "initialization"}>
      {ready ? "Widgets initialized" : "Initializing widgets…"}
    </p>
  )
}
```

```css title="widgets/initialization.css"
.initialization {
  padding: 1rem;
  border: 1px solid var(--lightgray);
  border-radius: 8px;
  color: var(--gray);
  font-family: var(--codeFont);
  text-align: center;
}

.initialization--ready {
  color: var(--secondary);
}
```

`/hello.mdx` arrives reading "Initializing widgets…", which the build wrote into the page, and switches to "Widgets initialized" as soon as its widget hydrates. Everything else in this README builds on that handoff.

## Writing a page

An `.mdx` page has the frontmatter and Markdown of any other note, plus `import` statements and widget elements:

```mdx
---
title: Rolling with advantage
tags: [games]
---

import { DiceChart } from './widgets/dice-chart'
import Plot from 'some-plot-package'

Rolling two dice and keeping the higher one skews the result upwards:

<DiceChart sides={20} rolls={[1, 2]} height={240} />

A [[wikilink]], a > [!note] callout and $x^2$ all work as they do in `.md` pages.
```

- **Imports** resolve from the page's own folder (`./widgets/dice-chart`) or from `node_modules` (`some-plot-package`). Default and named imports both work. Nothing else does: `export`, namespace imports and other JavaScript fail the build.
- **Widgets from a package** are imported by the package's name. This site's own reusable widgets, a PDF viewer and a Bluesky post, are the [`@chaoticgoodcomputing/widgets`](https://github.com/chaoticgoodcomputing/blog/tree/main/quartz-v5/libs/widgets) package: `import { PDFViewer } from "@chaoticgoodcomputing/widgets/pdf-viewer"`, then `<PDFViewer src="/assets/document.pdf" title="My Document" height="800px" />`.
- **Props are data**, written as JavaScript literals: strings, numbers, booleans, `null`, and arrays and objects of those. Unquoted keys, trailing commas and `//` comments are fine. Functions, variables and expressions are not, because props are written into the page for the browser to pick up.
- **Children are flattened to text.** `<Callout>Some **bold** text</Callout>` passes the widget `children: "Some bold text"`.
- **Lowercase elements are plain HTML.** `<details open>` renders as it would in Markdown, with its attributes evaluated as data.
- **`{…}` in the text is dropped,** `{/* comments */}` included. There's nothing to evaluate it against.

### When a widget hydrates

A widget hydrates as soon as the page loads. Add `client:visible` to wait until it scrolls into view, which suits a heavy widget far down a page:

```mdx
<DiceChart client:visible sides={20} rolls={[1, 2]} />
```

`client:load` is the default and can be written out. The directive is never passed to the widget.

## Writing a widget

A widget is a Preact component, exported by name or as the module's default:

```tsx
import { useEffect, useRef } from "preact/hooks"
import "./dice-chart.css"

export function DiceChart({ sides, rolls, height = 200 }: { sides: number; rolls: number[]; height?: number }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const timer = setInterval(() => draw(canvas.current!, sides, rolls), 1000)
    return () => clearInterval(timer)
  }, [])
  return <canvas ref={canvas} class="dice-chart" height={height} />
}
```

- **It renders twice:** once to HTML at build time, where there's no `window` or `document`, and again in the browser. Put browser-only work in `useEffect`.
- **Clean up in `useEffect`'s return.** When a reader navigates away, the widget is unmounted, and its effects' cleanups run. Widgets never listen to Quartz's navigation events themselves.
- **Preact is the site's.** Every `preact` import resolves to the copy your Quartz uses, wherever the widget sits, so hooks work and a page carries one Preact.
- **Keep module-level code free of per-page work.** A widget's module runs once, when a page first loads it, not once per page.

### Styling a widget

Import plain `.css` from the widget. It's bundled with the widget and loaded only on pages that use it. SCSS isn't compiled.

All widget CSS lands in the `cgc.mdx.widgets` cascade layer, whatever its source. That ranks it above Quartz's own styles and themes, and below any CSS of the site's own, so a site can always restyle a widget. To keep a widget well behaved on any site:

- **Namespace every class** after the widget (`.dice-chart`, `.dice-chart__legend`), and select only elements the widget renders.
- **Take colours and fonts from the theme's custom properties,** such as `var(--dark)`, `var(--secondary)` and `var(--bodyFont)`, never literal values. The widget then follows the site's theme and both colour schemes.
- **Redraw on `themechange`** if the widget reads colours in script, for a canvas say. A reader can switch the colour scheme while the widget is on screen.
- **Only the CSS a widget imports is layered.** CSS its script adds to the page at run time, such as the global `<style>` Plotly puts in the head, and inline `style` attributes stay outside the widget layer, so they outrank the site's own CSS. Keep such CSS to the widget's own elements, as Plotly's selectors do.

## Under `quartz build --serve`

Editing an `.mdx` page, or adding one, rebuilds it like any other note, and so does editing a widget kept in the content folder. As with `.md` pages, a page you delete stays in the output until the next full build.

Quartz copies a widget's source from the content folder into the output. When the output is inside the Quartz folder, as the default `public` is, serve takes those copies for Quartz's own source: a widget edit then restarts the whole build, often several times, and can leave later edits rebuilding more than once each. The page is right after every rebuild. Serving to an output outside the Quartz folder, such as `--output ../public`, avoids it.

## Coming from this site's Quartz 4 widgets

This site ran its widgets on its own fork of Quartz 4 before `cgc-mdx`, and old links to that system's guide land here.

- **One component instead of four files and a registry.** A widget was a build-time `component.tsx`, a `script.inline.ts` that found the component's element by a selector and read its settings from `data-config`, a `style.inline.scss` and an `index.ts`, all registered in a `registry.ts` and imported through `@widgets/…` or `@content/widgets/…`. Now it's one Preact component and a plain `.css` file, imported by its path or its package's name. The component's props arrive in the browser as they were at build time, and what the script did goes in `useEffect`.
- **Namespaced classes instead of `contain`.** A widget kept its styles to itself with a `.widget-<name>` root and `contain: layout style`. Now it names its classes after itself, as above, and its CSS sits in the widget layer, below the site's own.
- **The widgets themselves.** `pdf-viewer` and `bluesky-post` are `@chaoticgoodcomputing/widgets/pdf-viewer` and `@chaoticgoodcomputing/widgets/bluesky-post`, with the same props, except the PDF viewer's `dpi`, which is gone. The two status widgets, `initialization` and `global-initialization`, and the page-size meter, `page-assets`, are retired; `initialization` lives on as the first widget above.

## Notes

- Quartz copies every file in the content folder that isn't a page into the site, so a vault's widget sources are published too. Add their folders to `ignorePatterns` to keep them out. `cgc-mdx` reads widgets from disk, so they still build, but `serve` no longer watches them.
- Widget scripts and styles are written to `static/cgc-mdx/`, with shared code in chunks every page reuses.
- The rationale for each part of the design is in the plugin's [decision records](https://github.com/chaoticgoodcomputing/blog/tree/main/quartz-v5/plugins/cgc-mdx/docs/adr), and its terms (widget, island, directive, widget layer) are defined in [CONTEXT.md](https://github.com/chaoticgoodcomputing/blog/blob/main/quartz-v5/plugins/cgc-mdx/CONTEXT.md).
