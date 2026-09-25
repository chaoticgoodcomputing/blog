# @chaoticgoodcomputing/pipeline

A library that rebuilds a Quartz 5 site's configured pipeline for content Quartz doesn't parse
itself. `cgc-mdx` runs `.mdx` page bodies through it, and `cgc-annotator` runs each annotation's note
through it, minus a denylist. It ships as TypeScript source, and a consuming plugin's build inlines
it (ADR-0005). Inherits the family vocabulary in [`quartz-v5/CONTEXT.md`](../../CONTEXT.md).

## Language

**Configured pipeline**:
What Quartz runs on every markdown file: the site's transformers in their configured order. Each
one's text transform runs, then remark-parse and each one's markdown plugins, then remark-rehype
and each one's html plugins.
_Avoid_: processor, transformer chain

**Pipeline reconstruction**:
The configured pipeline rebuilt outside Quartz's parser from `ctx.cfg.plugins.transformers` alone,
mirroring `quartz/processors/parse.ts` without importing Quartz's core. Content run through it
renders as a `.md` file would: wikilinks, callouts, maths, highlighting, the table of contents.
_Avoid_: custom pipeline, re-implementation

**Transformer name**:
The `name` a transformer instance carries, such as `TableOfContents` or `Latex`. It isn't always
the plugin name the transformer is installed under: `crawl-links` is `LinkProcessing`. It's the only
identity a transformer has at build time.
_Avoid_: plugin name (for this), transformer id

**Denylist**:
The transformers a caller leaves out of a reconstruction, by transformer name. A name that no
configured transformer carries is ignored, so a plugin's default denylist can name transformers a
site doesn't enable.
_Avoid_: blocklist, exclude list, filter

## Constraints

- **The build context passes through untouched.** Every transformer hook gets the `ctx` the
  pipeline was created with.
- **A source must name a real file.** Some transformers read the file behind `filePath`, such as
  `CreatedModifiedDate` for its dates.
- **Tested through a probe plugin**, `e2e/probe/`, built from source into a scratch site by
  `tests/harness/probe.mjs`, and through its consumers. `cgc-annotator`'s specs prove a denylist on
  a real plugin: its default and a site's own.
