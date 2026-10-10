---
status: accepted
date: 2026-10-02
---

# Obsidian Markdown is a layer of Sätteri plugins, not a parser of its own

The library reads Obsidian's syntax as mdast plugins for [Sätteri](https://github.com/bruits/satteri),
the Rust Markdown processor Astro 7 runs by default, and leaves tokenising to Sätteri's parser. We
chose it over a parser of our own on micromark, run through Astro's opt-in unified processor, because
the site is meant to follow Astro's own way of doing things, and Astro's way is now Sätteri: the
remark and rehype pipeline is no longer installed by default
([Upgrade to Astro v7](https://docs.astro.build/en/guides/upgrade-to/v7/)).

## What that costs

A Sätteri plugin can't add syntax to the parser. It visits nodes the parser has already made and
records mutations
([mdast-visitor.ts:286](https://github.com/bruits/satteri/blob/b3d38e1e341c809b20b76a655e9b1601d11bd1f0/packages/satteri/src/mdast/mdast-visitor.ts#L286),
[:448-451](https://github.com/bruits/satteri/blob/b3d38e1e341c809b20b76a655e9b1601d11bd1f0/packages/satteri/src/mdast/mdast-visitor.ts#L448-L451)).
So everything Obsidian adds to Markdown is recovered after parsing:

- **Wikilinks and embeds** are parsed by Sätteri itself
  ([compile.ts:573-574](https://github.com/bruits/satteri/blob/b3d38e1e341c809b20b76a655e9b1601d11bd1f0/packages/satteri/src/compile.ts#L573-L574)),
  but arrive as an ordinary `link` and `image`. The library reads each one again from its source
  text, by its position, to tell it from a Markdown link and to split its subpath and alias.
- **Comments, highlights, tags and block ids** arrive as text, and **callouts** as quotes. A comment's
  contents arrive parsed as Markdown, so `%%` is tracked across the whole document in reading order,
  and whole blocks are dropped while one is open.

A parser of our own would make each of these a real construct, and would get the edges right that a
text pass can't: a `%%` that Markdown has already split across nodes in an unexpected way, or a
highlight marker beside punctuation. On the whole public vault, 653 notes, the text pass left no
Obsidian syntax unrendered, which is why the cost was accepted.

## Considered options

- **A micromark parser, through Astro's unified processor.** Full control of the syntax, and the
  larger ecosystem of remark plugins. Rejected: it puts the site on the pipeline Astro has stepped
  away from, and the parser is the largest piece of code we would own.
- **An existing Obsidian integration** (`astro-loader-obsidian` and similar). Rejected: none covers
  comments, block ids, callouts and a metadata cache together, and the one closest to it is stale.

## Consequences

- The library depends on `satteri` alone and knows nothing of Astro. The site passes its plugins to
  Astro's Sätteri processor, which runs them before its own
  ([satteri-processor.ts:311-313](https://github.com/withastro/astro/blob/790c6f720efd9de362e7a2b6319ac2d721062bda/packages/markdown/satteri/src/satteri-processor.ts#L311-L313)).
- The metadata cache is read by running the same syntax plugins a page is rendered with, so the cache
  and the page can't disagree about what a link or a comment is.
- Only the syntax layer is tied to this choice. The cache, link resolution and the resolver work on
  what the syntax layer produces, so a change of parser later rewrites the syntax layer and nothing else.
- Sätteri is at 0.10, and its plugin API may still move. The library's tests run against Sätteri
  itself, so an upgrade that changes how mutations compose fails them.
