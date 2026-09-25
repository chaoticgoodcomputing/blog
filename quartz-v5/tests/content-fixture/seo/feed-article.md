---
title: Feed Article
description: The newest public article, so it heads the feed.
tags:
  - feeds/rss
created: 2999-01-01T00:00:00Z
modified: 2999-01-01T00:00:00Z
published: 2999-01-01T00:00:00Z
---

A feed reader asks a site for its newest writing, and the site answers with a short list: a title, a link, a date and a few words about each piece. This page is the newest public article in the fixture, so it heads that list, and the specs read what the feed says about it.

Its description is written out in its frontmatter, so the feed uses it as it is, and adds how long the page takes to read. The body is long enough that the estimate is more than a minute: a little over five hundred words, read at two hundred words a minute, rounded up to the next whole minute.

The rest of this page is filler of an honest kind. It describes what the feed and the sitemap are for, so that the words are at least about something. A sitemap lists every page a site wants found, once, at the address the site prefers for it. It leaves out the pages that ask not to be indexed, because listing a page there is a request to index it. A feed is narrower: it carries only the writing, newest first, and only as many pieces as the site chooses to offer.

Tag pages belong in the sitemap. Each one gathers the pages under a topic, and a reader who searches for the topic may well want the gathering rather than any single page. A tag that only private pages carry is different: its page is a list of stubs, and search engines are better off not seeing it at all. The private tag's own page is the clearest case, since it lists nothing else.

A stub that stands in for a page on another site is left out of both. Its address belongs to that other site, and a crawler that followed it here would find only a pointer onward. The feed leaves it out for the same reason: it is not this site's writing.

Every entry in the feed names its topics, one category for each tag the page carries, written out in full with every level of the tag. A reader can filter on them. The date on each entry is the date the page was last changed, and the feed sorts by it, newest first, so that a reader sees fresh work at the top.

None of this is new. The site's first version did all of it, and this plugin carries it over, so that a subscriber notices nothing when the site moves to the next version of the tool that builds it. That is the whole point of parity: nothing a reader, a crawler or a feed relies on changes underneath them.

A few more sentences bring the count to where it needs to be. Reading time is a rough guide, not a promise, and nobody reads at exactly two hundred words a minute. Still, it is a useful hint to someone deciding whether to open a piece now or save it for later, and the old feed offered it, so the new one does too.
