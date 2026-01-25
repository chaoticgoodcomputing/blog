---
title: "Quick Fix: Tone Down Obsidian List/Header Padding"
description: |
  Annoyed by Obsidian Live Preview adding over-padding and aggressively indenting? Snippets can help keep your notes from jumping around, so you can focus on actually writing them.
date: 2026-01-24
tags:
  - engineering/frontend
---
This'll be a quicker note, and likely kicked to a Gist.

Obsidian has some weird tendencies to add padding and margins to certain elements in its Live Preview mode. A couple gripes that I've had are:

1. When creating new headers, they receive a padding between the last row of text and the heading layer. This can make it seem like the markdown file has a newline between a line of content and the next header, when it doesn't.
2. When working with indentations — primarily in lists — aggressive indentation is done that causes the visual difference between the actual `- ` or `1. ` written in markdown, and a right-shifted preview.

Thankfully, we can do a bit of tweaking under-the-hood using [Obsidian CSS Snippets](https://help.obsidian.md/snippets).

### Remove Padding Above Header Rows

This snippet will remove the padding that occurs above header rows. The original source can be found [in my own vault's `snippets` directory](https://github.com/chaoticgoodcomputing/chaoticgoodcomputing.github.io/blob/main/content/.obsidian/snippets/remove-header-padding.css):

```css
/* Remove awkward header padding in live preview mode */

/* ========================================
   REMOVE HEADER PADDING/MARGIN
   ========================================
   
   Removes extra padding above headers to make it easier to judge
   line spacing in plaintext view.
*/

/* Remove block-start margin from all header levels in live preview */
.HyperMD-header,
.HyperMD-header-1,
.HyperMD-header-2,
.HyperMD-header-3,
.HyperMD-header-4,
.HyperMD-header-5,
.HyperMD-header-6 {
  margin-block-start: 0 !important;
  padding-top: 0 !important;
}

/* Also target the cm-header spans */
.cm-header,
.cm-header-1,
.cm-header-2,
.cm-header-3,
.cm-header-4,
.cm-header-5,
.cm-header-6 {
  margin-block-start: 0 !important;
  padding-top: 0 !important;
}

/* Override header margin toggle if it's enabled */
.cm-header-1,
.cm-header-2,
.cm-header-3,
.cm-header-4,
.cm-header-5,
.cm-header-6 {
  margin-block-start: 0 !important;
  margin-block-end: 0 !important;
}

/* Keep minimal bottom margin for visual separation */
.HyperMD-header {
  margin-block-end: 0.5em;
}
```

### Remove Aggressive Over-Indentation

This snippet will scale back the aggressive indentation during list editing, and is also [available in this vault's source code](https://github.com/chaoticgoodcomputing/chaoticgoodcomputing.github.io/blob/main/content/.obsidian/snippets/remove-list-indentation.css).

```css
/* Remove awkward list indentation in live preview mode */

/* ========================================
   REMOVE LIST INDENTATION
   ========================================
   
   Removes the text-indent and padding-inline-start that causes
   awkward indentation when typing markdown lists.
   
   Uses !important to override inline styles and CSS variables.
*/

/* Override inline styles on list lines (numbered and unnumbered lists) */
.cm-line.HyperMD-list-line {
  text-indent: 0 !important;
  padding-inline-start: 0 !important;
}

/* Also target task lines */
.cm-line.HyperMD-task-line {
  text-indent: 0 !important;
  padding-inline-start: 0 !important;
}

/* Remove padding from the formatting wrapper spans */
.cm-formatting.cm-formatting-list {
  padding-inline-start: 0 !important;
  text-indent: 0 !important;
}

/* Reset list number and bullet element spacing */
.list-number,
.list-bullet {
  padding-inline-start: 0 !important;
  text-indent: 0 !important;
  margin-right: 0.5em;
  vertical-align: baseline;
  white-space: normal;
}

/* Align task checkboxes with text baseline */
.task-list-label {
  vertical-align: baseline;
  margin-right: 0.25em;
}

.task-list-item-checkbox {
  vertical-align: baseline;
  margin: 0;
}

/* Ensure tags display inline properly within lists */
.cm-hashtag,
.cm-formatting-hashtag {
  vertical-align: baseline;
}

/* ========================================
   REDUCE NESTED LIST INDENTATION
   ========================================
   
   Makes nested list indentation roughly equal to two spaces
   instead of the default tab width.
*/

.cm-indent,
.cm-indent-spacing {
  min-width: 2ch !important;
  width: 2ch !important;
  display: inline-block;
}
```
