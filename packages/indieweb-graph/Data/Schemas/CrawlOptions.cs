using Flowthru.Data.Schema;

namespace IndiewebGraph.Data.Schemas;

/// <summary>
/// How politely to crawl: bound from <c>Flowthru:Flows:Crawl:CrawlOptions</c>. The Python steps
/// read it as a dict keyed by these property names. What to crawl is the seeds' (SeedSchema).
/// </summary>
[FlowthruSchema]
public partial record CrawlOptions
{
  /// <summary>The most pages listed of any one site.</summary>
  public int MaxPagesPerSite { get; init; } = 500;

  /// <summary>
  /// The most hosts ProbeHosts visits in a run, the most linked first; the rest wait for later runs.
  /// </summary>
  public int MaxProbesPerRun { get; init; } = 300;

  /// <summary>Seconds between two requests to the same host that the HTTP cache didn't answer.</summary>
  public double DelaySeconds { get; init; } = 1.0;

  /// <summary>How long a fetched response is reused before it is fetched again, in hours.</summary>
  public double CacheHours { get; init; } = 168;

  /// <summary>The HTTP cache's file, relative to the project.</summary>
  public string CachePath { get; init; } = "Data/_00_Cache/http";

  /// <summary>The User-Agent every request sends.</summary>
  public string UserAgent { get; init; } = "indieweb-graph/0.1";
}
