---
status: accepted
date: 2026-09-25
---

# The ring carries the tag colour as its own `color`

Each badge's ring is painted in its tag's colour, which the `cgc-tags` engine publishes as a
colour property, such as `--cgc-tag-engineering--ai` (#31). The component has to get that property
onto the ring, and from #71 onto the icon inside it, while the tag colour never paints text.
Decided on [`tags-core`, `cgc-tags` and `cgc-tag-list`](https://github.com/chaoticgoodcomputing/blog/issues/69).

## Decision

The ring gets the tag colour as its `color`, inline: `style="color: var(--cgc-tag-…)"`. The
stylesheet draws the ring's border in `currentColor`, and an icon drawn in `currentColor`, as #71's
icons library draws them, takes the same colour with no further wiring. The ring holds no text, and
the rest of the badge keeps the colour of the text around it.

## Why not a custom property of the package's own

The obvious route is a package property, set inline and read by the stylesheet. ADR-0003 has a
package prefix its properties `--cgc-`, and this package's block is `cgc-tag-list`, so it would be
`--cgc-tag-list-…`. That is inside the engine's namespace: `--cgc-tag-list-color` is the colour
property of a tag called `list-color`, and a site that had one would find it overwritten. Any name
starting `--cgc-tag-` has that problem, and one outside it would break the family's naming just to
avoid the engine's.

## Consequences

- **The ring must never hold text.** Anything written inside it would take the tag colour.
- **To recolour a badge, a site overrides the tag's property**, which also recolours that tag
  everywhere else. The inline `color` outranks a stylesheet's, so a rule on the ring can't do it
  alone, and that's the intended single knob.

## Considered alternatives

- **An inline `border-color`.** It paints the ring, but #71's icon would need the colour set a
  second time.
- **A property named outside `--cgc-tag-`,** such as `--cgc-taglist-color`. It avoids the collision
  by breaking the naming every other package follows.

## Amendment: the bubble's rim carries the tag colour, and the icon is dark

_2026-09-26, from the owner's review notes of that day, on
[The tag glossary, one bubble style, and aligned badges](https://github.com/chaoticgoodcomputing/blog/issues/82),
recorded family-wide as ADR-0003's tag bubble amendment._

The ring is now the family's **tag bubble**, drawn by `@chaoticgoodcomputing/tags-core` for this
plugin and for `cgc-post-listing` alike. The owner set its colours: the tag colour paints only the
rim, the circle is the theme's `--lightgray`, and the icon the theme's `--dark`. So the decision above
changes in one respect: the tag colour is set inline as the bubble's **`border-color`**, not its
`color`, and the icon's `currentColor` is the bubble's `--dark`, which its stylesheet sets.

What stays: the colour is still set inline, from the engine's `--cgc-tag-…` property, and never as a
package property of ours, for the namespace reason above; the bubble still holds no text; and a site
still recolours a tag by overriding its property, which recolours the rim everywhere that tag is
drawn. The first considered alternative, an inline `border-color`, is now the decision, since the icon
no longer needs the tag colour at all.
