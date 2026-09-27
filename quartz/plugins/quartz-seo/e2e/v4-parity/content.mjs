// The pages v4's head, sitemap and feed were captured from (`v4-head.json` and `v4-feeds.json`, by
// `capture.mjs`), and the v5 spec builds again from the site config. Vault-shaped: v4 gave article
// metadata, and a place in the feed, to `content/` pages only. Every page sets its dates as UTC
// instants: a missing date is the build's clock, and a date-only one is local midnight, in both
// versions.

export const CONTENT = {
  "index.md": "---\ntitle: Home\nmodified: 2024-01-10T12:00:00Z\n---\nThe site root.\n",
  // Outside `content/`: a canonical URL, and nothing else. In the sitemap, not the feed.
  "about.md": "---\ntitle: About\nmodified: 2024-01-11T12:00:00Z\n---\nA top-level page.\n",
  // Mapping order, not tag order, picks the JSON-LD type (writing/tutorials → HowTo), while
  // `article:section` takes the first tag's top segment.
  "content/articles/parity-article.md": `---
title: Parity article
description: An explicit description, used as it is.
tags:
  - engineering/quartz
  - writing/tutorials
created: 2024-03-01T12:00:00Z
modified: 2024-04-02T12:00:00Z
published: 2024-03-05T12:00:00Z
---
The body of the article.
`,
  // No description, so the Description plugin derives one from the body, HTML-escaped.
  "content/notes/parity-note.md": `---
title: Parity note
tags:
  - horticulture
created: 2024-05-01T12:00:00Z
modified: 2024-05-20T12:00:00Z
published: 2024-05-02T12:00:00Z
---
Salt & pepper, and a "quoted" word. A second sentence follows the first one.
`,
  // No tags: the default type, and no section or keywords. A social description and image of its own.
  "content/notes/parity-untagged.md": `---
title: Parity untagged
socialDescription: A description for social cards.
socialImage: parity.png
created: 2024-06-01T12:00:00Z
modified: 2024-06-03T12:00:00Z
published: 2024-06-02T12:00:00Z
---
An untagged note.
`,
  // A private stub: v4 said `noindex, nofollow`; the rest of its head is an ordinary article's. Out of
  // the sitemap and the feed, and so is the page of `economics`, which no other page carries.
  "content/notes/parity-private.md": `---
title: Parity private
tags:
  - private
  - economics
created: 2024-07-01T12:00:00Z
modified: 2024-07-04T12:00:00Z
published: 2024-07-02T12:00:00Z
---
A private stub.
`,
  // A tag's description note, as the vault keeps them until #43: its canonical URL drops the
  // trailing `index`. Not in `content/`, so not an article. v4's sitemap listed it and the tag's
  // generated page, at /tags/horticulture/ and /tags/horticulture.
  "tags/horticulture/index.md": "---\ntitle: Horticulture\nmodified: 2024-01-12T12:00:00Z\n---\nNotes on growing things.\n",
}

// The URLs compared, including the 404 page.
export const URLS = [
  "/",
  "/about",
  "/content/articles/parity-article",
  "/content/notes/parity-note",
  "/content/notes/parity-untagged",
  "/content/notes/parity-private",
  "/tags/horticulture/",
  "/no-such-page",
]

// Runs in the page: what a crawler reads from the head that quartz-seo owns.
export function extractHead() {
  const attrs = (selector, attr) => [...document.head.querySelectorAll(selector)].map((el) => el.getAttribute(attr))
  return {
    canonical: attrs('link[rel="canonical"]', "href"),
    feeds: [...document.head.querySelectorAll('link[rel="alternate"][type="application/rss+xml"]')].map((el) => [
      el.getAttribute("title"),
      el.getAttribute("href"),
    ]),
    robots: attrs('meta[name="robots"]', "content"),
    article: [...document.head.querySelectorAll('meta[property^="article:"]')].map((el) => [
      el.getAttribute("property"),
      el.getAttribute("content"),
    ]),
    jsonLd: [...document.head.querySelectorAll('script[type="application/ld+json"]')].map((el) => JSON.parse(el.textContent)),
  }
}
