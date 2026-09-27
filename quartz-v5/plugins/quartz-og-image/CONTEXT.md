# quartz-og-image

`@chaoticgoodcomputing/quartz-og-image`, manifest name `cgc-og-image`, loaded by package name (#89, #94): the Quartz 5 plugin that draws the card a shared link shows: one per page, pointed at by the page's
`og:image`. It wraps stock og-image, which still does the drawing, and supplies the card. Inherits
the family vocabulary in [`quartz-v5/CONTEXT.md`](../../CONTEXT.md). Its one decision is
[ADR-0001](./docs/adr/0001-stock-og-image-under-its-own-name.md).

## Language

**Card**:
The image drawn for one page at build time and named by its `og:image` and `twitter:image` tags:
the site's icon and address, the page's title, description, date and reading time, and its tag
chips. Drawn in the scheme the `colorScheme` option names, whatever scheme a reader is using.
_Avoid_: OG image (stock's name for the file), social image, thumbnail, preview

**Tag chip**:
One of a card's first three tags, drawn as `#` and the tag's last segment: `writing/articles` is
`#articles`. Text on the card, with no colour or icon of its own.
_Avoid_: tag badge (that is a rendered page's, from `cgc-tag-list`), pill, label

**Card icon**:
The image in a card's corner. The file the `icon` option names, and stock's own icon when there is
none. Not the favicon, which stock Quartz reads from inside its own copy: this site replaces that
with a copy its build makes (#70), and this plugin never touches it.
_Avoid_: favicon, logo, site icon (for the option)

**Stock og-image**:
`@quartz-community/og-image`, the plugin this one wraps and replaces. It stays installed, because
this plugin runs its code, and disabled, because both on would draw every card twice.
_Avoid_: the upstream plugin, the original

**Serve run**:
`quartz build --serve`, the local preview. It draws no cards. A plain `quartz build`, with or
without `--watch`, draws them all.
_Avoid_: dev mode, watch mode (a watch without serve still draws)
