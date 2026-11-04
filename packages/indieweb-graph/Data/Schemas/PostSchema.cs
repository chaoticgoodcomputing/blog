using Flowthru.Data.Schema;

namespace IndiewebGraph.Data.Schemas;

/// <summary>
/// A node of the mention graph: a page of a webmention-compatible blog that mentions or is
/// mentioned, or that the crawl fetched. Its blog is <see cref="BlogHasPostSchema"/>'s to say.
/// </summary>
[FlowthruSchema]
public partial record PostSchema
{
  /// <summary>
  /// Its address, the post's id, in one form however it was written: <c>https</c>, its host
  /// without <c>www.</c>, and no fragment or trailing slash.
  /// </summary>
  [SerializedLabel("url")]
  public required string Url { get; init; }

  /// <summary>Whether the crawl fetched it, as a seed's page: only a crawled post's own links are known.</summary>
  [SerializedLabel("crawled")]
  public required bool Crawled { get; init; }
}
