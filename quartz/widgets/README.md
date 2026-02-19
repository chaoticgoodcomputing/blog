---
title: Widget System Reference
description: |
  Lite reference documentation of the Quartz MDX widget system
tags:
  - projects/site
  - engineering/languages/typescript
  - engineering/frontend
---
> [!NOTE]
> Reference of additions from [[/content/notes/mdx-widgets-test.mdx|widget intro note]], summary of [[/content/notes/scratch/quartz-mdx-notes|private feature integration doc]]

## Creating a New Widget

Base template: `quartz/widgets/base/widget-base.scss`

1. Create directory: `{dir}/widgets/{widget-name}/`
2. Create `component.tsx` - exports a Preact component that renders static HTML with data attributes
3. Create `script.inline.ts` - client-side script that hydrates the widget using `createWidgetScript` helper
4. Create `style.inline.scss` - styles for the widget
   1. Scope widget styles under `.widget-{name}` to avoid unintentional leaks into other portions of the page
   2. Use `contain: layout style;` to the root class to prevent style leaks
   3. Variables can be imported from higher-level SCSS to theme widgets alongside the site
5. Create `index.ts` - exports `WidgetDefinition` with Component, script, css, selector, and scriptName
6. Register in `{dir}/widgets/registry.ts` - add import and entry to `quartzWidgets` object

## Usage in MDX

```mdx
import { WidgetName } from '@widgets/{widget-name}'
import { ContentWidget } from '@content/widgets/{widget-name}'

<WidgetName prop1="value" prop2={123} />
<ContentWidget config={[1, 2, 3]} />
```

### PDF Viewer Example

```mdx
import { PDFViewer } from '@widgets/pdf-viewer'

<PDFViewer 
  src="/assets/document.pdf" 
  title="My Document"
  height="800px"
/>
```

## Widget Styling Guidelines

When creating or modifying widget styles, follow these conventions to ensure consistency and proper theming:

### CSS Structure


### Required CSS Properties

```scss
.widget-{name} {
  // Isolation - REQUIRED to prevent widget styles from affecting page layout
  contain: layout style;
  
  // Positioning
  position: relative;
  
  // Spacing - use these standard values
  margin: 1rem 0;
  padding: 1rem;
  
  // Theme-aware colors - use var() references
  background-color: var(--light);
  color: var(--darkgray);
  border: 1px solid var(--lightgray);
  border-radius: 8px;
}
```
