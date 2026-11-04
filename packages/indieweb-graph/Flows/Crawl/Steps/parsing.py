"""What the crawl reads out of what it fetches: pure functions of text, so they test without a network."""
from __future__ import annotations

import re
import xml.etree.ElementTree as ET
from urllib.parse import urldefrag, urljoin, urlsplit, urlunsplit

from bs4 import BeautifulSoup

# A webmention's kind, from webmention.io's `wm-property`.
MENTION_KINDS = {
    "in-reply-to": "reply",
    "like-of": "like",
    "repost-of": "repost",
    "bookmark-of": "bookmark",
    "rsvp": "rsvp",
    "mention-of": "mention",
}

# A link's kind, from its microformats class (https://microformats.org/wiki/h-entry).
LINK_KINDS = {
    "u-in-reply-to": "reply",
    "u-like-of": "like",
    "u-repost-of": "repost",
    "u-bookmark-of": "bookmark",
}

# What a page is around its content, which links to everything on every page.
CHROME = ["nav", "header", "footer", "aside", "script", "style", "noscript", "form"]


def host_of(url: str) -> str:
    """A URL's host, lower case and without `www.`: who it belongs to, as the graph counts it."""
    host = (urlsplit(url).hostname or "").lower()
    return host[4:] if host.startswith("www.") else host


