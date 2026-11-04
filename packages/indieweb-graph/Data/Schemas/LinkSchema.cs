using Flowthru.Data.Schema;

namespace IndiewebGraph.Data.Schemas;

/// <summary>A link in a crawled page's content to a page on another host.</summary>
[FlowthruSchema]
public partial record LinkSchema
{
  [SerializedLabel("source_site")]
  public required string SourceSite { get; init; }

  [SerializedLabel("source_url")]
  public required string SourceUrl { get; init; }

  [SerializedLabel("target_url")]
  public required string TargetUrl { get; init; }

  /// <summary>The target's host, without <c>www.</c>.</summary>
  [SerializedLabel("target_host")]
  public required string TargetHost { get; init; }

  /// <summary>
  /// What the link is, by its microformats class: <c>reply</c>, <c>like</c>, <c>repost</c>,
  /// <c>bookmark</c>, or a plain <c>link</c>.
  /// </summary>
  [SerializedLabel("kind")]
  public required string Kind { get; init; }

  [SerializedLabel("text")]
  public string? Text { get; init; }
}
