import pandas as pd

from Flows.Analysis.Steps.drawing import blog_links, build_graph, direction, graph_links, render_svg

BLOGS = pd.DataFrame([
    {"host": "a.example", "endpoint": "e", "seed": True, "name": "Ada"},
    {"host": "b.example", "endpoint": "e", "seed": True, "name": None},
    {"host": "c.example", "endpoint": "e", "seed": False, "name": None},
])
MENTIONS = pd.DataFrame([
    {"source": "https://a.example/1", "target": "https://c.example/x", "kind": "mention", "seen_as": "outgoing"},
    {"source": "https://a.example/2", "target": "https://c.example/y", "kind": "reply", "seen_as": "outgoing"},
    {"source": "https://c.example/z", "target": "https://b.example/3", "kind": "like", "seen_as": "incoming"},
    {"source": "https://a.example/1", "target": "https://b.example/3", "kind": "mention", "seen_as": "outgoing"},
])


def test_blog_links_count_each_pair_one_way_by_kind():
    links = blog_links(MENTIONS)
    assert links[["source", "target", "count"]].values.tolist() == [
        ["a.example", "b.example", 1],
        ["a.example", "c.example", 2],
        ["c.example", "b.example", 1],
    ]
    assert links["kinds"][1] == {"mention": 1, "reply": 1}


def test_direction_is_a_seeds_point_of_view():
    seeds = {"a.example", "b.example"}
    assert direction("a.example", "c.example", seeds) == "out"
    assert direction("c.example", "a.example", seeds) == "in"
    assert direction("a.example", "b.example", seeds) == "out"
    assert direction("c.example", "a.example", seeds, mutual=True) == "mutual"


def test_the_graph_names_its_seeds_and_the_blogs_more_than_one_seed_is_linked_to():
    graph = build_graph(BLOGS, MENTIONS)
    nodes = {node["id"]: node for node in graph["nodes"]}
    assert nodes["a.example"]["label"] == "Ada" and nodes["b.example"]["label"] == "b.example"
    assert nodes["c.example"]["seeds_linked"] == 2 and nodes["c.example"]["labelled"]
    assert nodes["c.example"]["incoming"] == 2 and nodes["c.example"]["outgoing"] == 1
    assert all(0 <= node["x"] <= graph["width"] and 0 <= node["y"] <= graph["height"] for node in graph["nodes"])


def test_the_layout_is_the_same_each_run():
    assert build_graph(BLOGS, MENTIONS)["nodes"] == build_graph(BLOGS, MENTIONS)["nodes"]


def test_the_svg_draws_every_node_and_link_and_escapes_names():
    blogs = BLOGS.assign(name=["Ada & co", None, None])
    svg = render_svg(build_graph(blogs, MENTIONS))
    # The nodes, and the legend's two circles, seed and unexplored; the links, and the legend's three.
    assert svg.count("<circle") == 3 + 2 and svg.count('class="link ') == 3 + 3
    assert "Ada &amp; co" in svg and "Ada & co" not in svg


def test_a_utility_is_marked_named_and_drawn_as_a_star():
    utilities = pd.DataFrame([{"host": "c.example", "note": "A wiki"}])
    graph = build_graph(BLOGS, MENTIONS, utilities)
    nodes = {node["id"]: node for node in graph["nodes"]}
    assert nodes["c.example"]["utility"] and nodes["c.example"]["note"] == "A wiki"
    assert not nodes["a.example"]["utility"] and nodes["a.example"]["note"] is None
    svg = render_svg(graph)
    assert svg.count('<polygon class="node utility"') == 2  # the node, and the legend's
    assert svg.count("<circle") == 2 + 2


def test_each_link_carries_its_post_mentions():
    graph = build_graph(BLOGS, MENTIONS)
    link = next(l for l in graph["links"] if (l["source"], l["target"]) == ("a.example", "c.example"))
    assert link["mentions"] == [
        {"source": "https://a.example/1", "target": "https://c.example/x", "kind": "mention", "seen_as": "outgoing"},
        {"source": "https://a.example/2", "target": "https://c.example/y", "kind": "reply", "seen_as": "outgoing"},
    ]


def test_both_ways_of_a_pair_that_mention_each_other_are_mutual_and_stay_two_links():
    mentions = pd.concat([MENTIONS, pd.DataFrame([
        {"source": "https://c.example/w", "target": "https://a.example/1", "kind": "like", "seen_as": "incoming"},
    ])], ignore_index=True)
    links = {(l["source"], l["target"]): l for l in graph_links(blog_links(mentions), {"a.example", "b.example"})}
    assert links[("a.example", "c.example")]["direction"] == "mutual"
    assert links[("c.example", "a.example")]["direction"] == "mutual"
    assert links[("c.example", "a.example")]["count"] == 1
    assert links[("c.example", "b.example")]["direction"] == "in"
    assert links[("a.example", "b.example")]["direction"] == "out"
