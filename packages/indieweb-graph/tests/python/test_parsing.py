from Flows.Crawl.Steps.parsing import (
    feeds_in_html,
    host_of,
    links_in_content,
    mention_rows,
    parse_feed,
    parse_sitemap,
    sitemaps_in_robots,
)


def test_a_host_is_lower_case_and_without_www():
    assert host_of("https://WWW.Example.com/a?b") == "example.com"
    assert host_of("https://blog.example.com") == "blog.example.com"


def test_a_sitemap_lists_its_pages_and_an_index_its_sitemaps():
    urlset = """<?xml version="1.0"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url><loc>https://a.example/one</loc><lastmod>2024-01-01</lastmod></url>
      <url><loc> https://a.example/two </loc></url>
    </urlset>"""
    assert parse_sitemap(urlset) == ("urlset", [("https://a.example/one", "2024-01-01"), ("https://a.example/two", None)])
    index = """<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <sitemap><loc>https://a.example/sitemap-0.xml</loc></sitemap></sitemapindex>"""
    assert parse_sitemap(index) == ("sitemapindex", [("https://a.example/sitemap-0.xml", None)])


def test_robots_txt_names_its_sitemaps():
    assert sitemaps_in_robots("User-agent: *\nAllow: /\n\nSitemap: https://a.example/sitemap.xml\n") == [
        "https://a.example/sitemap.xml"
    ]


def test_a_page_advertises_its_feeds_and_a_feed_lists_its_items():
    html = '<head><link rel="alternate" type="application/rss+xml" href="/rss.xml"><link rel="alternate" hreflang="fr" href="/fr"></head>'
    assert feeds_in_html(html, "https://a.example/") == ["https://a.example/rss.xml"]
    rss = "<rss><channel><item><link>https://a.example/one</link></item></channel></rss>"
    atom = '<feed xmlns="http://www.w3.org/2005/Atom"><entry><link rel="alternate" href="https://a.example/two"/><link rel="replies" href="x"/></entry></feed>'
    assert parse_feed(rss) == ["https://a.example/one"]
    assert parse_feed(atom) == ["https://a.example/two"]


def test_a_pages_links_are_its_contents_to_other_hosts_once_each_with_their_kind():
    html = """<body>
      <nav><a href="https://nav.example/">Everywhere</a></nav>
      <article>
        <a href="/local">Own page</a>
        <a href="https://www.b.example/post#part">B's post</a>
        <a class="u-in-reply-to" href="https://b.example/post">In reply</a>
        <a href="https://c.example/">C</a>
        <a href="mailto:me@a.example">Mail</a>
      </article>
      <footer><a href="https://footer.example/">Footer</a></footer>
    </body>"""
    links = links_in_content(html, "https://a.example/page")
    assert [(link["target_url"], link["target_host"], link["kind"]) for link in links] == [
        ("https://www.b.example/post", "b.example", "link"),
        ("https://b.example/post", "b.example", "reply"),
        ("https://c.example/", "c.example", "link"),
    ]


def test_an_h_entrys_content_is_its_e_content():
    html = '<div class="h-entry"><a href="https://side.example">Side</a><div class="e-content"><a href="https://in.example">In</a></div></div>'
    assert [link["target_host"] for link in links_in_content(html, "https://a.example/")] == ["in.example"]


def test_a_webmention_is_its_source_and_kind_and_a_bluesky_one_its_authors_own_domain():
    children = [
        {"url": "https://d.example/reply", "wm-source": "https://d.example/reply", "wm-property": "in-reply-to",
         "author": {"name": "D", "url": "https://d.example/"}, "published": "2024-02-01T00:00:00Z"},
        {"url": "https://bsky.app/profile/e.example/post/3k", "wm-source": "https://brid.gy/comment/bluesky/x",
         "wm-property": "like-of", "author": {"url": "https://bsky.app/profile/e.example"}, "wm-received": "2024-03-01T00:00:00Z"},
        {"url": "https://bsky.app/profile/f.bsky.social/post/3k", "wm-property": "mention-of"},
        {"wm-property": "like-of"},
    ]
    rows = mention_rows(children, "a.example", "https://a.example/page")
    assert [(r["source_host"], r["kind"], r["via"], r["published"]) for r in rows] == [
        ("d.example", "reply", None, "2024-02-01T00:00:00Z"),
        ("e.example", "like", "https://brid.gy/comment/bluesky/x", "2024-03-01T00:00:00Z"),
        ("bsky.app", "mention", None, None),
    ]


from Flows.Crawl.Steps.parsing import content_sitemaps, newest_first, sitemap_candidates, webmention_endpoint


def test_a_seeds_sitemaps_are_its_robots_then_under_its_path_then_at_its_root():
    assert sitemap_candidates("https://a.example/blog/", ["https://a.example/map.xml", "https://a.example/map.html"]) == [
        "https://a.example/map.xml",
        "https://a.example/blog/sitemap.xml",
        "https://a.example/blog/wp-sitemap.xml",
        "https://a.example/sitemap.xml",
        "https://a.example/wp-sitemap.xml",
    ]


