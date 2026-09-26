# @chaoticgoodcomputing/widgets

Preact widgets for [Quartz 5](https://github.com/jackyzha0/quartz) pages written in MDX, rendered
at build time and hydrated in the browser by
[`cgc-mdx`](https://github.com/chaoticgoodcomputing/blog/tree/main/quartz-v5/plugins/cgc-mdx).
Each widget is its own subpath export, and the package has no root export. Import a widget in an
`.mdx` page like any other package:

```mdx
import { PDFViewer } from "@chaoticgoodcomputing/widgets/pdf-viewer"

<PDFViewer src="/assets/resume.pdf" title="Resume" height="800px" />
```

The package ships as TypeScript source, which the page's bundler compiles. Preact is a peer
dependency: `cgc-mdx` gives every widget the host Quartz's copy.

## `/pdf-viewer`

A PDF drawn page by page with [PDF.js](https://mozilla.github.io/pdf.js/), which is bundled rather
than fetched from a CDN. The text is selectable, and links in the PDF open in a new tab. Before
hydration, and when the PDF can't be loaded, readers get a download button and a link to the PDF.

| Prop     | Default          | What it is                                |
| -------- | ---------------- | ----------------------------------------- |
| `src`    | required         | The PDF's URL, as the page would link it. |
| `title`  | `"PDF Document"` | Shown in the toolbar.                     |
| `width`  | `"100%"`         | A CSS width.                              |
| `height` | `"600px"`        | A CSS height. The pages scroll inside it. |

Its skin is Quartz's colour properties (`--light`, `--lightgray`, `--gray`, `--darkgray`,
`--secondary`, `--tertiary`, `--textHighlight`), so it follows the site's theme and colour scheme.
A site with a Content Security Policy must allow `blob:` in `worker-src`, since PDF.js's worker
starts from a `blob:` URL. The reasons are in
[ADR-0001](https://github.com/chaoticgoodcomputing/blog/blob/main/quartz-v5/libs/widgets/docs/adr/0001-pdf-js-rides-in-the-widget-chunk.md).

## `/bluesky-post`

One [Bluesky](https://bsky.app) post, fetched from Bluesky's public API in the reader's browser
once the island hydrates. Before then, and when the post can't be fetched, readers get a message
and a link to the post. The build never touches the network, and a URL that isn't a Bluesky post's
fails the build.

```mdx
import { BlueskyPost } from "@chaoticgoodcomputing/widgets/bluesky-post"

<BlueskyPost url="https://bsky.app/profile/pfrazee.com/post/3meogr22vtc2d" showMetrics />
```

| Prop          | Default   | What it is                                                                      |
| ------------- | --------- | ------------------------------------------------------------------------------- |
| `url`         | required  | The post, as bsky.app shows it: `https://bsky.app/profile/<handle>/post/<id>`.  |
| `showMetrics` | `false`   | Show the reply, repost and like counts. As in v4, only `true` or `"true"` does. |
| `maxWidth`    | `"600px"` | A CSS max-width.                                                                |

The post shows its author, its text, and its images, link card or quoted post, and its counts
beside v4's emoji. Nothing is fetched but the post and its pictures. Its skin is Quartz's colour
properties (`--light`, `--lightgray`, `--gray`, `--darkgray`, `--dark`, `--secondary`,
`--tertiary`, `--highlight`) and its details use `--codeFont`. A site with a Content Security Policy must allow
`https://public.api.bsky.app` in `connect-src` and `https://cdn.bsky.app` in `img-src`.

## `/bluesky`

Not a widget: the client and renderer `/bluesky-post` is built on, for anything else that shows
Bluesky posts, such as a sidebar feed. It has no Preact in it. It reads Bluesky's public API
without signing in, and draws a post as an HTML string.

```ts
import { resolveHandle, getAuthorFeed, renderPost } from "@chaoticgoodcomputing/widgets/bluesky"

const feed = await getAuthorFeed(await resolveHandle("pfrazee.com"), { limit: 5 })
list.innerHTML = feed.map((item) => renderPost(item)).join("")
```

- `parseBlueskyUrl(url)`: a `bsky.app` post URL's handle, post id and `at://` URI, or `null`.
- `getPost(atUri)`, `getPostThread(atUri, { depth, parentHeight })`, `resolveHandle(handle)` and
  `getAuthorFeed(actor, { limit })` each take an optional `signal`. They reject with a
  `BlueskyError` whose `reason` is `not-found`, `blocked` or `unavailable`.
- `renderPost(item, { showMetrics, showContext, compact })` draws a post, or an item of a feed. The
  first two default to `true`: its counts, beside v4's emoji, and in a feed, who reposted it or
  that it replies, beside MDI's icons. The icons are drawn by
  [`@chaoticgoodcomputing/icons`](https://github.com/chaoticgoodcomputing/blog/tree/main/quartz-v5/libs/icons)
  and carried in the package, so nothing is fetched for them.
  `compact`, `false` by default, draws it smaller, for a sidebar, as `cgc-social`'s feed does.
  Everything the post carries is escaped, and only `http(s)` URLs become links or images.
- `escapeHtml`, `relativeTime` and `postUrl` are the renderer's helpers.

The renderer's markup is one BEM block, `cgc-bluesky`, and it imports its stylesheet, so a bundler
that takes the renderer takes its CSS too. Its size is a scale of custom properties on the block,
`--cgc-bluesky-space`, `-gap`, `-radius`, `-avatar-size`, `-quote-avatar-size`, `-thumb-size`,
`-font-size` and `-small-font-size`, which the compact card's `cgc-bluesky--compact` turns down.

## CSS

Every subpath's CSS is one BEM block, `cgc-<name>`, and never selects anything outside it. Its
colours and fonts come from the theme's properties. The package's `lint` script checks this
(`npm run lint`) with `@chaoticgoodcomputing/css-check`, the check the family's plugins run in their
builds, along with the icons a widget carries, which must be exactly what the icons library draws
(`npm run icons` redraws them).
