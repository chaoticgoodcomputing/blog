---
title: Quartz MDX
tags:
  - projects/site/plugins
  - engineering/languages/typescript
  - engineering/frontend
aliases:
  - widgets/README
---

Publishes `.mdx` pages: Markdown that imports interactive Preact **widgets**. Each widget is rendered to HTML at build time, then hydrates in the browser, and a page loads only the widget code it uses. An `.mdx` page otherwise goes through the same transformers as any `.md` page.

## Installation

```bash
npm install @chaoticgoodcomputing/quartz-mdx
```

Requires a Quartz 5 whose page-type `generate` is awaitable ([#25](https://github.com/chaoticgoodcomputing/blog/issues/25)). On stock Quartz 5 the build fails with `virtualPages is not iterable`.

## Usage

```yaml
plugins:
  - source: "@chaoticgoodcomputing/quartz-mdx"
    enabled: true
```

Keep its `order` below `crawl-links`' (the default, 45, is). `notes/dice.mdx` is published at `/notes/dice.mdx`, and `/notes/dice` redirects there if the site runs `alias-redirects`.

### A first widget

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

The page arrives reading "Initializing widgets…", written at build time, and switches to "Widgets initialized" once the widget hydrates.

### Rules of thumb

- **Imports** resolve from the page's folder or from `node_modules`. Only default and named imports are allowed.
- **Props are data:** strings, numbers, booleans, `null`, and arrays and objects of those. No functions or expressions.
- **Widgets render twice**, at build time (no `window`) and in the browser. Put browser-only work in `useEffect`, and clean up in its return.
- **`client:visible`** delays hydration until the widget scrolls into view. `client:load` is the default.
- **CSS** is imported as plain `.css` and lands in the `cgc.mdx.widgets` layer. Namespace classes after the widget and use the theme's custom properties.
- **Broken widgets fail the build**, naming the page.

Reusable widgets live in [`@chaoticgoodcomputing/widgets`](https://github.com/chaoticgoodcomputing/blog/tree/main/quartz/libs/widgets).

## Configuration

| Option            | Type      | Default | Description                                                                                      |
| ----------------- | --------- | ------- | ------------------------------------------------------------------------------------------------ |
| `cleanUrlAliases` | `boolean` | `true`  | Add each page's extensionless URL to its aliases, so `alias-redirects` redirects it to the page. |

## Documentation

See [CONTEXT.md](https://github.com/chaoticgoodcomputing/blog/blob/main/quartz/plugins/quartz-mdx/CONTEXT.md) and the [decision records](https://github.com/chaoticgoodcomputing/blog/tree/main/quartz/plugins/quartz-mdx/docs/adr).

## License

MIT
