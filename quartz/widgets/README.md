---
title: "Widget System Reference"
description: |
  Lite reference documentation of the Quartz MDX widget system
tags:
  - engineering/languages/typescript
  - engineering/frontend
---
> [!NOTE]
> Reference of additions from [[content/notes/mdx-widgets-test.mdx|widget intro note]], summary of [[content/notes/scratch/quartz-mdx-notes|private feature integration doc]]
## Creating a New Widget

1. Create directory: `{dir}/widgets/{widget-name}/`
2. Create `component.tsx` - exports a Preact component that renders static HTML with data attributes
3. Create `script.inline.ts` - client-side script that hydrates the widget using `createWidgetScript` helper
4. Create `style.inline.scss` - styles for the widget
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