def _local(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def parse_sitemap(text: str) -> tuple[str, list[tuple[str, str | None]]]:
    """
    A sitemap's kind, `urlset` or `sitemapindex`, and its entries: each a page's address (or, in an
    index, another sitemap's) and when it last changed, where it says.
    """
    root = ET.fromstring(text.strip().encode())
    entries = []
    for entry in root:
        loc = lastmod = None
        for field in entry:
            if _local(field.tag) == "loc":
                loc = (field.text or "").strip()
            elif _local(field.tag) == "lastmod":
                lastmod = (field.text or "").strip() or None
        if loc:
            entries.append((loc, lastmod))
    return _local(root.tag), entries


def sitemaps_in_robots(text: str) -> list[str]:
    """The sitemaps a robots.txt names."""
    return [m.group(1).strip() for m in re.finditer(r"(?im)^\s*sitemap:\s*(\S+)", text)]


def feeds_in_html(html: str, base: str) -> list[str]:
    """The RSS and Atom feeds a page advertises with `rel="alternate"`."""
    soup = BeautifulSoup(html, "html.parser")
    feeds = []
    for link in soup.find_all("link", rel="alternate"):
        kind = (link.get("type") or "").lower()
        if ("rss" in kind or "atom" in kind) and link.get("href"):
            feeds.append(urljoin(base, link["href"]))
    return feeds


def parse_feed(text: str) -> list[str]:
    """The addresses of an RSS or Atom feed's items."""
    root = ET.fromstring(text.strip().encode())
    links = []
    for element in root.iter():
        name = _local(element.tag)
        if name == "item":
            for field in element:
                if _local(field.tag) == "link" and field.text:
                    links.append(field.text.strip())
        elif name == "entry":
            for field in element:
                if _local(field.tag) == "link" and field.get("rel", "alternate") == "alternate" and field.get("href"):
                    links.append(field.get("href").strip())
    return links


def content_of(soup: BeautifulSoup):
    """
    A page's content, without what is around it: its h-entry's `e-content`, or else its `article`,
    its `main` or its `body`.
    """
    root = (
        soup.select_one(".h-entry .e-content")
        or soup.select_one(".e-content")
        or soup.find("article")
        or soup.find("main")
        or soup.body
        or soup
    )
    for tag in root.find_all(CHROME):
        tag.decompose()
    return root


def links_in_content(html: str, page_url: str) -> list[dict]:
    """
    The links in a page's content to other hosts, once each: where they go, whose host that is,
    their kind, and their text.
    """
    soup = BeautifulSoup(html, "html.parser")
    site = host_of(page_url)
    seen: dict[str, dict] = {}
    for anchor in content_of(soup).find_all("a", href=True):
        target, _ = urldefrag(urljoin(page_url, anchor["href"].strip()))
        if urlsplit(target).scheme not in ("http", "https"):
            continue
        target_host = host_of(target)
        if not target_host or target_host == site:
            continue
        classes = anchor.get("class") or []
        kind = next((LINK_KINDS[c] for c in classes if c in LINK_KINDS), "link")
        text = " ".join(anchor.get_text(" ").split()) or None
        found = seen.get(target)
        # A link seen twice keeps the more telling kind: a reply over a plain link.
        if found is None or (found["kind"] == "link" and kind != "link"):
            seen[target] = {"target_url": target, "target_host": target_host, "kind": kind, "text": text}
    return list(seen.values())


def _bluesky_handle(url: str | None) -> str | None:
    """A Bluesky profile's or post's handle, where it is a domain of the author's own."""
    if not url:
        return None
    parts = urlsplit(url)
    match = re.match(r"^/profile/([^/]+)", parts.path)
    if host_of(url) != "bsky.app" or not match:
        return None
    handle = match.group(1).lower()
    if handle.startswith("did:") or handle.endswith(".bsky.social") or "." not in handle:
        return None
    return handle


def mention_targets(url: str) -> list[str]:
    """
    The addresses a page's webmentions may be kept under: its own, and its twin with or without a
    trailing slash, since webmention.io keeps each under the address its sender wrote.
    """
    parts = urlsplit(url)
    path = parts.path
    if path in ("", "/") or parts.query:
        return [url]
    if path.endswith("/"):
        twin = path.rstrip("/")
    elif "." in path.rsplit("/", 1)[-1]:
        return [url]
    else:
        twin = path + "/"
    return [url, urlunsplit(parts._replace(path=twin))]


def mention_rows(children: list[dict], target_site: str, target_url: str) -> list[dict]:
    """A page's webmentions, from webmention.io's JF2 `children`, as rows."""
    rows = []
    for child in children:
        source = child.get("url") or child.get("wm-source")
        if not source:
            continue
        via = child.get("wm-source")
        author = child.get("author") or {}
        source_host = (
            _bluesky_handle(source) or _bluesky_handle(author.get("url")) or host_of(source)
        )
        rows.append(
            {
                "target_site": target_site,
                "target_url": target_url,
                "source_url": source,
                "source_host": source_host,
                "via": via if via and via != source else None,
                "kind": MENTION_KINDS.get(child.get("wm-property", ""), "mention"),
                "author_name": author.get("name") or None,
                "author_url": author.get("url") or None,
                "published": child.get("published") or child.get("wm-received"),
            }
        )
    return rows


# Sitemaps of archives rather than posts: a WordPress site's tags, categories, authors and dates.
ARCHIVE_SITEMAP = re.compile(r"tag|categor|taxonom|author|user|archive|format|indieauth", re.I)


def sitemap_candidates(seed: str, named_in_robots: list[str]) -> list[str]:
    """
    Where a seed's sitemaps may be, most likely first, once each: those its robots.txt names, then
    the usual places under the seed's own path (a blog at `/blog/` keeps its sitemap there), then
    at its host's root.
    """
    parts = urlsplit(seed)
    origin = f"{parts.scheme}://{parts.netloc}"
    base = seed if seed.endswith("/") else seed + "/"
    candidates = [*named_in_robots]
    for root in dict.fromkeys([base, origin + "/"]):
        candidates += [urljoin(root, "sitemap.xml"), urljoin(root, "wp-sitemap.xml")]
    return list(dict.fromkeys(c for c in candidates if not c.endswith(".html")))


def content_sitemaps(entries: list[tuple[str, str | None]]) -> list[str]:
    """An index's sitemaps of posts and pages, posts first: never those of its archives."""
    kept = [loc for loc, _ in entries if not ARCHIVE_SITEMAP.search(urlsplit(loc).path.rsplit("/", 1)[-1])]
    return sorted(kept, key=lambda loc: 0 if "post" in loc.rsplit("/", 1)[-1] else 1)


def newest_first(pages: list[tuple[str, str | None]]) -> list[tuple[str, str | None]]:
    """Pages by when they last changed, the latest first, and those that don't say after, in order."""
    dated = sorted((p for p in pages if p[1]), key=lambda p: p[1], reverse=True)
    return dated + [p for p in pages if not p[1]]


def webmention_endpoint(html: str, link_header: str, base: str) -> str | None:
    """
    A page's webmention endpoint, as its `Link` header says, or else its first `rel="webmention"`
    `<link>` or `<a>` (https://www.w3.org/TR/webmention/#sender-discovers-receiver-webmention-endpoint).
    """
    for part in link_header.split(","):
        match = re.match(r'\s*<([^>]*)>\s*;(.*)', part)
        if match and re.search(r'rel="?[^"]*\bwebmention\b', match.group(2)):
            return urljoin(base, match.group(1))
    soup = BeautifulSoup(html, "html.parser")
    element = soup.find(["link", "a"], rel="webmention", href=True)
    return urljoin(base, element["href"]) if element is not None else None


def is_blocked(host: str, blocked: list[tuple[str, bool]]) -> bool:
    """
    Whether a host is on the blocklist, itself, or as a subdomain of a host on it whose subdomains
    are blocked too: each entry a host and whether its subdomains are.
    """
    return any(host == entry or (subdomains and host.endswith("." + entry)) for entry, subdomains in blocked)


def has_indieweb_signs(html: str, link_header: str, base: str) -> bool:
    """
    Whether a home page shows it is someone's IndieWeb site: it announces a webmention endpoint, or
    it has an h-card (https://microformats.org/wiki/h-card), whose author it says it is.
    """
    return webmention_endpoint(html, link_header, base) is not None or has_h_card(html)


def has_h_card(html: str) -> bool:
    """Whether a page has an h-card (https://microformats.org/wiki/h-card)."""
    return BeautifulSoup(html, "html.parser").select_one(".h-card") is not None


# A host name: dot-separated labels of letters, digits and hyphens, the last not all digits.
HOST_NAME = re.compile(r"^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z][a-z0-9-]*[a-z0-9]$")


def probe_candidates(counts: dict[str, int], seeds: set[str], blocked: list[tuple[str, bool]]) -> list[str]:
    """
    The hosts to probe, the most linked and mentioned first: every one the crawl saw but a seed's,
    those already blocked, and what a malformed link left that is no host name.
    """
    hosts = [
        host for host in counts
        if host and HOST_NAME.match(host) and host not in seeds and not is_blocked(host, blocked)
    ]
    return sorted(hosts, key=lambda host: (-counts[host], host))


# What a home page links to that is no page: a feed, a stylesheet, an image or a download.
NOT_A_PAGE = re.compile(r"\.(xml|rss|atom|json|css|js|png|jpe?g|gif|svg|webp|ico|pdf|zip)$", re.I)


def home_pages(html: str, home: str) -> list[str]:
    """
    A seed's home page and the top-level pages of its own it links to (`/guestbook/`, `/about`): the
    pages a sitemap or a feed may leave out, though they receive webmentions too. Once each, in order.
    """
    soup = BeautifulSoup(html, "html.parser")
    site = host_of(home)
    base = urlsplit(home).path.rstrip("/")
    pages = [home]
    for anchor in soup.find_all("a", href=True):
        target, _ = urldefrag(urljoin(home, anchor["href"].strip()))
        parts = urlsplit(target)
        if parts.scheme not in ("http", "https") or host_of(target) != site or parts.query:
            continue
        path = parts.path.rstrip("/")
        # One level under the seed's own path: `/blog/about` for a seed at `/blog/`.
        if not path.startswith(base + "/") or "/" in path[len(base) + 1:] or NOT_A_PAGE.search(path):
            continue
        pages.append(target)
    return list(dict.fromkeys(pages))
