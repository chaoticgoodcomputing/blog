using Flowthru.Data.Schema;

namespace IndiewebGraph.Data.Schemas;

/// <summary>
/// A host known not to accept webmentions: a platform, not someone's IndieWeb site, such as a
/// social network, a news site or an encyclopedia. A link to it, or where <see cref="Subdomains"/>
/// says so to a subdomain of it, is no edge of the graph. Kept in <c>Data/_01_Raw/blocklist.csv</c>: by hand, and by ProbeHosts, which adds
/// each host whose home page has no webmention endpoint and no h-card.
/// </summary>
[FlowthruSchema]
public partial record BlockedHostSchema
{
  /// <summary>The host, without <c>www.</c>.</summary>
  [SerializedLabel("host")]
  public required string Host { get; init; }

  /// <summary>
  /// Whether its subdomains are blocked too: <c>wikipedia.org</c>'s <c>en.wikipedia.org</c>. True
  /// for a row kept by hand, false for one probed, since a probe saw one host's home page only, and a
  /// platform's subdomains may be its members' own sites (<c>someone.micro.blog</c>).
  /// </summary>
  [SerializedLabel("subdomains")]
  public required bool Subdomains { get; init; }

  /// <summary>What it is, for whoever keeps the list.</summary>
  [SerializedLabel("note")]
  public string? Note { get; init; }
}
