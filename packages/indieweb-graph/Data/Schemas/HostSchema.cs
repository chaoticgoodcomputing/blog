using Flowthru.Data.Schema;

namespace IndiewebGraph.Data.Schemas;

/// <summary>
/// What a probe of a host's home page found: whether it announces a webmention endpoint, and whether
/// it has an h-card. Kept in <c>Data/_01_Raw/hosts.csv</c> by ProbeHosts, which adds the hosts it
/// probes each run and probes the seeds again, at their own addresses, every run. A host with an
/// endpoint is webmention-compatible: a blog of the mention graph.
/// </summary>
[FlowthruSchema]
public partial record HostSchema
{
  /// <summary>The host, without <c>www.</c>.</summary>
  [SerializedLabel("host")]
  public required string Host { get; init; }

  /// <summary>Its webmention endpoint, where its home page announces one.</summary>
  [SerializedLabel("endpoint")]
  public string? Endpoint { get; init; }

  [SerializedLabel("h_card")]
  public required bool HCard { get; init; }

  /// <summary>The day it was probed, as <c>yyyy-MM-dd</c>.</summary>
  [SerializedLabel("probed")]
  public required string Probed { get; init; }
}
