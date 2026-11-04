# IndieWeb Graph

Who on the IndieWeb points at whom. Starting from a few sites, it crawls their pages for the links
in them and asks webmention.io for the webmentions they received, then makes a graph of sites of
both and says where each site sits in it. It stands alone: the blog neither uses it nor is used by
it.

A Flowthru project (https://github.com/chaoticgoodcomputing/flowthru): the Crawl flow's steps are
Python, which fetch; the Analysis flow's are C#, which count. Run them with Nx: `crawl`, then
`analyze`; `test` runs both languages' tests.

## Language

**Seed**:
A site a crawl starts from, by its home page's address, in `Data/_01_Raw/seeds.json`. Each
crawler keeps their own, uncommitted; `seeds.sample.json` is the committed example, which `setup`
copies where there is none.
_Avoid_: root, start

**Site**:
Whoever a host belongs to: the host, lower case and without `www.`. Every page of it is the site's.
_Avoid_: domain (a site may be a subdomain)

**Page**:
A page of a seed, as its sitemap lists it, or where it has none, its feed.

**Link**:
A link in a page's content (its `e-content`, `article` or `main`, never its navigation) to another
site. Its kind is its microformats class's: a reply, like, repost or bookmark, or a plain link.

**Mention**:
A webmention a page received, as webmention.io has it: who sent it and its kind. A Bluesky post's
author whose handle is a domain is credited to that domain. A site whose endpoint isn't
webmention.io has none here.
_Avoid_: backlink (a link the target only learns of by crawling)

**Blocklist**:
Hosts known not to accept webmentions, kept by hand in `Data/_01_Raw/blocklist.csv`: platforms,
such as social networks, code hosts and encyclopedias, rather than someone's site. A host on it
and its subdomains are no site of the graph.
_Avoid_: platform list, ignore list

**Edge**:
How often one site points at another, by kind and by where it was seen: as a link, crawled from the
pointing site, or as a webmention, received by the other.

**Site summary**:
A site's place in the graph: how much it points at others and they at it, how many sites it is
connected to, and how many of those it is mutual with, pointing both ways.

## Data

`Data/_00_Cache` holds the crawl's HTTP cache, `_01_Raw` the seeds, the blocklist and what it fetched,
`_02_Primary` the edges and `_03_Reporting` the summary. Only the blocklist and the sample seeds are committed.
