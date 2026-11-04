using Flowthru.Data.Schema;

namespace IndiewebGraph.Data.Schemas;

/// <summary>
/// A canonical utility of the IndieWeb: a blog of the mention graph that is a shared resource rather
/// than someone's own, such as a wiki or an aggregator, cited by many and mentioning none back.
/// Kept by hand in <c>Data/_01_Raw/utilities.csv</c>, since what the crawl sees can't tell one apart:
/// most blogs look as if they only receive, because only the seeds' outgoing mentions are known.
/// The export marks them, and the map draws them as stars.
/// </summary>
[FlowthruSchema]
public partial record UtilitySchema
{
  /// <summary>The host, without <c>www.</c>.</summary>
  [SerializedLabel("host")]
  public required string Host { get; init; }

  /// <summary>What it is, shown on the map.</summary>
  [SerializedLabel("note")]
  public string? Note { get; init; }
}
