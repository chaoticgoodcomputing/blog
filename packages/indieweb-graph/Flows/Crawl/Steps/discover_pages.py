"""Lists each seed's pages: its sitemaps' posts and pages, the latest first, its feeds' items, and its home page's."""
from __future__ import annotations

import logging
from urllib.parse import urlsplit

import pandas as pd
from flowthru import step

from Flows.Crawl.Steps.fetching import Fetcher
from Flows.Crawl.Steps.parsing import (
    content_sitemaps,
    feeds_in_html,
    home_pages,
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


def _from_home(fetcher: Fetcher, seed: str) -> list[tuple[str, str | None]]:
    response = fetcher.get(seed)
    return [(url, None) for url in home_pages(response.text, seed)] if response is not None else []


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
        # Its sitemaps' pages, the latest first; then its feeds' (its latest posts, which a sitemap
        # of only a few pages may not have); then its home page and the top-level pages it links to
        # (a guestbook, an about page), which neither may have: up to the limit, once each.
        listed = [(url, lastmod, "sitemap") for url, lastmod in newest_first(_from_sitemaps(fetcher, seed))]
        listed += [(url, None, "feed") for url, _ in _from_feeds(fetcher, seed)]
        listed += [(url, None, "home") for url, _ in _from_home(fetcher, seed)]
        seen, counts = set(), {"sitemap": 0, "feed": 0, "home": 0}
        for url, lastmod, listed_in in listed:
            if host_of(url) != site or url in seen or len(seen) >= limit:
                continue
            seen.add(url)
            counts[listed_in] += 1
            rows.append({"site": site, "url": url, "listed_in": listed_in, "lastmod": lastmod})
        logger.info(
            "%s: %d pages from its sitemaps, %d more from its feeds, %d more from its home page",
            site, counts["sitemap"], counts["feed"], counts["home"],
        )
    return pd.DataFrame(rows, columns=COLUMNS)
