# quartz-styles

`@chaoticgoodcomputing/quartz-styles`, manifest name `cgc-styles`: the Quartz 5 engine that fixes
where the family layer ranks on a page. Its one published artifact is that position, and all it
emits is the statement that sets it. Inherits the family vocabulary in
[`quartz-v5/CONTEXT.md`](../../CONTEXT.md).

## Language

**Family position**:
Where the family layer ranks among the other layers on a page: above `quartz-base` always, and
above or below another plugin's layers by this plugin's `order`. This engine's published artifact.
_Avoid_: layer order (that is the ranking of every layer on the page), cascade position (in prose,
for the family's)

**Layer statement**:
The `@layer cgc;` this plugin emits and nothing else: a rule that names the family layer and holds
no styles, so it ranks the family without styling anything.
_Avoid_: layer declaration. The site's statement that names every layer on the page is the
**Stack declaration**, which overrules this one.

**Consumer** (of this engine):
A package of the family that emits CSS from `externalResources()`, into its own `cgc.<package>`
sublayer, and so lists this engine in `manifest.dependencies` by its plugin name, the package name
`@chaoticgoodcomputing/quartz-styles` (#95). A package whose CSS arrives
only through `additionalHead`, like `cgc-mdx`'s widget CSS, renders after every
`externalResources()` sheet, can't move the family, and isn't one.
_Avoid_: styled package, dependent
