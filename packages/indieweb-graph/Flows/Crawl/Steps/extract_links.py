"""Fetches each page, and lists the links in its content to other hosts."""
from __future__ import annotations

import logging

import pandas as pd
from flowthru import step

from Flows.Crawl.Steps.fetching import Fetcher
from Flows.Crawl.Steps.parsing import links_in_content

logger = logging.getLogger(__name__)

COLUMNS = ["source_site", "source_url", "target_url", "target_host", "kind", "text"]


@step(inputs=["PageSchema", "CrawlOptions"], outputs=["LinkSchema"])
def extract_links(pages: pd.DataFrame, options: dict) -> pd.DataFrame:
    fetcher = Fetcher(options)
    rows = []
    for index, page in enumerate(pages.itertuples(index=False), start=1):
        response = fetcher.get(page.url)
        if response is None or "html" not in response.headers.get("Content-Type", "html"):
            continue
        for link in links_in_content(response.text, page.url):
            rows.append({"source_site": page.site, "source_url": page.url, **link})
        if index % 50 == 0:
            logger.info("Read %d of %d pages", index, len(pages))
    logger.info("%d links out of %d pages", len(rows), len(pages))
    return pd.DataFrame(rows, columns=COLUMNS)
