using Flowthru.Data.Schema;

namespace IndiewebGraph.Data.Schemas;

/// <summary>
/// A site a crawl starts from. Kept in <c>Data/_01_Raw/seeds.json</c>, which is each crawler's own
/// and not committed; <c>seeds.sample.json</c> beside it is the committed example.
/// </summary>
[FlowthruSchema]
public partial record SeedSchema
{
  /// <summary>Its home page's address: a blog under a path, such as <c>/blog/</c>, by that path.</summary>
  [SerializedLabel("url")]
  public required string Url { get; init; }

  /// <summary>Whose it is, for whoever keeps the list.</summary>
  [SerializedLabel("name")]
  public string? Name { get; init; }
}
