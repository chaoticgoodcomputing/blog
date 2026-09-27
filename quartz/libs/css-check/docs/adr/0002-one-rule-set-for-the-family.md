---
status: accepted
date: 2026-09-25
---

# One rule set for the family, the strictest the copies held

ADR-0003 says rules 1 to 4 are enforced by machine, because "convention we have to remember is
convention we will forget". Before this library the machine was nine copies of one checker, one in
each styled plugin's `build.mjs`, and a tenth variant in the widgets library's `lint-css.mjs`. Each
copy was pasted from the last and changed where its package needed it, so by the ninth the family
enforced ADR-0003 six different ways, counting the widgets lint. `cgc-tag-explorer` and
`cgc-annotator` rejected `color-mix()`, which `cgc-social` and `cgc-graph` ship. `cgc-social` checked
keyframes and a per-block custom-property prefix, where the other plugins rejected keyframes outright
and most checked only `--cgc-`. `cgc-annotator` rejected sibling combinators, and the widgets lint
didn't check colours or fonts at all.

The holes, meanwhile, were copied with the code. No copy caught a named colour or a font set
through the `font` shorthand. The eight plugin copies that check every class let a selector start
at `:root`, or reach a sibling through `~ :not(.x)`. The widgets lint skipped nested rules, let
`.cgc-bluesky ~ p`, `@property` and `@font-face` through, and let `cgc-bluesky` define names in
`cgc-bluesky-post`'s namespace. Found by the code review of the Quartz v5 migration (#53).

## Decision

One check, in this library, with one rule set (listed in `CONTEXT.md`). Where the copies disagreed
the strictest won, unless ADR-0003 allows what it rejected and a package relies on it:

- **A colour value made only of references to the theme passes**, `color-mix()` and `light-dark()`
  included, and a literal fails wherever it sits, inside one of them too. The copies that rejected
  `color-mix(` outright did so because it could carry a literal (`color-mix(…, white)`). The check
  now finds the literal. ADR-0003's colour-value amendment counts `color-mix()` and `light-dark()`
  as colour values, and `cgc-social`'s calendar levels mix the theme's colours.
- **A font family is one reference to a theme font, with no fallback**: `var(--titleFont)`,
  `var(--headerFont)`, `var(--bodyFont)` or `var(--codeFont)`, the four ADR-0003 rule 6 documents.
  Eight plugin copies rejected every `font-family`. `cgc-graph`'s accepted any one `var(--…)`, which
  let a block set `--cgc-graph-font: Georgia` and take its font from that, so it is not the rule
  here. Rule 5 asks for fonts to come from the theme's properties, which a theme font does, and
  `cgc-graph` and `bluesky-post` use `--codeFont`. The `font` shorthand is held to the same rule,
  and before its family it is written out with no `var()`, since a `var()` there could carry a
  family in (`--cgc-x-size: 12px Georgia,`).
- **Keyframes are allowed, in the block's namespace**, as `cgc-social`'s copy and the widgets lint
  had it. `cgc-social` and `bluesky-post` animate their spinners.
- **Custom properties are the block's, `--<block>-…`**, not just `--cgc-…`: the stricter prefix,
  from `cgc-social`'s copy and the widgets lint.
- **A sibling combinator must land on an element of the block.** `cgc-annotator`'s copy rejected
  every one. This allows `.x__a + .x__b`, which reaches nothing it doesn't own, and still rejects
  every sibling the block doesn't own, in `:has()` too.

Two reaches remain, because two kinds of package exist: one that renders all of its markup, and one
that styles markup someone else writes inside its element (PDF.js's text layer, in `cgc-annotator`
and `pdf-viewer`). Both start every selector at the block and never go beside it.

The holes are closed for every package at once: named and system colours (the deprecated system
colours included), the `font` shorthand, a font taken from a property of the block's own, nested
rules, a selector's leftmost compound, siblings, combinators inside `:is()` and `:has()`, the
`of S` selector in `:nth-child()` and `:nth-last-child()`, at-rules that define global names, the
other global names a declaration defines, overlapping block namespaces (a name is the block's that
holds it most narrowly), and a relative CSS import that leaves the checked tree.

## Consequences

- **Every styled package fails the same way on the same mistake**, and a fix reaches all of them.
- **A package's own rule is an option, not a fork**: `cgc-tag-explorer` passes its drawer's media
  query, and every package passes its blocks, its layer and its reach.
- **Some CSS the copies rejected now passes**, four kinds of it, each allowed by ADR-0003:
  - `color-mix()` over theme references, in `cgc-tag-explorer` and `cgc-annotator`. A literal
    inside one still fails.
  - A theme font (`font-family: var(--codeFont)`), in the eight plugins that rejected every
    `font-family`. A font from any other property still fails, the block's own included.
  - Namespaced `@keyframes`, in the eight plugins whose copies rejected every `@keyframes`:
    `cgc-annotator`, `cgc-backlinks`, `cgc-email-subscribe`, `cgc-graph`, `cgc-page-source`,
    `cgc-post-listing`, `cgc-tag-explorer` and `cgc-tag-list`. A keyframes name outside the block's
    namespace still fails.
  - A sibling that is the annotator's own element (`.x__a + .x__b`). A sibling the block doesn't own
    still fails.

  None of them lets a stylesheet reach an element or take a colour or font that isn't the block's or
  the theme's. Whether the family accepts them is the owner's call.
- **Nested CSS is out.** No stylesheet used it, and the check would otherwise have to resolve every
  `&` to know what a rule selects.

## Considered alternatives

- **Backport each copy's fixes to the others.** It fixes today's drift and guarantees the next.
- **Keep every copy's strictest rule unconditionally**, `color-mix()` and every `font-family`
  rejected. `cgc-social` and `cgc-graph` would have to give up colours and fonts ADR-0003 allows.
- **One reach for everyone.** `"block"` can't style PDF.js's markup, and `"inside"` would let the
  plugins that render all their markup name classes they don't own.
