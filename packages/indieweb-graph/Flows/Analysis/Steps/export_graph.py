"""
Writes the mention graphs for the blog: the whole one, and each view's, of only some seeds, each as
JSON, for its widget to draw, and as an SVG of the same picture, for where no script runs (a feed
reader, a social card). drawing.py draws them.
"""
from __future__ import annotations

import pandas as pd
from flowthru import step

from Flows.Analysis.Steps.drawing import view_files


@step(inputs=["BlogSchema", "PostHasMentionSchema", "UtilitySchema", "GraphViewSchema"], outputs=["MentionGraphs"])
def export_graph(blogs: pd.DataFrame, mentions: pd.DataFrame, utilities: pd.DataFrame, views: pd.DataFrame) -> dict[str, str]:
    return view_files(blogs, mentions, utilities, views)
