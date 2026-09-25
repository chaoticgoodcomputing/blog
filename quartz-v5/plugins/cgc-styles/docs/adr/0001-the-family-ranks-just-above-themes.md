---
status: accepted
date: 2026-09-25
---

# The family ranks just above themes

`cgc-styles` is a transformer with `defaultOrder: 15`. Decided while building it on
[`cgc-styles` engine and matching dependencies by plugin name](https://github.com/chaoticgoodcomputing/blog/issues/63),
inside the bounds set on
[Can the cgc family hold its own cascade layer?](https://github.com/chaoticgoodcomputing/blog/issues/30):
a transformer, with an `order` above any theme's.

> Source links point at upstream Quartz at
> [`97a2d05`](https://github.com/jackyzha0/quartz/tree/97a2d05f80c4c50534959b1d0d41cc4b3895625e)
> (v5.0.0), the ref `quartz-v5/upstream.json` pins, and at the stock plugins it installs.

**The order does two jobs.** Plugins emit their `externalResources()` CSS transformers first, then
emitters, each group sorted by `order`
([plugins/index.ts:11](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/index.ts#L11)),
so this plugin's `order` is the family's position. And the loader refuses a consumer ordered below
its engine
([config-loader.ts:142](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/config-loader.ts#L142)),
while a transformer's `order` is also its place in the markdown pipeline. So the engine's `order` is
a floor under every consumer transformer's pipeline position too. The number should be as low as the
first job allows.

**15 is the lowest that clears a theme with room.** `@quartz-themes/core` defaults to order 10 and
declares its four layers in its first stylesheet. At 15 the family ranks above them, and every
consumer transformer can run anywhere from 15 up, before syntax highlighting (20), link crawling
(60) and the rest of the default pipeline. The fixture proves the ranking against a stand-in that
emits that theme's statement at its order (`e2e/layer.spec.mjs`).

## Considered alternatives

- **Above `quartz-fonts` (order 61 or more).** ADR-0003's stack declaration lists `quartz-fonts`
  below `cgc`, and on a stock site at order 15 it ranks above us, since `@quartz-community/quartz-fonts`
  is a transformer at order 60. Rejected, because the rank between them decides nothing. The
  `quartz-fonts` layer only sets font custom properties on `:root` (the plugin's `buildLayeredCSS`),
  which no family rule sets. Its heading rule is unlayered and beats every layer anyway. Order 61
  would buy no declaration and would push every consumer transformer past link crawling. A site that
  wants the documented stack names it in a stack declaration, which overrules every plugin's `order`.
  This site does that from `site-styles`.
- **An emitter.** Emitters' CSS follows every transformer's, so the family would rank above every
  transformer theme whatever the number. Rejected: `order` would then stop being the one knob a
  site turns to move the family, since no `order` could put it below a transformer theme, and #30
  settled on a transformer.

## Consequences

- On a stock site with no stack declaration, the page ranks `quartz-base`, then themes at order 10
  or less, then `cgc`, then `quartz-fonts`.
- A theme ordered above 15 ranks above the family. A site that runs one sets this plugin's `order:`
  above the theme's, and its consumers' orders with it.
- A consumer transformer has to be ordered 15 or higher, so it can't run before `note-properties`
  (5) or `created-modified-date` (10). None needs to: those parse the frontmatter a consumer reads.
