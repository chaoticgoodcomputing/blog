"""
Writes the mention graph for the blog: as JSON, for its widget to draw, and as an SVG of the same
picture, for where no script runs (a feed reader, a social card). drawing.py draws it.
"""
from __future__ import annotations

import json

import pandas as pd
from flowthru import step

from Flows.Analysis.Steps.drawing import build_graph, render_svg


@step(inputs=["BlogSchema", "PostHasMentionSchema", "UtilitySchema"], outputs=["str", "str"])
def export_graph(blogs: pd.DataFrame, mentions: pd.DataFrame, utilities: pd.DataFrame) -> tuple[str, str]:
    graph = build_graph(blogs, mentions, utilities)
    return json.dumps(graph, indent=1, ensure_ascii=False) + "\n", render_svg(graph)
