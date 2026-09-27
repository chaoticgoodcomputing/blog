---
status: accepted
date: 2026-09-25
---

# Notes join their page: rendered through the pipeline, added after crawl-links and description

Each annotation's note is markdown kept in Annotator's JSON, not in the page's body. `cgc-annotator`
takes the annotation blocks out of the page and renders every note on its own, through the site's
configured pipeline minus a **denylist**, rebuilt by `@chaoticgoodcomputing/pipeline` (#37). What a
note links to is added to the page's `links`, and what it says to the page's `text`, so notes feed
backlinks, the graph and search as v4's did. The plugin does that from an html plugin that runs
after the stock `crawl-links` and `description` transformers, which is why its `defaultOrder` is 75.
Decided while building the page type and Viewer
([#68](https://github.com/chaoticgoodcomputing/blog/issues/68)).

> Links to Quartz point at upstream at
> [`97a2d05`](https://github.com/jackyzha0/quartz/tree/97a2d05f80c4c50534959b1d0d41cc4b3895625e),
> the ref `quartz/upstream.json` pins. v4 links point at this repo at `9e48f89`. The stock
> transformers are the `@quartz-community` packages at 1.0.0 that the vendored copy installs.

## Why

**v4 forked two stock transformers to do this.** Its annotations transformer stashed each page's
annotation links and text
([annotations.ts:269-272](https://github.com/chaoticgoodcomputing/blog/blob/9e48f89b256f511a94f07d473d46395d91730c53/quartz/plugins/transformers/annotations.ts#L269-L272)),
and its copies of `CrawlLinks` and `Description` merged them in
([links.ts:165-166](https://github.com/chaoticgoodcomputing/blog/blob/9e48f89b256f511a94f07d473d46395d91730c53/quartz/plugins/transformers/links.ts#L165-L166),
[description.ts:47-48](https://github.com/chaoticgoodcomputing/blog/blob/9e48f89b256f511a94f07d473d46395d91730c53/quartz/plugins/transformers/description.ts#L47-L48)).
v5's are stock packages, and both set the page's `links` and `text` outright rather than adding to
them. So whatever adds to those fields has to run after both.

**One order can do it, because Quartz runs every markdown plugin before any html plugin.** A
transformer's `order` places its hooks among the others', but the phases don't interleave: all
text transforms, then all markdown plugins
([parse.ts:21-34](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/processors/parse.ts#L21-L34)),
then all html plugins
([parse.ts:36-45](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/processors/parse.ts#L36-L45)).
At 75, the plugin's markdown plugin still takes Annotator's blocks out before `crawl-links` (60)
and `description` (70) read the page, and its html plugin adds the notes' links and text after they
have written theirs. The markdown plugin finds the blocks in the page's source, by their position,
so it needs no text transform: v4's textTransform only existed to smuggle the JSON past MDX in a
base64 code block.

**A note is rendered as a passage of its page.** It runs with the page's path and slug, so its
wikilinks resolve from the page, and `crawl-links`, which runs on the note too, records them in the
note's own `links`. The html plugin renders the notes and adds their links and text to the page's in
one pass.

**The denylist names what acts on a whole page.** #37 replaced v4's allowlist
([annotations.ts:82-89](https://github.com/chaoticgoodcomputing/blog/blob/9e48f89b256f511a94f07d473d46395d91730c53/quartz/plugins/transformers/annotations.ts#L82-L89))
with the site's own pipeline, so a note renders as the site's pages do. What's left out by default
reads or writes a page's frontmatter, dates, table of contents, description, listing, encryption or
embedded bases. A note has none of those, and `BasesTransformer`, for one, would leave its data on
the note, which no page renders. The plugin's own transformer is always left out.

## Considered options

- **Adding the notes' links through `frontmatterLinks`.** `crawl-links` resolves that field into
  `links`, and `note-properties` fills it, so a transformer ordered before `crawl-links` could add
  the notes' link targets there. Rejected: it names the notes' links as frontmatter's, and it covers
  links only, not text.
- **Splicing the rendered notes into the page's tree**, for the later transformers to find there.
  Rejected: the transformers after the plugin would run over the notes a second time, and
  `crawl-links` would resolve links it had already resolved.
- **Leaving Annotator's markup in the page.** Annotator writes each note twice, and its markdown copy
  would feed `links` and `text` with no work at all. Rejected: `text` would also carry Annotator's
  scaffolding (the `show annotation` links, prefixes and suffixes cut mid-word), and so would
  anything that renders the page's tree, like a feed.

## Consequences

- **The plugin's `order` must stay above `crawl-links`' and `description`'s.** Its default does.
  A site that moves either of them past 75 needs to move this plugin too; the README says so.
- **v4 rendered notes without maths, and v5 renders them with it**, as its pages are. A note that
  mentions prices in dollars reads them as maths, as a page does. The owner's v4 allowlist left
  `Latex` out for that reason. In v5 that isn't enough: `obsidian-flavored-markdown` parses `$…$`
  itself, so denying `Latex` only leaves the maths untypeset. Escaping those dollars (`\$`) is the
  fix, in a note as in a page.
- **Headings in Annotator's markup can reach the page's table of contents.** `table-of-contents`
  reads headings in its markdown plugin, at 50, before this plugin takes Annotator's blocks out. The
  `full-width` frame has no sidebar to show one in.
