using Flowthru.Data.Schema;

namespace IndiewebGraph.Data.Schemas;

/// <summary>
/// A host known not to accept webmentions: a platform, not someone's site, such as a social
/// network, a code host or an encyclopedia. A link to it, or to a subdomain of it, is no edge of the
/// graph. Kept by hand, in <c>Data/_01_Raw/blocklist.csv</c>.
/// </summary>
[FlowthruSchema]
public partial record BlockedHostSchema
{
  /// <summary>The host, without <c>www.</c>: <c>wikipedia.org</c> blocks <c>en.wikipedia.org</c> too.</summary>
  [SerializedLabel("host")]
  public required string Host { get; init; }

  /// <summary>What it is, for whoever keeps the list.</summary>
  [SerializedLabel("note")]
  public string? Note { get; init; }
}
