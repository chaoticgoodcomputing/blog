# Obsidian MDX

The Obsidian plugin that lets the vault's `.mdx` notes be opened, edited, linked and searched in
Obsidian as Markdown notes. The Astro site reads the same files as MDX; this plugin changes nothing
in them. Where the fork came from, and its license, are in [NOTICE.md](./NOTICE.md).

## Language

**Obsidian MDX**:
This plugin, as it is in this repository, id `obsidian-mdx`.
_Avoid_: mdx as md (that is upstream's name)

**Upstream**:
mkozhukharenko's [`mdx as md`](https://github.com/mkozhukharenko/mdx-as-md-obsidian), unmaintained since its one release, 0.0.1.

**MDX note**:
A note of the vault saved as `.mdx`, for the site's components. Obsidian shows it in its Markdown
view.
_Avoid_: MDX file, component note

**MDX block**:
A run of an MDX note's lines that is code, not Markdown: an `import` or `export` statement, or a
component (a capitalized JSX element, or a fragment), with its props and children. The plugin
shows each as a `jsx` code block; lowercase HTML is left to Obsidian (`src/mdx-blocks.ts`).
_Avoid_: widget (that is the site's component), embed, ESM block
