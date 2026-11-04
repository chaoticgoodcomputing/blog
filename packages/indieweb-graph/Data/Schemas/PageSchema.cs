using Flowthru.Data.Schema;

namespace IndiewebGraph.Data.Schemas;

/// <summary>A page of a crawled site, as its sitemap, its feed or its home page lists it.</summary>
[FlowthruSchema]
public partial record PageSchema
{
  /// <summary>The site's host, without <c>www.</c>: <c>maggieappleton.com</c>.</summary>
  [SerializedLabel("site")]
  public required string Site { get; init; }

  [SerializedLabel("url")]
  public required string Url { get; init; }

  /// <summary>
  /// Where it was listed: <c>sitemap</c>, <c>feed</c>, or <c>home</c> for the home page and the
  /// top-level pages it links to.
  /// </summary>
  [SerializedLabel("listed_in")]
  public required string ListedIn { get; init; }

  /// <summary>When the sitemap says it last changed, as it says it.</summary>
  [SerializedLabel("lastmod")]
  public string? Lastmod { get; init; }
}
