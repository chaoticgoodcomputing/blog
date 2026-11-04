"""Lists each seed's pages: its sitemaps' posts and pages, the latest first, and its feeds' items."""
from __future__ import annotations

import logging
from urllib.parse import urlsplit

import pandas as pd
from flowthru import step

from Flows.Crawl.Steps.fetching import Fetcher
from Flows.Crawl.Steps.parsing import (
    content_sitemaps,
    feeds_in_html,
    host_of,
    newest_first,
    parse_feed,
    parse_sitemap,
    sitemap_candidates,
    sitemaps_in_robots,
)

logger = logging.getLogger(__name__)

COLUMNS = ["site", "url", "listed_in", "lastmod"]


def _from_sitemaps(fetcher: Fetcher, seed: str) -> list[tuple[str, str | None]]:
    origin = "{0.scheme}://{0.netloc}".format(urlsplit(seed))
    robots = fetcher.get(f"{origin}/robots.txt", check_robots=False)
    queue = sitemap_candidates(seed, sitemaps_in_robots(robots.text) if robots is not None else [])
    seen, pages = set(), []
    while queue:
        address = queue.pop(0)
        if address in seen:
            continue
        seen.add(address)
        response = fetcher.get(address)
        if response is None:
            continue
        try:
            kind, entries = parse_sitemap(response.text)
        except Exception:  # noqa: BLE001 - not a sitemap after all
            continue
        if kind == "sitemapindex":
            queue = content_sitemaps(entries) + queue
        else:
            pages.extend(entries)
    return pages


def _from_feeds(fetcher: Fetcher, seed: str) -> list[tuple[str, str | None]]:
    response = fetcher.get(seed)
    if response is None:
        return []
    pages = []
    for feed in feeds_in_html(response.text, seed):
        if "comments" in feed:
            continue
        listed = fetcher.get(feed)
        if listed is not None:
            try:
                pages.extend((link, None) for link in parse_feed(listed.text))
            except Exception:  # noqa: BLE001 - not a feed after all
                continue
    return pages


@step(inputs=["SeedSchema", "CrawlOptions"], outputs=["PageSchema"])
def discover_pages(seeds: pd.DataFrame, options: dict) -> pd.DataFrame:
    fetcher = Fetcher(options)
    limit = int(options["MaxPagesPerSite"])
    rows = []
    for seed in seeds["url"]:
        site = host_of(seed)
        # Its sitemaps' pages, the latest first, then its feeds' (its latest posts, which a sitemap
        # of only a few pages may not have): up to the limit, once each.
        listed = [(url, lastmod, "sitemap") for url, lastmod in newest_first(_from_sitemaps(fetcher, seed))]
        listed += [(url, None, "feed") for url, _ in _from_feeds(fetcher, seed)]
        seen, counts = set(), {"sitemap": 0, "feed": 0}
        for url, lastmod, listed_in in listed:
            if host_of(url) != site or url in seen or len(seen) >= limit:
                continue
            seen.add(url)
            counts[listed_in] += 1
            rows.append({"site": site, "url": url, "listed_in": listed_in, "lastmod": lastmod})
        logger.info("%s: %d pages from its sitemaps, %d more from its feeds", site, counts["sitemap"], counts["feed"])
    return pd.DataFrame(rows, columns=COLUMNS)
