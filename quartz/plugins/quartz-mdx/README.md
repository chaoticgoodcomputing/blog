---
title: Quartz MDX
tags:
  - writing/highlights
  - projects/site/plugins
  - engineering/languages/typescript
  - engineering/frontend
aliases:
  - widgets/README
description: A Quartz v5 plugin for MDX content with Preact components on site pages
date: 2026-09-27
---
A Quartz content pipeline plugin that allows users to make use of MDX (`.mdx`) files in their vaults and inline Preact components in their content.

import { GameOfLife } from "../widgets/game-of-life/widget"

<GameOfLife 
  initialState={[
    [0,0,1,1,1,0,0,0,1,1,1,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0],
    [1,0,0,0,0,1,0,1,0,0,0,0,1],
    [1,0,0,0,0,1,0,1,0,0,0,0,1],
    [1,0,0,0,0,1,0,1,0,0,0,0,1],
    [0,0,1,1,1,0,0,0,1,1,1,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,1,1,1,0,0,0,1,1,1,0,0],
    [1,0,0,0,0,1,0,1,0,0,0,0,1],
    [1,0,0,0,0,1,0,1,0,0,0,0,1],
    [1,0,0,0,0,1,0,1,0,0,0,0,1],
    [0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,1,1,1,0,0,0,1,1,1,0,0]
  ]}
  verticalPadding={3}
  height={300}
  secondsPerFrame={0.3}
/>

## Installation

```bash
npm install @chaoticgoodcomputing/quartz-mdx
```

## Usage

```yaml
plugins:
  - source: "@chaoticgoodcomputing/quartz-mdx"
    enabled: true
```

Keep its `order` below `crawl-links`' (the default, 45, is).

### A first widget

Start simple:

```
content/
  hello.mdx
  widgets/
     initialization.tsx
     initialization.css
```

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
      {ready ? "Widgets initialized!" : "Initializing widgets…"}
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

The page arrives reading `Initializing widgets…`, written at build time, and switches to `Widgets initialized!` once the widget hydrates.

### Rules of thumb

- **Imports** resolve from the page's folder or from `node_modules`. Only default and named imports are allowed.
- **Props are data:** strings, numbers, booleans, `null`, and arrays and objects of those. No functions or expressions.
- **Widgets render twice**, at build time (no `window`) and in the browser. Put browser-only work in `useEffect`, and clean up in its return.
- **`client:visible`** delays hydration until the widget scrolls into view. `client:load` is the default.
- **CSS** is imported as plain `.css` and lands in the `cgc.mdx.widgets` layer. Namespace classes after the widget and use the theme's custom properties.
- **Broken widgets fail the build**, naming the page.

## Configuration

| Option            | Type      | Default | Description                                                                                      |
| ----------------- | --------- | ------- | ------------------------------------------------------------------------------------------------ |
| `cleanUrlAliases` | `boolean` | `true`  | Add each page's extensionless URL to its aliases, so `alias-redirects` redirects it to the page. |

## License

MIT
