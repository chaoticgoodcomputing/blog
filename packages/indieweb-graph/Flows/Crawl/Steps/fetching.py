"""The crawl's one way to fetch: cached on disk, throttled per host, and within what robots.txt allows."""
from __future__ import annotations

import logging
import time
from datetime import timedelta
from pathlib import Path
from urllib.parse import urlsplit
from urllib.robotparser import RobotFileParser

import requests_cache

logger = logging.getLogger(__name__)


class Fetcher:
    """
    Fetches for a crawl, by its CrawlOptions. A response comes from the HTTP cache where it has one
    younger than CacheHours, and only a request the cache can't answer waits its turn at the host.
    """

    def __init__(self, options: dict):
        cache = Path(options["CachePath"])
        cache.parent.mkdir(parents=True, exist_ok=True)
        self.session = requests_cache.CachedSession(
            str(cache),
            backend="sqlite",
            expire_after=timedelta(hours=options["CacheHours"]),
            allowable_codes=(200, 404, 410),
        )
        self.session.headers["User-Agent"] = options["UserAgent"]
        self.delay = float(options["DelaySeconds"])
        self.user_agent = options["UserAgent"]
        self._last: dict[str, float] = {}
        self._robots: dict[str, RobotFileParser] = {}

    def cached(self, url: str) -> bool:
        """Whether the HTTP cache can answer for a URL, with no request to its host."""
        return self.session.cache.contains(url=url)

    def _wait_for(self, url: str) -> None:
        if self.cached(url):
            return
        host = urlsplit(url).netloc
        wait = self._last.get(host, 0) + self.delay - time.monotonic()
        if wait > 0:
            time.sleep(wait)
        self._last[host] = time.monotonic()

    def _raw(self, url: str):
        self._wait_for(url)
        try:
            response = self.session.get(url, timeout=30)
        except Exception as error:  # noqa: BLE001 - a site that can't be reached is skipped, not fatal
            logger.warning("Couldn't fetch %s: %s", url, error)
            return None
        return response

    def allowed(self, url: str) -> bool:
        parts = urlsplit(url)
        origin = f"{parts.scheme}://{parts.netloc}"
        robots = self._robots.get(origin)
        if robots is None:
            robots = RobotFileParser()
            response = self._raw(f"{origin}/robots.txt")
            robots.parse(response.text.splitlines() if response is not None and response.ok else [])
            self._robots[origin] = robots
        return robots.can_fetch(self.user_agent, url)

    def get(self, url: str, *, check_robots: bool = True):
        """The response for a URL, or None where it can't be had or robots.txt disallows it."""
        if check_robots and not self.allowed(url):
            logger.info("robots.txt disallows %s", url)
            return None
        response = self._raw(url)
        if response is None or not response.ok:
            if response is not None:
                logger.info("%s answered %s", url, response.status_code)
            return None
        return response