def test_an_indexs_sitemaps_are_its_posts_then_its_pages_never_its_archives():
    entries = [(f"https://a.example/{name}", None) for name in [
        "page-sitemap.xml", "post_tag-sitemap2.xml", "post-sitemap.xml", "category-sitemap.xml",
        "wp-sitemap-posts-post-1.xml", "wp-sitemap-taxonomies-post_tag-1.xml", "wp-sitemap-users-1.xml", "archives-sitemap.xml",
    ]]
    assert content_sitemaps(entries) == [
        "https://a.example/post-sitemap.xml", "https://a.example/wp-sitemap-posts-post-1.xml", "https://a.example/page-sitemap.xml",
    ]


def test_pages_are_the_latest_changed_first_and_the_undated_after():
    assert newest_first([("a", "2020-01-01"), ("b", None), ("c", "2024-01-01")]) == [("c", "2024-01-01"), ("a", "2020-01-01"), ("b", None)]


def test_a_pages_webmention_endpoint_is_its_link_headers_or_else_its_html():
    header = '<https://a.example/micropub>; rel="micropub", <https://webmention.io/a.example/webmention>; rel="webmention"'
    assert webmention_endpoint("", header, "https://a.example/") == "https://webmention.io/a.example/webmention"
    html = '<link rel="stylesheet" href="webmention.css"><link rel="webmention" href="/wp-json/webmention/1.0/endpoint">'
    assert webmention_endpoint(html, "", "https://a.example/post") == "https://a.example/wp-json/webmention/1.0/endpoint"
    assert webmention_endpoint("<p>none</p>", "", "https://a.example/") is None


from Flows.Crawl.Steps.parsing import has_indieweb_signs, is_blocked, probe_candidates


def test_a_host_is_blocked_as_itself_or_a_subdomain_of_one_whose_subdomains_are():
    blocked = [("wikipedia.org", True), ("micro.blog", False)]
    assert is_blocked("en.wikipedia.org", blocked)
    assert is_blocked("wikipedia.org", blocked)
    assert not is_blocked("notwikipedia.org", blocked)
    # A probed host's subdomains may be its members' own sites.
    assert is_blocked("micro.blog", blocked)
    assert not is_blocked("someone.micro.blog", blocked)


def test_an_indieweb_site_announces_an_endpoint_or_has_an_h_card():
    assert has_indieweb_signs('<link rel="webmention" href="/wm">', "", "https://a.example/")
    assert has_indieweb_signs('<div class="h-card p-author">A</div>', "", "https://a.example/")
    assert has_indieweb_signs("", '<https://webmention.io/a/webmention>; rel="webmention"', "https://a.example/")
    assert not has_indieweb_signs('<div class="card">News</div>', "", "https://news.example/")


def test_the_hosts_to_probe_are_the_most_seen_first_never_a_seed_or_one_blocked():
    counts = {"b.example": 3, "seed.example": 9, "en.wikipedia.org": 5, "c.example": 7, "": 1}
    assert probe_candidates(counts, {"seed.example"}, [("wikipedia.org", True)]) == ["c.example", "b.example"]


from Flows.Crawl.Steps.parsing import home_pages


def test_a_home_page_lists_itself_and_its_own_top_level_pages():
    html = """
      <a href="/guestbook/">Guestbook</a> <a href="/about">About</a> <a href="/about#me">Me</a>
      <a href="/2024/01/post">A post</a> <a href="/feed.xml">Feed</a> <a href="/?page=2">Older</a>
      <a href="https://other.example/">Elsewhere</a> <a href="https://www.a.example/now">Now</a>
    """
    assert home_pages(html, "https://a.example/") == [
        "https://a.example/", "https://a.example/guestbook/", "https://a.example/about", "https://www.a.example/now",
    ]


def test_a_seed_under_a_path_lists_the_pages_under_it():
    html = '<a href="/blog/about/">About</a> <a href="/shop">Shop</a>'
    assert home_pages(html, "https://a.example/blog/") == ["https://a.example/blog/", "https://a.example/blog/about/"]


def test_mention_targets_are_a_page_and_its_slash_twin():
    from Flows.Crawl.Steps.parsing import mention_targets
    assert mention_targets("https://a.example/guestbook") == ["https://a.example/guestbook", "https://a.example/guestbook/"]
    assert mention_targets("https://a.example/post/") == ["https://a.example/post/", "https://a.example/post"]
    assert mention_targets("https://a.example/") == ["https://a.example/"]
    assert mention_targets("https://a.example/feed.xml") == ["https://a.example/feed.xml"]
    assert mention_targets("https://a.example/p?id=1") == ["https://a.example/p?id=1"]


