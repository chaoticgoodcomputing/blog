"""
Asks webmention.io for each page's received webmentions: only of a site whose endpoint is
webmention.io's, as its first page says. Another endpoint's are kept by the site itself.
"""
from __future__ import annotations

import logging
from urllib.parse import urlencode

import pandas as pd
from flowthru import step

from Flows.Crawl.Steps.fetching import Fetcher
from Flows.Crawl.Steps.parsing import host_of, mention_rows, webmention_endpoint

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
    for site, first in pages.groupby("site", sort=False)["url"].first().items():
        response = fetcher.get(first)
        endpoint = webmention_endpoint(response.text, response.headers.get("Link", ""), first) if response is not None else None
        on_webmention_io[site] = endpoint is not None and host_of(endpoint) == "webmention.io"
        logger.info("%s: webmention endpoint %s", site, endpoint or "none")
    rows = []
    for page in pages.itertuples(index=False):
        if not on_webmention_io[page.site]:
            continue
        number = 0
        while True:
            query = urlencode({"target": page.url, "per-page": PER_PAGE, "page": number})
            response = fetcher.get(f"{API}?{query}", check_robots=False)
            if response is None:
                break
            children = response.json().get("children", [])
            rows.extend(mention_rows(children, page.site, page.url))
            if len(children) < PER_PAGE:
                break
            number += 1
    logger.info("%d webmentions to %d pages", len(rows), len(pages))
    return pd.DataFrame(rows, columns=COLUMNS)
