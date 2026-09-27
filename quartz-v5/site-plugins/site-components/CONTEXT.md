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

## The is-index condition

#44 gave this plugin a third job: register an `is-index` layout condition through `registerCondition`,
because v5 ships only `not-index`, and v4's index had components no other page has (the post listing
and the social cards, #73 and #80). **No plugin can do this on stock Quartz 5.0.0.** Here is why:

- `registerCondition` lives in the loader's `conditions.ts`. The Quartz CLI bundles the loader,
  with the rest of Quartz, into one transpiled file, `quartz/.quartz-cache/transpiled-build.mjs`.
  That file exports only its build function, and since nothing inside it calls `registerCondition`,
  esbuild drops the function from the bundle altogether.
- A plugin is loaded at run time with `import()` of its own `dist/`. So the only registry the
  loader consults is one the plugin has no reference to. The `@jackyzha0/quartz` specifier the loader
  treats as shared is not installed anywhere a plugin could resolve it.
- The ecosystem registers conditions in `quartz.ts`, which the bundle does include. In this repo that
  file was upstream's, inside the vendored copy, so editing it was drift. Since #91 it is a
  **steering file** of Quartz Core, which the site may edit, and #70 places the index-only
  components through it.

The loader warns `Unknown condition "is-index"` and renders the component on every page.
`e2e/site-components.spec.mjs` holds this as a `test.fail`. The index half passes, and the other-pages
half is expected to fail until the host lets a plugin register a condition. The way forward needs a
human decision between two options:

- a third vendored change, with its ticket and upstream proposal, such as the loader registering a
  plugin module's exported conditions;
- the index as a page type of its own. #44's question offered this, but `byPageType` can only remove
  components, so every other page type would have to exclude each index-only one.
