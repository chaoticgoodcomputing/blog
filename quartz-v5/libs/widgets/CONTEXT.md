# @chaoticgoodcomputing/widgets

Preact widgets that an `.mdx` page imports like any npm package, one subpath export per widget:
`/pdf-viewer` and `/bluesky-post`, beside `/bluesky`, the non-widget Bluesky client the second is
built on. There is no root export. The package ships as TypeScript source, and the page's bundler
compiles it: [`cgc-mdx`](../../plugins/cgc-mdx/CONTEXT.md) makes each use of a widget an island. It
is a **Library**, not a plugin, so it has no Quartz hooks and no place in a site's config. Inherits
the family vocabulary in [`quartz-v5/CONTEXT.md`](../../CONTEXT.md), and uses **Widget**,
**Island** and **Widget layer** as `cgc-mdx` defines them. Decided on
[#36](https://github.com/chaoticgoodcomputing/blog/issues/36).

## Language

**Subpath export**:
`@chaoticgoodcomputing/widgets/<name>`, the only way into the package, one per widget, plus
`/bluesky`, which is not a widget. With no root export, one import can't pull in two widgets.
_Avoid_: entry point (cgc-mdx's **Entry** is the browser module it writes), module

**Block**:
The BEM block a subpath's CSS lives in: `cgc-<name>`, named after its directory under `src/`,
which is also its subpath. Everything the stylesheet names in the page's global namespaces is inside
it: classes (`cgc-pdf-viewer`, `cgc-pdf-viewer__page`), custom properties (`--cgc-pdf-viewer-…`)
and keyframes. One block never selects another's.
_Avoid_: namespace (for one widget's), prefix, scope

**Library-CSS check**:
The package's `lint` target, `lint-css.mjs`: ADR-0003 rule 3's PostCSS pass run in check mode,
since a library has no build to transform in. It fails on any selector whose leftmost compound
doesn't carry a class of its directory's block, any custom property or keyframes name outside it,
and any CSS it can't see: an `@import`, or a stylesheet imported from another package. It rewrites
nothing, so the shipped CSS is exactly the source.
_Avoid_: stylelint, prefixing pass (that one transforms)

**Icon module**:
A widget's `icons.ts`: the icons it shows in the browser, as **drawn icons** (the icons library's
term) that `@chaoticgoodcomputing/icons` drew from the ids in the `icons.json` beside it
(`npm run icons`). Committed, since the widget's browser code can't run the library, and checked by the `lint` target
against what the library draws ([ADR-0002](./docs/adr/0002-browser-icons-are-drawn-ahead.md)).
_Avoid_: icon sprite, icon cache, generated icons (in prose)

**Text layer**:
PDF.js's transparent copy of a page's text, laid over the drawing so that a reader can select and
find it. Its CSS is PDF.js's own, prefixed by hand into `pdf-viewer`'s block.
_Avoid_: selection layer, textLayer (PDF.js's class, which this package never ships)

**Post card**:
One Bluesky post as `/bluesky`'s renderer draws it: the `cgc-bluesky` block, with its author, text,
embeds (images, a link card, a quoted post), date, optional counts and, in a feed, why the post is
there. The `bluesky-post` widget wraps one in its own block, `cgc-bluesky-post`, which holds the
loading and failure states.
_Avoid_: embed (a post's own images, link card or quote), tweet, post widget

## Consumers

- **Content.** An `.mdx` page imports a widget by its subpath, and the import resolves through
  `node_modules` like any package's. In this repo, the root `package.json` links the library
  (`workspace:*`), so the vault and the e2e fixture reach it by Node's upward walk (#36). A
  downstream site installs it from npm. The widget's own dependencies (`pdfjs-dist`) install
  beside it.
- **A plugin that inlines part of it**, such as `cgc-social` with `/bluesky`, lists it as a
  `file:../../libs/widgets` devDependency, like any library (ADR-0005). No plugin does yet.
  `/bluesky` brings its stylesheet with it, so the plugin's bundle has a CSS output to place in its
  own layer.

## Constraints

- **Preact is a peer.** `cgc-mdx` pins every widget's `preact` imports to the host Quartz's copy.
  `/bluesky` doesn't use Preact: its renderer returns HTML strings, so a plain script can draw posts.
- **A heavy dependency loads from an effect.** `pdf-viewer` imports PDF.js dynamically, so PDF.js
  lands in a chunk of its own that only a hydrating island fetches, and it never runs at build time.
- **Nothing is fetched at build time.** `bluesky-post`'s build-time HTML is a loading state and a
  link to the post, and the post is fetched once the island hydrates. A URL that isn't a Bluesky
  post's throws while rendering, which fails the build.
- **What a stranger wrote is text.** `/bluesky` escapes everything a post carries, and only turns
  `http(s)` URLs into links or images.
- **Stylesheets are side effects.** A module imports its own stylesheet only for its side effect,
  so `package.json` lists the CSS files in `sideEffects`. A bundler that honours the field, like
  webpack, would otherwise drop them under `false`. esbuild keeps CSS either way.
- **Widget CSS lands in `cgc.mdx.widgets`**, which `cgc-mdx` wraps around it when it emits it. Rule 9's
  vendor layer can't reach a widget, so third-party CSS goes into the block by hand.
- **How `pdf-viewer` carries PDF.js** is [ADR-0001](./docs/adr/0001-pdf-js-rides-in-the-widget-chunk.md).
- **How a widget's browser icons are drawn** is [ADR-0002](./docs/adr/0002-browser-icons-are-drawn-ahead.md).
