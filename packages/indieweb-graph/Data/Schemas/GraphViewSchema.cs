using Flowthru.Data.Schema;

namespace IndiewebGraph.Data.Schemas;

/// <summary>
/// One seed of a view of the mention graph: the graph as if only the view's seeds had been crawled,
/// which ExportGraph lays out and writes beside the whole one, as
/// <c>mention-graph.&lt;view&gt;.json</c> and <c>.svg</c>. Kept by hand in
/// <c>Data/_01_Raw/graph-views.csv</c>, a row a seed, and committed.
/// </summary>
[FlowthruSchema]
public partial record GraphViewSchema
{
  /// <summary>The view's name, as its files are named: <c>chaotic-good</c>.</summary>
  [SerializedLabel("view")]
  public required string View { get; init; }

  /// <summary>One of its seeds, by host, without <c>www.</c>.</summary>
  [SerializedLabel("seed")]
  public required string Seed { get; init; }
}
