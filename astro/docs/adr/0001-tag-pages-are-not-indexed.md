---
authors: [spelkington]
contexts: [site]
areas: [seo]
exemplars: []
status: accepted
---

# Tag pages are not indexed

No tag page asks a search engine to index it, the tags index included, and the sitemap lists none
of them. Each still carries a share card and is still in the site's own search. Astro's sitemap
integration lists every page the build writes, and until now the site took only private pages,
private tags' pages, the 404 page and the graph page out of it
([`isIndexable`](https://github.com/chaoticgoodcomputing/blog/blob/9a5e54503baa48520af5772f9cbde19c4a2925d4/astro/src/lib/page.ts#L44-L54)),
so a tag page was in the sitemap and asked to be indexed like a note's page.

We decided this because Google does not index the site. In November 2026 Search Console had the
home page indexed and none of the other twenty pages inspected: eight "crawled, currently not
indexed", among them every article it had fetched, and the rest unknown to it. Its impressions had
fallen to almost none in April 2026, with no change to the site, a sign of a judgement of the site
as a whole and not of any page. Of the sitemap's 113 addresses, 42 were tag pages: listings of the
posts under a tag, the sort of page search engines take for thin content and weigh against the
site that publishes it. Leaving them out puts the site's writing before Google, and nothing else.

## What changed

A page is now one of two things, which used to be one:

- A **discoverable page** is what an indexable page was: any page but a private page, a private
  tag's page, the 404 page and the graph page. The site's own search, the share cards, the
  Markdown copies and the mention excerpts ask for one (`isDiscoverable`, `astro/src/lib/page.ts`).
- An **indexable page** is a discoverable page that is no tag page. Only it is in the sitemap, and
  any other page's head says `noindex` (`isIndexable`).

A tag page's last-modified date, which the sitemap worked out from the posts under the tag
([`sitemapEntry`](https://github.com/chaoticgoodcomputing/blog/blob/9a5e54503baa48520af5772f9cbde19c4a2925d4/astro/src/lib/sitemap.ts#L34-L41)),
went with it.

## Considered options

- **Only the tag pages with no description note.** A tag whose description note says something
  has a page that is more than a listing. But the description is a paragraph or two above the
  listing, and a rule that turns on whether a note exists is one more thing to remember when
  writing one.
- **Out of the sitemap, but no `noindex`.** A crawler that follows a link to a tag page would still
  index it: the sitemap says what to crawl, not what to leave out.
- **One flag, as before.** Making tag pages non-indexable without a second kind of page would also
  have taken them out of the site's own search and left a link to one with no card, for no gain in
  search.

## Consequences

A search engine that indexed a tag page drops it once it crawls the page again and reads `noindex`.
The deploy's IndexNow job submits the addresses that left the sitemap, so Bing and the other
IndexNow engines hear of it at the next deploy; Google, which takes no IndexNow submissions, hears
of it when it next crawls them.

A reader's way into the posts under a tag is unchanged: each tag page is still built, linked from
every note that carries its tag, and found by the site's search.

Whether this helped is for Search Console to say: whether the notes and articles it reported as
"crawled, currently not indexed" are indexed in the months after. If they are not, the next
candidates are the annotation pages, whose text is mostly another author's.

## Status

**Accepted.**

## Changelog

- **2026-11-17**: Recorded.
