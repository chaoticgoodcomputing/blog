"""
Finds each page's received webmentions. A site whose endpoint is webmention.io's, as its first page
says, has them asked of webmention.io; a site with an endpoint of its own keeps them itself, and
they are read from what each of its pages shows of them, its comments (`mentions_on_page`). The
pages were fetched already, by ExtractLinks, so the HTTP cache answers for them.
"""
from __future__ import annotations

import logging
from urllib.parse import urlencode, urlsplit

import pandas as pd
from flowthru import step

from Flows.Crawl.Steps.fetching import Fetcher
from Flows.Crawl.Steps.parsing import (
    host_of,
    mention_rows,
    mention_targets,
    mentions_on_page,
    webmention_endpoint,
    webmention_io_account,
)

logger = logging.getLogger(__name__)

COLUMNS = [
    "target_site", "target_url", "source_url", "source_host", "via",
    "kind", "author_name", "author_url", "published",
]
API = "https://webmention.io/api/mentions.jf2"
PER_PAGE = 100


@step(inputs=["PageSchema", "CrawlOptions"], outputs=["MentionSchema"])
def fetch_mentions(pages: pd.DataFrame, options: dict) -> pd.DataFrame:
    fetcher = Fetcher(options)
    on_webmention_io = {}
    own_endpoint = {}
    aliases: dict[str, tuple[str, ...]] = {}
    for site, first in pages.groupby("site", sort=False)["url"].first().items():
        response = fetcher.get(first)
        endpoint = webmention_endpoint(response.text, response.headers.get("Link", ""), first) if response is not None else None
        on_webmention_io[site] = endpoint is not None and host_of(endpoint) == "webmention.io"
        own_endpoint[site] = endpoint is not None and not on_webmention_io[site]
        # The site's other name, where its account is named after one: its mentions may be kept
        # under that.
        account = webmention_io_account(endpoint)
        aliases[site] = (account,) if account and account != urlsplit(first).netloc else ()
        logger.info("%s: webmention endpoint %s", site, endpoint or "none")
    rows = []
    for page in pages.itertuples(index=False):
        if own_endpoint[page.site]:
            response = fetcher.get(page.url)
            if response is not None and "html" in response.headers.get("Content-Type", "html"):
                rows.extend(mentions_on_page(response.text, page.site, page.url))
            continue
        if not on_webmention_io[page.site]:
            continue
        seen = set()
        for target in mention_targets(page.url, aliases[page.site]):
            for row in _mentions_of(fetcher, target, page):
                if row["source_url"] not in seen:
                    seen.add(row["source_url"])
                    rows.append(row)
    logger.info("%d webmentions to %d pages", len(rows), len(pages))
    return pd.DataFrame(rows, columns=COLUMNS)


def _mentions_of(fetcher: Fetcher, target: str, page) -> list[dict]:
    """Every webmention webmention.io keeps under one address, a page at a time."""
    rows = []
    number = 0
    while True:
        query = urlencode({"target": target, "per-page": PER_PAGE, "page": number})
        response = fetcher.get(f"{API}?{query}", check_robots=False)
        if response is None:
            return rows
        children = response.json().get("children", [])
        rows.extend(mention_rows(children, page.site, page.url))
        if len(children) < PER_PAGE:
            return rows
        number += 1
