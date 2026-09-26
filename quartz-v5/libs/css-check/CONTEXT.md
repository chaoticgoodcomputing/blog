# @chaoticgoodcomputing/css-check

The **library-CSS check**: [ADR-0003](../../../docs/adr/0003-library-css-in-plugins-application-css-at-the-site.md)'s
rules for library CSS, checked by machine, in one place for the whole family. Every plugin that
ships a stylesheet runs it from its `build.mjs` before it bundles, and fails its build on a problem.
The widgets library runs it from its `lint` target, since a library has no build. It reads CSS and
rewrites nothing, so what ships is what was checked. It ships as JavaScript source that
`build.mjs` imports, and nothing inlines it ([ADR-0001](./docs/adr/0001-javascript-a-build-imports.md)).
Inherits the family vocabulary in [`quartz-v5/CONTEXT.md`](../../CONTEXT.md).

Before this library, each styled package carried its own copy of the check, and the copies had
drifted apart. Where they disagreed, the rules below keep the strictest, and close the holes the
copies shared ([ADR-0002](./docs/adr/0002-one-rule-set-for-the-family.md)).

## Language

**Library-CSS check**:
`checkStylesheet(css, options)`: every problem one stylesheet has under ADR-0003, as
`file:line:column  message` lines, none when it keeps to the rules. `checkImports(source, options)`
finds the stylesheets a source file imports that the check can't see.
_Avoid_: lint (that's the widgets library's target, which runs it), linter, stylelint, prefixing pass
(ADR-0003 rule 3's name for a transform, which this isn't)

**Block**:
A BEM block the stylesheet styles, such as `cgc-social`. A package names its own blocks: one for most
plugins, two for `cgc-annotator` (`cgc-annotator`, `cgc-annotator-viewer`), one per widget.
_Avoid_: namespace (that is what a block owns), prefix, scope

**Namespace**:
The names a block owns in the page's global namespaces. Its classes are the block's name and what
follows `__` or `--` (`cgc-social__card`, `cgc-social--open`). Every other name it defines, custom
properties included, is the block's name and what follows `-` (`--cgc-social-level-1`,
`cgc-social-spin`). A name belongs to the block whose namespace holds it most narrowly, so
`cgc-bluesky-post-spin` is `cgc-bluesky-post`'s even though `cgc-bluesky` is a prefix of it.
_Avoid_: prefix (the prefix is only part of the rule)

**Neighbour**:
A block that isn't the stylesheet's, passed so that the check can tell whose a name is when one
block's name is a prefix of another's. Each widget's stylesheet has the others as neighbours.
_Avoid_: sibling block (a sibling is an element), other block

**Reach**:
How far below an element of the block a selector may go. `"block"`, the default, names only the
block's own classes on the way down, for a package that renders all of its own markup. `"inside"`
names anything inside an element of the block, for markup someone else writes there: PDF.js's text
layer, in `cgc-annotator` and the widgets. No reach goes beside or above the block.
_Avoid_: mode, strictness

**Colour literal**:
A colour written into a value instead of taken from the theme: a hex, a colour function (`rgb()`,
`oklch()`, `color()` and the rest), a named colour (`white`) or a system colour (`CanvasText`, and
the deprecated ones such as `WindowText`), wherever it sits, inside `color-mix()` or `light-dark()`
included. `currentColor` and `transparent` are not literals, and neither is a colour value made only
of references to the theme. A word in a property whose words are never colours is not one either:
a property name (`transition: background 0.2s`), a name (`grid-area: tomato`), or a function's name
(`tan(`).
_Avoid_: hex, hardcoded colour

**Theme font**:
One of the four font families ADR-0003 rule 6 documents, `--titleFont`, `--headerFont`, `--bodyFont`
and `--codeFont`, which the theme sets. The only fonts a stylesheet may take: a property of the
block's own could hold any family at all.
_Avoid_: font variable, font token

## The rules

A stylesheet fails the check for any of these.

- **A selector that doesn't start at an element of the block**: its leftmost compound carries none
  of the block's classes (`:root .x`, `.sidebar .x`, `::selection`). Rules 1, 2 and 4.
- **A selector that reaches beside the block**: after `+` or `~`, the compound carries none of the
  block's classes (`.x ~ p`, `.x__page + .sidebar`). The same inside `:has()`, and inside `:is()`,
  `:where()`, `:not()` or the `of S` of `:nth-child()` and `:nth-last-child()` once their argument
  has a combinator (`.x:is(.sidebar *)`, `.x__a:nth-child(1 of :root .x__a)`).
- **With `"block"` reach, anything named that isn't the block's**: another class, a tag, an id, an
  attribute or `*`, anywhere in the selector, selector arguments included (`:not(.x)`,
  `:nth-child(2n of .x)`).
- **A nested rule**, with `&` or without: the full selector is written out, so the check sees what it
  selects.
- **A name outside the block's namespace**: a custom property (rule 7), `@keyframes`, and the names
  `anchor-name`, `container-name` (and `container`), `view-transition-name`, `view-transition-class`
  and the timeline properties define.
- **An at-rule that defines a global name no block holds** (`@property`, `@font-face`,
  `@counter-style` and the like), **an `@import`**, or any at-rule but `@media`, `@supports`,
  `@container`, `@keyframes` and the package's own `@layer`.
- **A colour literal** in any value. Rule 5.
- **A font family of its own**: `font-family`, or the family at the end of the `font` shorthand,
  that is anything but one reference to a theme font, `var(--bodyFont)` and the like, with no
  fallback. A reference to the block's own property is a font of its own. The `font` shorthand is
  written out before its family, with keywords, a size and a line height but no `var()`, since one
  there could carry a family in. Rules 5 and 6.
- **Outside the family layer**, when the package passes one: every rule sits in one top-level
  `@layer cgc.<name> { … }`, and there is no other layer (rule 11). A stylesheet someone else places,
  a widget's or `cgc-annotator`'s before its build wraps it, declares no layer at all.
- **A media query a package didn't pin**, when it pins them: `cgc-tag-explorer` allows only its
  drawer's, which its plugin rewrites to the site's breakpoint.

`checkImports` fails a source file that imports a stylesheet from another package, or from outside
the checked directory by a relative path, since the page's bundler would inline CSS the check never
saw.

## Constraints

- **It checks; it never transforms.** ADR-0003 rule 3 names a prefixing pass for plugins, and its
  libraries amendment makes the check a library's form of it. That the plugins run this check rather
  than a prefixing pass is a known departure from rule 3 that awaits the owner's decision; until then,
  keep it a check.
- **It checks the stylesheet, not the page.** A class a package writes from script, or a custom
  property set inline (`pdf-viewer`'s PDF.js scale properties), never reaches it. The no-bleed spec
  catches what a stylesheet check can't (ADR-0004).
- **A consumer lists it as a devDependency**: `file:../../libs/css-check` in a plugin, `workspace:*`
  in a library (ADR-0005). The loader installs dev dependencies, builds, then prunes them, and the
  check is needed only while the package builds.
- **It is proven through its consumers.** Its spec plants escapes in copies of the styled plugins and
  runs their builds; the widgets library's lint spec plants them in widget CSS.