def test_probe_candidates_leave_out_what_is_no_host_name():
    counts = {"a.example": 2, "why i went back to work https": 1, "localhost": 1, "10.0.0.1": 1, "b-c.example": 1}
    assert probe_candidates(counts, set(), []) == ["a.example", "b-c.example"]


def test_mention_targets_at_another_name_of_the_site():
    from Flows.Crawl.Steps.parsing import mention_targets
    assert mention_targets("https://a.example/post", ("www.a.example",)) == [
        "https://a.example/post",
        "https://a.example/post/",
        "https://www.a.example/post",
        "https://www.a.example/post/",
    ]
    assert mention_targets("https://a.example/post", ("a.example",)) == ["https://a.example/post", "https://a.example/post/"]


def test_a_webmention_io_account_named_after_a_domain():
    from Flows.Crawl.Steps.parsing import webmention_io_account
    assert webmention_io_account("https://webmention.io/www.swyx.io/webmention") == "www.swyx.io"
    assert webmention_io_account("https://webmention.io/aaronpk/webmention") is None
    assert webmention_io_account("https://adactio.com/webmention") is None
    assert webmention_io_account(None) is None


TON_COMMENTS = """
<ol>
<li class="comment h-entry h-cite p-comment"><article class="comment"><footer>
  <address class="comment-author p-author h-card"><cite class="p-name"><a class="u-url" href="https://blog.frank.example">Frank</a></cite></address>
  <a href="https://ton.example/post/#comment-1"><time class="dt-published" datetime="2026-11-02T07:55:55+01:00">2 Nov</time></a>
</footer></article></li>
<li class="mention p-mention h-cite avatar-only h-entry p-comment comment"><div class="comment-body">
  <span class="p-author h-card"><a class="u-url" href="https://ana.example/blog/a-post/">Ana</a></span>
</div></li>
<li class="like p-like h-cite avatar-only h-entry"><span class="p-author h-card"><a class="u-url" href="https://mastodon.example/@b/1">B</a></span></li>
</ol>
"""

CHRIS_COMMENT = """
<article class="comment-body h-cite p-comment"><footer class="comment-meta">
  <div class="comment-author vcard h-card u-author"><b class="fn"><a class="url" href="https://jo.example/">Jo</a></b></div>
  <div class="comment-metadata"><a class="u-url" href="https://jo.example/2025/reply"><time class="dt-published" datetime="2025-06-23T12:47:18-07:00">June</time></a></div>
</footer><div class="comment-content e-content">Nice.</div></article>
<div class="h-cite u-bookmark-of"><a class="u-url" href="https://elsewhere.example/read">what Chris read</a></div>
"""

JEREMY_COMMENTS = """
<details class="p-comment h-entry"><summary><h3 class="p-name">2 Likes</h3></summary>
  <p class="meta">Liked by <cite class="h-card p-author"><a class="u-url p-name" href="https://bsky.app/profile/x/post/1#liked_by_a">A</a></cite></p>
  <p class="meta">Liked by <cite class="h-card p-author"><a class="u-url p-name" href="https://bsky.app/profile/x/post/1#liked_by_b">B</a></cite></p>
</details>
<article class="p-comment h-entry"><h3><a class="p-name u-url" href="https://will.example/blog/ranking">William</a></h3></article>
"""


def test_mentions_shown_on_a_page_are_read_from_its_comments():
    from Flows.Crawl.Steps.parsing import mentions_on_page
    rows = mentions_on_page(TON_COMMENTS, "ton.example", "https://ton.example/post/")
    # The plain comment names only its author's home page: no source post, so none.
    assert [(r["source_url"], r["kind"]) for r in rows] == [
        ("https://ana.example/blog/a-post/", "mention"),
        ("https://mastodon.example/@b/1", "like"),
    ]
    assert rows[0]["target_url"] == "https://ton.example/post/" and rows[0]["via"] == "page"
    assert rows[0]["source_host"] == "ana.example"


def test_a_comments_own_url_is_its_source_and_a_citation_is_no_comment():
    from Flows.Crawl.Steps.parsing import mentions_on_page
    rows = mentions_on_page(CHRIS_COMMENT, "chris.example", "https://chris.example/p")
    assert [(r["source_url"], r["kind"], r["author_url"], r["published"]) for r in rows] == [
        ("https://jo.example/2025/reply", "reply", "https://jo.example/", "2025-06-23T12:47:18-07:00"),
    ]


def test_a_group_of_likes_is_a_mention_each():
    from Flows.Crawl.Steps.parsing import mentions_on_page
    rows = mentions_on_page(JEREMY_COMMENTS, "jeremy.example", "https://jeremy.example/journal/1")
    assert [(r["source_url"], r["kind"]) for r in rows] == [
        ("https://bsky.app/profile/x/post/1#liked_by_a", "like"),
        ("https://bsky.app/profile/x/post/1#liked_by_b", "like"),
        ("https://will.example/blog/ranking", "reply"),
    ]
