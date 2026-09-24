# cgc-seo

The Quartz 5 plugin that owns how the site presents itself to search engines and feed readers:
which pages ask to be indexed, the sitemap, the RSS feed and the metadata in each page's head.
Inherits the family vocabulary in [`quartz-v5/CONTEXT.md`](../../CONTEXT.md).

## Language

**Indexable page**:
A page the site asks search engines to index and lists in its sitemap and feed. That covers the
site's own public content and the tag pages that list it.
_Avoid_: public page, SEO page

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
A stub standing in for a page on another site, so that cross-graph links resolve. Its URL is not
ours, so it is never an indexable page.
_Avoid_: remote page, cross-graph stub
