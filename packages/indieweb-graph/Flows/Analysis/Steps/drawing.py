"""
Draws the mention graph, blog to blog: lays it out once, and writes it as the blog's widget reads
it and as an SVG of the same picture. Each blog is a node at a fixed place, sized by how much it
mentions and is mentioned; each pair of blogs one way is a link, coloured by its direction from a
seed's point of view: out of a seed, or into one, or mutual, where the pair mention each other both
ways. Pure: export_graph.py is the step.
"""
from __future__ import annotations

import math
from datetime import date
from html import escape
from urllib.parse import urlsplit

import networkx as nx
import pandas as pd

WIDTH, HEIGHT, MARGIN = 960, 760, 48
# How long a laid-out graph is the same graph: the layout is seeded, so a run with the same data
# draws the same picture.
LAYOUT_SEED = 7

# Colours, as the widget's CSS names them too. The two directions are checked for colour-blind
# separation against the site's light and dark backgrounds.
STYLE = """
svg { --surface: #faf8f8; --ink: #2b2b2b; --muted: #4e4e4e; --rule: #b8b8b8; --node: #b8b8b8;
  --seed: #2b2b2b; --utility: #2b2b2b; --out: #2a78d6; --in: #eb6834; --mutual: #2b2b2b; }
@media (prefers-color-scheme: dark) {
  svg { --surface: #161618; --ink: #ebebec; --muted: #d4d4d4; --rule: #646464; --node: #646464;
    --seed: #ebebec; --utility: #ebebec; --out: #3987e5; --in: #d95926; --mutual: #ebebec; }
}
.surface { fill: var(--surface); }
.link { fill: none; stroke-linecap: round; opacity: 0.7; }
.link.out { stroke: var(--out); } .link.in { stroke: var(--in); } .link.mutual { stroke: var(--mutual); }
.arrow.out { fill: var(--out); } .arrow.in { fill: var(--in); } .arrow.mutual { fill: var(--mutual); }
.node { fill: var(--node); stroke: var(--surface); stroke-width: 1.5; }
.node.seed { fill: var(--seed); }
.node.utility { fill: var(--utility); }
text { font-family: system-ui, sans-serif; fill: var(--muted); font-size: 11px;
  paint-order: stroke; stroke: var(--surface); stroke-width: 3px; stroke-linejoin: round; }
text.seed { fill: var(--ink); font-size: 13px; font-weight: 600; }
text.utility { fill: var(--ink); font-size: 13px; font-style: italic; }
.legend text { font-size: 12px; }
""".strip()


def host_of(url: str) -> str:
    return urlsplit(url).hostname or ""


def blog_links(mentions: pd.DataFrame) -> pd.DataFrame:
    """
    Post mentions, one row per pair of blogs one way: how many, of which kinds, and the post
    mentions themselves, each the mentioning post, the mentioned one, its kind and where it was seen.
    """
    pairs = mentions.assign(source_blog=mentions["source"].map(host_of), target_blog=mentions["target"].map(host_of))
    rows = []
    for (source, target), group in pairs.groupby(["source_blog", "target_blog"], sort=True):
        ordered = group.sort_values(["source", "target"])
        rows.append({
            "source": source,
            "target": target,
            "count": len(group),
            "kinds": {kind: int(n) for kind, n in sorted(group["kind"].value_counts().items())},
            "mentions": [
                {"source": row["source"], "target": row["target"], "kind": row["kind"], "seen_as": row["seen_as"]}
                for row in ordered.to_dict("records")
            ],
        })
    return pd.DataFrame(rows, columns=["source", "target", "count", "kinds", "mentions"])


def direction(source: str, target: str, seeds: set[str], mutual: bool = False) -> str:
    """
    A link's direction: `mutual` where the pair mention each other both ways, each way still its own
    link; else from a seed's point of view, `out` of one or `in` to one. One way between two seeds,
    it is the mentioning one's: out.
    """
    if mutual:
        return "mutual"
    return "out" if source in seeds else "in"


def graph_links(links: pd.DataFrame, seeds: set[str]) -> list[dict]:
    """The links the map draws: each pair of blogs one way, with its direction (`direction`)."""
    pairs = set(zip(links["source"], links["target"]))
    return [
        {
            "source": row["source"],
            "target": row["target"],
            "count": int(row["count"]),
            "kinds": row["kinds"],
            "direction": direction(row["source"], row["target"], seeds, (row["target"], row["source"]) in pairs),
            "mentions": row["mentions"],
        }
        for row in links.to_dict("records")
    ]


