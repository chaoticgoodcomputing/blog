# cgc-seo

The Quartz 5 plugin that owns how the site presents itself to search engines and feed readers:
which pages ask to be indexed, the sitemap, the RSS feed and the metadata in each page's head.
Inherits the family vocabulary in [`quartz-v5/CONTEXT.md`](../../CONTEXT.md).

## Language

**Indexable page**:
A page the site asks search engines to index and lists in its sitemap, and in its feed when it is an
**article**. That covers the site's own public content and the **tag pages** that list it: every page
that is not a private, unlisted or external page, except a generated listing of a tag that no
indexable page carries, which lists only private stubs.
_Avoid_: public page, SEO page

**Tag page**:
The page for one tag, which crawlers are always given at `/tags/<t>` (#43). Quartz generates it as
a listing, or the tag's description note supplies it: `tags/<t>.md`, or `tags/<t>/index.md`, the
vault's shape until the cutover rename, which is served at `/tags/<t>/` until then. Listed once,
dated by its description note if it has one.
_Avoid_: tag listing (that is the generated kind only), tag index (that is `/tags/index`, the page of
every tag)

**Private page**:
A published stub of a vault note whose body stays private, marked by the `private` tag or a
descendant of it. It stays listed on the site but is never an indexable page. The `private` tag's
own listing page is treated the same way.
_Avoid_: hidden page, unlisted page, draft

**Unlisted page**:
Stock Quartz's stronger state (`unlisted: true`): hidden from every listing on the site as well
as from search engines and feeds. A private page is deliberately not unlisted.
_Avoid_: private page

**External page**:
A stub standing in for a page on another site, so that cross-graph links resolve. It names that
page's URL as `external` in its frontmatter (v4 set the same field on the page's data). Its URL is
not ours, so it is never an indexable page.
_Avoid_: remote page, cross-graph stub
_Dormant_: external pages are out of scope for the v5 migration, so none exist yet. The term is
kept for when they return.

**Page author**:
The author a page names in its own `author` frontmatter, or the site's **default author** when it
names none. It is what the page's head metadata credits.
_Avoid_: site author (that is the name in the site header, which never changes per page)

**Article**:
A page whose head describes it as a written piece, with `article:*` metadata and a JSON-LD
article, and which the **feed** can carry. It is built from a note of its own: tag listings and the
404 page never are. On this site only the notes under `content/` are articles, as in v4, so the home
page and top-level pages such as `/about` are not.
_Avoid_: post, content page (that is stock Quartz's page type for any note)

**Feed**:
The RSS feed, `index.xml`: the newest indexable articles, newest first, as many as `rssLimit`. Each
item carries the article's own description, if it gives one, then its reading time, and a category
per tag. Every page's head links it.
_Avoid_: RSS (the format), content index (stock `content-index`'s JSON, which lists every page)
