---
status: accepted
date: 2026-09-25
---

# A page's tag data carries every tag it is under, with its properties

#20 settled what the engine publishes on each page's `fileData`: the page's own tags with their
properties, its primary tag, and "the expanded ancestor set", every tag the page is under, so that
"is this page under `engineering`" needs no recomputation. Building the first consumer showed the
set needs each tag's properties too, not only its name. Decided on
[`tags-core`, `cgc-tags` and `cgc-tag-list`](https://github.com/chaoticgoodcomputing/blog/issues/69).

> Source links point at upstream Quartz at
> [`97a2d05`](https://github.com/jackyzha0/quartz/tree/97a2d05f80c4c50534959b1d0d41cc4b3895625e)
> (v5.0.0), the ref `quartz/upstream.json` pins.

**A consumer renders tags its page doesn't carry.** v4's tag pages listed the tag's parent and
subtags, and a tag explorer lists the whole tree. A tag that only ever appears as an ancestor, such
as `engineering/languages` when every page is tagged with a language, is on no page's list of its
own tags. Its colour property follows from its name, but its icon doesn't: it is its own icon or its
nearest ancestor's, which only the dictionary knows.

**Neither of the engine's other artifacts is there when a page renders.** Pages render in the page
type dispatcher's phase, before the other emitters run
([emit.ts:65-90](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/processors/emit.ts#L65-L90)),
so `static/cgcTags.json` doesn't exist yet. And a consumer may not resolve the dictionary itself,
since it holds no copy (ADR-0002 rule 1).

## Decision

`ancestors` maps every tag the page is under, its own tags included, to that tag's properties,
sorted by tag. Membership is `tag in ancestors`. Over every page a component is handed
(`allFiles`), the union is every tag in the corpus with its properties, which is what cgc-tag-list
reads for a tag page's subtags and their counts.

## Consequences

- **Each page repeats the properties of its tags' ancestors.** That's a few small records per page,
  and it crosses the worker boundary as plain data (ADR-0002 rule 6).
- **Server-side consumers need no second channel.** A component builds what it needs from
  `allFiles`, and the tag index stays the browser's.

## Considered alternatives

- **A list of names, as #20 wrote it.** Consumers would work out a colour property from the name,
  but not an icon, so #71's icons would be missing from any tag no page carries.
- **The engine emits the tag index before pages render.** Emitter order isn't a contract, and the
  dispatcher runs first by design.