def layout(nodes: list[str], links: pd.DataFrame) -> dict[str, tuple[float, float]]:
    """Each node's place, inside the drawing's margins: a force layout, seeded, so it is the same each run."""
    graph = nx.Graph()
    graph.add_nodes_from(nodes)
    graph.add_edges_from(zip(links["source"], links["target"]))
    places = nx.spring_layout(graph, k=0.5, iterations=500, seed=LAYOUT_SEED)
    xs, ys = [p[0] for p in places.values()], [p[1] for p in places.values()]
    span_x, span_y = (max(xs) - min(xs)) or 1, (max(ys) - min(ys)) or 1
    return {
        node: (
            round(MARGIN + (x - min(xs)) / span_x * (WIDTH - 2 * MARGIN), 1),
            round(MARGIN + (y - min(ys)) / span_y * (HEIGHT - 2 * MARGIN), 1),
        )
        for node, (x, y) in places.items()
    }


def radius(neighbours: int) -> float:
    """A node's size, by how many blogs it is linked to either way: its reach, not its volume."""
    return round(3 + 2.4 * math.sqrt(neighbours), 1)


def _text_box(x: float, y: float, text: str, size: float, anchor: str) -> tuple[float, float, float, float]:
    width = 0.58 * size * len(text)
    left = {"middle": x - width / 2, "start": x, "end": x - width}[anchor]
    return (left, y - size, left + width, y + 2)


def _overlaps(a, b) -> bool:
    return a[0] < b[2] and b[0] < a[2] and a[1] < b[3] and b[1] < a[3]


def place_labels(nodes: list[dict]) -> None:
    """
    Gives each labelled node a label place, `label_x`, `label_y` and `label_anchor`: above it, or
    else below, right or left, whichever first overlaps no label already placed and no node. The
    seeds, the utilities and then the biggest are placed first, so they keep the best places; a
    seed's or a utility's label goes above it where nothing fits, and another that fits nowhere is
    unlabelled, named on hover alone.
    """
    circles = [(n["x"] - n["r"], n["y"] - n["r"], n["x"] + n["r"], n["y"] + n["r"]) for n in nodes]
    placed: list[tuple] = []
    for node in sorted(
        (n for n in nodes if n["labelled"]),
        key=lambda n: (-n["seed"], -n.get("utility", False), -n["weight"], n["id"]),
    ):
        size = 13 if node["seed"] or node.get("utility") else 11
        text, x, y, r = node["label"], node["x"], node["y"], node["r"]
        options = [
            (x, y - r - 4, "middle"),
            (x, y + r + size, "middle"),
            (x + r + 4, y + size / 3, "start"),
            (x - r - 4, y + size / 3, "end"),
        ]
        for lx, ly, anchor in options:
            box = _text_box(lx, ly, text, size, anchor)
            others = [c for c, n in zip(circles, nodes) if n is not node]
            if not any(_overlaps(box, other) for other in placed + others):
                break
        else:
            if not (node["seed"] or node.get("utility")):
                node["labelled"] = False
                continue
            lx, ly, anchor = options[0]
            box = _text_box(lx, ly, text, size, anchor)
        placed.append(box)
        node.update(label_x=round(lx, 1), label_y=round(ly, 1), label_anchor=anchor)


def build_graph(blogs: pd.DataFrame, mentions: pd.DataFrame, utilities: pd.DataFrame | None = None) -> dict:
    """
    The graph as the widget reads it: nodes with their places and labels, and links. A utility (the
    hand-kept list's) is marked, with its note, and always named.
    """
    notes = {}
    if utilities is not None:
        notes = {
            str(row["host"]).strip().lower(): row["note"] if isinstance(row["note"], str) else None
            for row in utilities.to_dict("records")
        }
    links = blog_links(mentions)
    seeds = {
        row["host"]: row["name"] if isinstance(row["name"], str) and row["name"] else row["host"]
        for row in blogs.to_dict("records")
        if row["seed"]
    }
    hosts = sorted(set(links["source"]) | set(links["target"]))
    places = layout(hosts, links)
    outgoing = links.groupby("source")["count"].sum()
    incoming = links.groupby("target")["count"].sum()
    seed_hosts = set(seeds)
    neighbours = {host: set() for host in hosts}
    for source, target in zip(links["source"], links["target"]):
        neighbours[source].add(target)
        neighbours[target].add(source)
    nodes = []
    for host in hosts:
        weight = int(outgoing.get(host, 0) + incoming.get(host, 0))
        seed_neighbours = len(neighbours[host] & seed_hosts)
        nodes.append({
            "id": host,
            "label": seeds.get(host, host),
            "seed": host in seed_hosts,
            "x": places[host][0],
            "y": places[host][1],
            "r": radius(len(neighbours[host])),
            "weight": weight,
            "outgoing": int(outgoing.get(host, 0)),
            "incoming": int(incoming.get(host, 0)),
            "seeds_linked": seed_neighbours,
            "utility": host in notes,
            "note": notes.get(host),
            # Named on the map: the seeds, the utilities, and every other blog more than one seed is
            # linked to.
            "labelled": host in seed_hosts or host in notes or seed_neighbours >= 2,
        })
    place_labels(nodes)
    return {
        "generated": date.today().isoformat(),
        "width": WIDTH,
        "height": HEIGHT,
        "nodes": nodes,
        "links": graph_links(links, seed_hosts),
    }


