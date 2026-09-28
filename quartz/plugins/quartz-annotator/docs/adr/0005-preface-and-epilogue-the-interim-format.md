---
status: accepted
date: 2026-09-28
---

# Preface and epilogue: the interim format

An author can write prose around their annotations, and it reaches the page. Until now, anything an
annotation page said outside its annotation blocks was taken into its `links` and `text` but never
shown: the body rendered only the annotations. The page's own markdown is now cut into a **preface**,
shown before the document, and an **epilogue**, shown after it, by H1 markers:

```markdown
---
title: "Working with Valves"
annotation-target: https://media.steampowered.com/apps/valve/Valve_Handbook_LowRes.pdf
---
# Preface

Why I read this, and what to look for.

# Epilogue

What I took from it.

# Annotations

>%%
>```annotation-json
...
^yx67hjphtyd
```

This is the **interim format**: the one a fork of Obsidian Annotator is to keep. The fork may insert
new blocks under `# Annotations` instead of appending them, at which point the file order stops
mattering.

> Links to Obsidian Annotator point at
> [`3647dd9`](https://github.com/elias-sundqvist/obsidian-annotator/tree/3647dd92d0d803bae9a3f34a1aac19eacb2fd52d).

## The rules

- **Markers match exactly**: an H1 whose text is `Preface`, `Epilogue` or `Annotations`, ignoring
  case. Any other heading, an H1 included, is content of the section it's in. Markers aren't rendered.
  Notes take their real title from `title` frontmatter, so an H1 in the body is free to mean this.
- **Text before any marker is the preface**, so a note with no headings still works.
- **The file order is Preface, Epilogue, Annotations.** The page still shows the epilogue after the
  document.
- **Prose under `Annotations`** that isn't an annotation block gets a build warning naming the page,
  and is left out.
- **A repeated marker** gets a build warning naming the page, and its text joins the first section of
  that name.
- Annotation blocks are still taken out wherever they are.

## Why

**Annotations must come last**, because upstream Annotator appends every new annotation at the end
of the file (`${annotationFileString}\n${annotationString}`,
[`src/annotationUtils.tsx:166-168`](https://github.com/elias-sundqvist/obsidian-annotator/blob/3647dd92d0d803bae9a3f34a1aac19eacb2fd52d/src/annotationUtils.tsx#L166-L168)).
With `# Annotations` last, a new one lands in it.

**Headings don't disturb Annotator.** It finds blocks by a regex that wants a blank line, `>`-quoted
lines and a closing `^id`, and passes over anything else
([`src/annotationUtils.tsx:5-11`](https://github.com/elias-sundqvist/obsidian-annotator/blob/3647dd92d0d803bae9a3f34a1aac19eacb2fd52d/src/annotationUtils.tsx#L5-L11)).
Edits and deletions replace a block in place
([`:161-165`](https://github.com/elias-sundqvist/obsidian-annotator/blob/3647dd92d0d803bae9a3f34a1aac19eacb2fd52d/src/annotationUtils.tsx#L161-L165),
[`:220-223`](https://github.com/elias-sundqvist/obsidian-annotator/blob/3647dd92d0d803bae9a3f34a1aac19eacb2fd52d/src/annotationUtils.tsx#L220-L223)).

**H1s, not frontmatter or a callout.** Prose in frontmatter is unreadable in Obsidian, and a callout
can't hold headings of its own. An H1 is what an author would write anyway.

**The preface and epilogue stay in the page's own tree.** They are the page's body, not fragments like
a note, so the site's whole pipeline renders them, as it renders any note's body, and the stock
`crawl-links` and `description` count what they link to and say in the page's `links` and `text`.
Rendering them again through the notes' pipeline ([ADR-0002](./0002-notes-join-their-page.md)) would
count them twice, since those transformers read the page's tree whatever the body shows. The
markdown pass takes the markers and the stray prose out, puts the preface first and the epilogue
after it, and leaves an empty element between them (`data-cgc-annotator-epilogue`), where the body
cuts the rendered tree in two (`src/sections.ts`).

## Consequences

- No page needs migrating: none of this site's annotation pages has text outside its blocks.
- A page whose markers are out of order still renders its sections in order: the preface first, the
  epilogue after the document.
- The prose under `# Annotations` is dropped before the page's `links` and `text` are taken, so a
  warning is the only trace of it.
