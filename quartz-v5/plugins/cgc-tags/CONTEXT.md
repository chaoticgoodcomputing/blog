# cgc-tags

The Quartz 5 engine that owns the site's tag dictionary and publishes it for other plugins to read
(ADR-0002's worked example, #20, #31). It draws nothing. Inherits the family vocabulary in
[`quartz-v5/CONTEXT.md`](../../CONTEXT.md), and the tag vocabulary of the library it resolves
with, [`@chaoticgoodcomputing/tags-core`](../../libs/tags-core/CONTEXT.md): **Tag definition**,
**Tag properties**, **Colour property**, **Primary tag**, **Expanded ancestor set**.

## Language

**Tag dictionary**:
The engine's one table of **tag definitions**, keyed by tag: its `tags` option. The only place a
tag's colour or icon is written. Keys are normalised as Quartz normalises frontmatter tags, freed
of stray slashes too (tags-core's `normaliseTag()`, as each page's tags are), and a field a tag
doesn't have fails the build.
_Avoid_: tag table (in prose; the site config's comment says it), tag config, tag list

**Corpus**:
Every tag some page carries, and every ancestor of one, over every page the site emits, pages that
page types generate included. What the **tag index** and the **tag stylesheet** cover.
_Avoid_: all tags, tag set

**Tag data**:
What the engine publishes on each page's `fileData`, under `cgcTags`: the page's own tags with
their properties, its **primary tag** and its **expanded ancestor set** (`TagsData`). Every page
the transformer sees has it, a page with no tags an empty one.
_Avoid_: tag metadata, page tags

**Tag index**:
`static/cgcTags.json`: every tag in the **corpus**, mapped to its **tag properties**. For code in
the browser, which reads a colour through the **colour resolver**.
_Avoid_: tagIndex.json (v4's, which also carried the hierarchy and counts), tag map

**Tag stylesheet**:
`static/cgcTags.css`, in the `cgc.tags` layer: one **colour property** per tag in the **corpus**,
on `:root`, plus `--cgc-tags-default`. Linked from every page. Where a tag's colour inheritance
happens, and where a site overrides one tag's colour, its descendants following.
_Avoid_: tag CSS, colour sheet

## Contract

The shapes the engine publishes are its contract with consumers and downstream sites, pinned by
`e2e/artifacts.spec.mjs` and `e2e/primary.spec.mjs` and documented in the README:

- **Tag data** on `fileData.cgcTags`, typed by `TagsData` in `tags-core`.
- **Tag index**: `{ [tag]: { color: "<colour property>", icon: "<icon id>" | null } }`.
- **Tag stylesheet**: `--cgc-tags-default: <defaultColor>`, and per tag its own colour value,
  `var(<parent's colour property>)`, or at the top `var(--cgc-tags-default)`.

Decisions: [ADR-0001](./docs/adr/0001-the-tag-stylesheet-is-an-emitted-file.md) (why the stylesheet
is a linked file) and [ADR-0002](./docs/adr/0002-a-page-publishes-every-tag-it-is-under.md) (why tag
data carries properties for every tag a page is under).
