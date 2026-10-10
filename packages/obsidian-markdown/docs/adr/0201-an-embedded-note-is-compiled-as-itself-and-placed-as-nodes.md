---
status: accepted
date: 2026-10-02
---

# An embedded note is compiled as itself, and placed in the embedding note as nodes

`![[note]]`, `![[note#Heading]]` and `![[note#^block]]` show the note, or one section or block of it,
in place. The resolver does it: in a `before` hook, for each such embed it compiles the embedded
note's source on its own, with the syntax plugins, the host's plugins that go before the resolver
(`beforeResolve`), and the resolver, as the file it is (its own `fileURL`), takes what the embed shows out of the finished tree, and puts a copy of those nodes into
the embedding note's tree in a `noteEmbed` node.

## Why this way

- **Links resolve as they would in the embedded note.** A wikilink is resolved from the note it is
  written in, so `[[Pot]]` in a kitchen note goes to the kitchen's Pot wherever the note is shown.
  Compiling the note as itself gives that for nothing; resolving its links from the embedding note
  would send them somewhere else.
- **Nodes, not HTML.** Sätteri would also take a string of rendered HTML in place of a node. But
  everything a host runs after the resolver (its own Markdown plugins, Astro's code highlighting,
  its collection of local images, its heading ids) works on the tree, and would never see what is
  inside a string. Placed as nodes, embedded content goes through all of it as the note's own does.
- **The same vault and the same reading.** The embedded note is read with the options the vault
  read it with (`vault.parseOptions`), so the heading or block its cache names is the one the
  compile finds.

## What follows

- An embed is a block. A paragraph is cut at each embed it holds, and what was written around it
  stays a paragraph before and after. An embed inside a heading, a table cell or a link's text stays
  a link to the note.
- A note that embeds itself, directly or through others, is shown five notes deep
  (`MAX_EMBED_DEPTH`), and the embed inside the last is a link.
- A plugin the host runs between the syntax and the resolver, such as `obsidianExcalidraw`, is
  passed to the resolver as `beforeResolve` too, so an embed of a drawing inside an embedded note
  is shown as on that note's own page. It runs inside the resolver's synchronous compile, so it
  must be synchronous.
- A wikilink or a Markdown link in embedded content is marked as settled when it is placed: it was
  resolved in the note it comes from, and the embedding note's resolver leaves it as it is.
- A link in embedded content to its own note (`[[#Later]]`) goes to that note's page, and an
  image's path is written from the page the image ends up on, so the host finds it.
- Embedded content takes none of the page's own anchors. A block id is dropped from it: the anchor
  is the embedded note's page's. An embedded heading is given its id here, numbered after every
  heading of the page's own, because Astro slugs a heading only when it has no id
  ([satteri-processor.ts:133-139](https://github.com/withastro/astro/blob/790c6f720efd9de362e7a2b6319ac2d721062bda/packages/markdown/satteri/src/satteri-processor.ts#L133-L139)),
  and a link to one of the page's own headings is given the number the page's headings alone make.
  Embedded headings are still headings, and are among the headings Astro lists for the page.
- An MDX note is a program, with imports and components of its own, and is embedded as a link.
- An embed whose note does not have the heading or block it names shows nothing, and is marked
  `is-unresolved`, as an embed of no note is.
- An embed brings the definitions of the footnotes it refers to, wherever in its note they are
  defined, and none it doesn't. Each embed on a page names its footnotes with a prefix of its own
  (`embed1-`, `embed2-`), so a footnote `[^a]` of the embedded note never takes the place of the
  page's own `[^a]`, nor of another embed's.
- Each embed is a compile of its own. A note that embeds itself twice is compiled 2⁵ times; nothing
  on the site comes near that.
- What is embedded is part of the vault's `linksDigest`: an embedded note's source is in it, so a
  host that keeps rendered notes while the digest holds renders the embedding note again when the
  embedded one changes.
