# site-components

The site plugin that carries this site's own layout components: v4's page title, with the site's
icon and its author, and v4's footer, with its copyright line. It is a component-only plugin, and
each component is placed by an entry of its own in the site config. It also registers the site's
own full-width frame, for annotation pages ([ADR-0002](./docs/adr/0002-a-full-width-frame-that-keeps-the-sidebars.md)). Inherits the family vocabulary in
[`quartz-v5/CONTEXT.md`](../../CONTEXT.md). The decisions are
[#44](https://github.com/chaoticgoodcomputing/blog/issues/44) (what the plugin holds) and
[ADR-0001](./docs/adr/0001-one-config-entry-per-component.md) (how the site config places it). The
port is [#70](https://github.com/chaoticgoodcomputing/blog/issues/70). No fixture config loads it,
so its specs build scratch sites from the site config.

## Language

**Site component**:
One of this plugin's layout components, `SitePageTitle` or `SiteFooter`. They are the site's own,
v4's `PageTitle` and `Footer`, and they keep v4's markup and class names (`page-title…`,
`site-footer`). They carry no CSS: the site styles them from site-styles' components tier, as
application CSS (ADR-0003's site-plugin amendment).
_Avoid_: widget, cgc component

**Placement**:
A site config entry that puts one site component in the layout. It names this plugin by an object
source, `{ repo: "@chaoticgoodcomputing/site-components", name: <placement> }`. Quartz imports that
entry by the placement name, so the site package depends on the plugin under each placement name
too, an alias (#96). The loader finds the component by the placement name in PascalCase:
`site-page-title` places `SitePageTitle`, and `site-footer` places `SiteFooter`. So a placement name
is what `byPageType.exclude` takes. The plugin itself is the repo-only package
`@chaoticgoodcomputing/site-components`, and `site-components` is still its directory, Nx project and
manifest name.
_Avoid_: instance, alias, plugin name (for a placement's)

**Site frame**:
`site-full-width`, the frame this plugin registers: the page's width for the body, like core's
`full-width`, with the `left` components in a bar at the top of the page header and the `right`
ones after the body, where core's drops both. A body that takes the page header, as cgc-annotator's
does (`takesPageHeader`), is handed the before-body components as its children, to place itself:
an annotation page's header is in its annotations panel (#87). A page type gets it through
`template` under `layout.byPageType`; the site gives it to annotation pages (#37). Styled by
site-styles' objects tier.
_Avoid_: layout, template (that is the config key naming it), full-width frame (core's)

**Site author**:
The person the page title's byline names: its `author` option, fixed for the whole site. The site
config writes it once, as the `&author` anchor on cgc-seo's `defaultAuthor.name`. The page title's
option is an alias of that anchor, so the byline and the pages' JSON-LD always name the same person
(#44).
_Avoid_: page author (that is cgc-seo's per-page frontmatter override), byline (for the option)

**Site icon**:
`quartz-v5/icon.png`, which the page title shows as `/static/icon.png`. Quartz serves stock's
icon from inside Quartz Core. The site's build target puts the site's own in its place after
the build (`quartz-v5/utils/postbuild.mjs`), so this plugin only links to it.
_Avoid_: logo, favicon (the post-build step also writes that from the site icon)

## No is-index condition

#44 gave this plugin a third job: register an `is-index` layout condition through
`registerCondition`, because v5 ships only `not-index`, and v4's index had components no other page
has (the post listing, the "Newsletter" subscribe box and the social cards, #73 and #80). No plugin
can: the loader's condition registry is bundled into Quartz's own transpiled build, which hands a
plugin no reference to it. The owner decided on #70 that the site adds no `is-index` at all, whether
through `registerCondition`, a vendored change or an index page type.

So this plugin registers no condition. The site's steering file `quartz-v5/core/quartz.ts` keeps
those components to their pages instead, through Quartz's TS layout override. Every root the e2e
harness builds shares that file, so its rule applies only to a config that loads this plugin: loading
it is what marks a config as the site's own, and no fixture config does (`e2e/site-components.spec.mjs`
checks that). `tests/specs/site-index-only.spec.mjs` proves the placement on the site config.
