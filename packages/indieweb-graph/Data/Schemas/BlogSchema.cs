using Flowthru.Data.Schema;

namespace IndiewebGraph.Data.Schemas;

/// <summary>
/// A node of the mention graph: a webmention-compatible blog, one whose home page announces a
/// webmention endpoint (<see cref="HostSchema"/>), with at least one post in the graph.
/// </summary>
[FlowthruSchema]
public partial record BlogSchema
{
  /// <summary>Its host, without <c>www.</c>: the blog's id.</summary>
  [SerializedLabel("host")]
  public required string Host { get; init; }

  [SerializedLabel("endpoint")]
  public required string Endpoint { get; init; }

  /// <summary>Whether it is a seed: one whose posts were crawled, and whose received webmentions were asked of webmention.io where it uses that.</summary>
  [SerializedLabel("seed")]
  public required bool Seed { get; init; }

  /// <summary>A seed's name, as seeds.json gives it.</summary>
  [SerializedLabel("name")]
  public string? Name { get; init; }
}
