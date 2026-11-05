# Obsidian MDX

Opens `.mdx` files in Obsidian's Markdown view, so they're edited, linked and searched as notes, and
shows their imports and components as `jsx` code blocks, in Live Preview and in Reading view. A
fork of [mdx as md](https://github.com/mkozhukharenko/mdx-as-md-obsidian) (see
[NOTICE.md](./NOTICE.md)).

```sh
pnpm nx build obsidian-mdx     # dist/
pnpm nx test obsidian-mdx      # the build, loaded as Obsidian loads it
pnpm nx install obsidian-mdx   # into content/.obsidian/plugins/obsidian-mdx; --vault=<path> for another
```

Then turn it on in Obsidian, under Settings → Community plugins. Turn off upstream's
`mdx as md` first, if it's installed: Obsidian lets only one plugin claim `.mdx`.
