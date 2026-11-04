"""
Probes the hosts the crawl saw, by their home pages, and records what each showed in the hosts
list: its webmention endpoint, if it announces one, and whether it has an h-card. Adds to the
blocklist each one that shows no sign of being someone's IndieWeb site: no endpoint and no h-card,
or a robots.txt that forbids its home page. The seeds are probed too, at their own addresses, every
run, and never blocked. Writes both lists back whole, so that the next run starts from them.
"""
from __future__ import annotations

import logging
from collections import Counter
from datetime import date

import pandas as pd
from flowthru import step

from Flows.Crawl.Steps.fetching import Fetcher
from Flows.Crawl.Steps.parsing import has_h_card, host_of, probe_candidates, webmention_endpoint

logger = logging.getLogger(__name__)


def _home(fetcher: Fetcher, host: str) -> tuple[object | None, bool]:
    """
    A host's home page, at its bare host or else at `www.`, and whether robots.txt forbids both:
    (None, False) where neither answers.
    """
    forbidden = True
    for address in (f"https://{host}/", f"https://www.{host}/"):
        if not fetcher.allowed(address):
            continue
        forbidden = False
        response = fetcher.get(address, check_robots=False)
        if response is not None:
            return response, False
    return None, forbidden


HOST_COLUMNS = ["host", "endpoint", "h_card", "probed"]
BLOCK_COLUMNS = ["host", "subdomains", "note"]


def _signs(response) -> tuple[str | None, bool]:
    """A home page's webmention endpoint, or None, and whether it has an h-card."""
    endpoint = webmention_endpoint(response.text, response.headers.get("Link", ""), response.url)
    return endpoint, has_h_card(response.text)


@step(
    inputs=["LinkSchema", "MentionSchema", "SeedSchema", "BlockedHostSchema", "HostSchema", "CrawlOptions"],
    outputs=["BlockedHostSchema", "HostSchema"],
)
def probe_hosts(
    links: pd.DataFrame,
    mentions: pd.DataFrame,
    seeds: pd.DataFrame,
    blocklist: pd.DataFrame,
    hosts: pd.DataFrame,
    options: dict,
) -> tuple[pd.DataFrame, pd.DataFrame]:
    fetcher = Fetcher(options)
    today = date.today().isoformat()
    known = {row["host"]: row for row in hosts[HOST_COLUMNS].to_dict("records")}

    # The seeds, at their own addresses: a blog under a path announces its endpoint there.
    seed_hosts = set()
    for url in seeds["url"]:
        host = host_of(url)
        seed_hosts.add(host)
        response = fetcher.get(url)
        if response is not None:
            endpoint, h_card = _signs(response)
            known[host] = {"host": host, "endpoint": endpoint, "h_card": h_card, "probed": today}

    blocked = [(str(host).strip().lower(), bool(subdomains)) for host, subdomains in zip(blocklist["host"], blocklist["subdomains"])]
    counts = Counter(links["target_host"]) + Counter(mentions["source_host"])
    candidates = [host for host in probe_candidates(counts, seed_hosts, blocked) if host not in known]
    # Only a probe the HTTP cache can't answer counts against the limit: one an earlier run made,
    # before hosts were recorded, is recorded again for nothing.
    limit = int(options["MaxProbesPerRun"])
    fetched, probed, added = 0, 0, []
    for host in candidates:
        if fetched >= limit:
            break
        if not (fetcher.cached(f"https://{host}/") or fetcher.cached(f"https://www.{host}/")):
            fetched += 1
        probed += 1
        response, forbidden = _home(fetcher, host)
        # Its own host only, either way: a probe saw nothing of its subdomains, which may be
        # members' own sites.
        if forbidden:
            # A personal site hardly ever shuts crawlers out of its home page; a platform does.
            known[host] = {"host": host, "endpoint": None, "h_card": False, "probed": today}
            added.append({"host": host, "subdomains": False, "note": f"robots.txt forbids its home page (probed {today})"})
            continue
        if response is None:
            # One that can't be reached may be down for now: it is probed again next run.
            continue
        endpoint, h_card = _signs(response)
        known[host] = {"host": host, "endpoint": endpoint, "h_card": h_card, "probed": today}
        if endpoint is None and not h_card:
            added.append({"host": host, "subdomains": False, "note": f"no webmention endpoint or h-card (probed {today})"})
    logger.info(
        "Probed %d of %d hosts not yet recorded (%d not in the cache): %d blocked, %d left for later runs",
        probed, len(candidates), fetched, len(added), len(candidates) - probed,
    )
    blocklist = pd.concat([blocklist[BLOCK_COLUMNS], pd.DataFrame(added, columns=BLOCK_COLUMNS)], ignore_index=True)
    recorded = pd.DataFrame(sorted(known.values(), key=lambda row: row["host"]), columns=HOST_COLUMNS)
    return blocklist, recorded