def _curve(a: dict, b: dict) -> str:
    """
    A link's path: a slight bend, so the two ways between a pair are two curves, ending at the edge
    of the target's circle, so its arrow shows.
    """
    (x1, y1), (x2, y2) = (a["x"], a["y"]), (b["x"], b["y"])
    dx, dy = x2 - x1, y2 - y1
    length = math.hypot(dx, dy) or 1
    mx, my = (x1 + x2) / 2 - dy * 0.12, (y1 + y2) / 2 + dx * 0.12
    # End short of the target's circle, along the curve's last tangent, so the arrow shows.
    tx, ty = x2 - mx, y2 - my
    t_len = math.hypot(tx, ty) or 1
    shrink = b["r"] + 2
    ex, ey = x2 - tx / t_len * shrink, y2 - ty / t_len * shrink
    return f"M{x1:.1f},{y1:.1f} Q{mx:.1f},{my:.1f} {ex:.1f},{ey:.1f}"


def star_points(x: float, y: float, r: float, points: int = 5) -> str:
    """A star's corners, as an SVG polygon's `points`: a little wider than a circle of radius `r`, for the eye."""
    outer, inner = r * 1.35, r * 0.6
    corners = []
    for i in range(points * 2):
        radius_here = outer if i % 2 == 0 else inner
        angle = -math.pi / 2 + i * math.pi / points
        corners.append(f"{x + radius_here * math.cos(angle):.1f},{y + radius_here * math.sin(angle):.1f}")
    return " ".join(corners)


def render_svg(graph: dict) -> str:
    """The graph as a standalone SVG, in the site's colours, light or dark by the reader's setting."""
    nodes = {n["id"]: n for n in graph["nodes"]}
    seeds = sum(n["seed"] for n in graph["nodes"])
    out = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {graph["width"]} {graph["height"]}" '
        f'role="img" aria-labelledby="title desc">',
        "<title id=\"title\">Who mentions whom among webmention-compatible blogs</title>",
        f'<desc id="desc">A network of {len(nodes)} blogs and {len(graph["links"])} links between them, '
        f"as seen from {seeds} seed blogs: the mentions each seed made, and the webmentions it received.</desc>",
        f"<style>{STYLE}</style>",
        "<defs>",
        *(
            f'<marker id="arrow-{d}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" '
            f'orient="auto-start-reverse"><path class="arrow {d}" d="M0,0 L10,5 L0,10 z"/></marker>'
            for d in ("out", "in", "mutual")
        ),
        "</defs>",
        f'<rect class="surface" width="{graph["width"]}" height="{graph["height"]}"/>',
        "<g>",
    ]
    for link in sorted(graph["links"], key=lambda l: l["count"]):
        width = round(0.6 + 0.5 * math.sqrt(link["count"]), 2)
        d = link["direction"]
        out.append(
            f'<path class="link {d}" d="{_curve(nodes[link["source"]], nodes[link["target"]])}" '
            f'stroke-width="{width}" marker-end="url(#arrow-{d})"/>'
        )
    out.append("</g><g>")
    for node in sorted(graph["nodes"], key=lambda n: (n["seed"], n.get("utility", False))):
        title = f"<title>{escape(node['label'])}</title>"
        if node.get("utility"):
            out.append(f'<polygon class="node utility" points="{star_points(node["x"], node["y"], node["r"])}">{title}</polygon>')
        else:
            out.append(
                f'<circle class="node{" seed" if node["seed"] else ""}" cx="{node["x"]}" cy="{node["y"]}" r="{node["r"]}">{title}</circle>'
            )
    out.append("</g><g>")
    for node in graph["nodes"]:
        if node["labelled"]:
            out.append(
                f'<text class="{"seed" if node["seed"] else "utility" if node.get("utility") else ""}" x="{node["label_x"]}" y="{node["label_y"]}" '
                f'text-anchor="{node["label_anchor"]}">{escape(node["label"])}</text>'
            )
    out.append("</g>")
    # Two rows: the nodes, then the links.
    out.append('<g class="legend">')
    x = 12
    for shape, label in (("seed", "seed"), ("node", "unexplored"), ("utility", "utility")):
        if shape == "utility":
            out.append(f'<polygon class="node utility" points="{star_points(x + 5, 20, 5)}"/>')
        else:
            out.append(f'<circle class="node{" seed" if shape == "seed" else ""}" cx="{x + 5}" cy="20" r="5"/>')
        out.append(f'<text x="{x + 16}" y="24">{label}</text>')
        x += 16 + 7 * len(label) + 18
    x = 12
    for d, label in (("out", "outgoing mention"), ("in", "incoming mention"), ("mutual", "mutual mention")):
        out.append(
            f'<path class="link {d}" d="M{x},42 L{x + 28},42" stroke-width="2" marker-end="url(#arrow-{d})"/>'
            f'<text x="{x + 36}" y="46">{label}</text>'
        )
        x += 36 + 7 * len(label) + 18
    out.append("</g></svg>")
    return "\n".join(out) + "\n"
