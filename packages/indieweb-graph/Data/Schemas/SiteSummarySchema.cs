using Flowthru.Data.Schema;

namespace IndiewebGraph.Data.Schemas;

/// <summary>A site of the graph, by how much it points at others and how much others point at it.</summary>
[FlowthruSchema]
public partial record SiteSummarySchema
{
  [SerializedLabel("site")]
  public required string Site { get; init; }

  /// <summary>Its links and mentions to other sites.</summary>
  [SerializedLabel("outgoing")]
  public required int Outgoing { get; init; }

  /// <summary>Other sites' links and mentions to it.</summary>
  [SerializedLabel("incoming")]
  public required int Incoming { get; init; }

  /// <summary>How many sites it points at or is pointed at by.</summary>
  [SerializedLabel("neighbours")]
  public required int Neighbours { get; init; }

  /// <summary>How many of those point both ways.</summary>
  [SerializedLabel("mutual")]
  public required int Mutual { get; init; }
}
