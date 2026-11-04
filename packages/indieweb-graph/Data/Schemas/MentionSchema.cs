using Flowthru.Data.Schema;

namespace IndiewebGraph.Data.Schemas;

/// <summary>A webmention a crawled page received, as webmention.io has it.</summary>
[FlowthruSchema]
public partial record MentionSchema
{
  [SerializedLabel("target_site")]
  public required string TargetSite { get; init; }

  [SerializedLabel("target_url")]
  public required string TargetUrl { get; init; }

  /// <summary>The mentioning post: for one Bridgy backfed, the post on the silo.</summary>
  [SerializedLabel("source_url")]
  public required string SourceUrl { get; init; }

  /// <summary>
  /// Who mentioned it, as a host without <c>www.</c>: the source's host, or for a Bluesky post the
  /// author's handle where it is a domain of their own.
  /// </summary>
  [SerializedLabel("source_host")]
  public required string SourceHost { get; init; }

  /// <summary>What sent it, where that isn't the source: Bridgy's address for a backfed one.</summary>
  [SerializedLabel("via")]
  public string? Via { get; init; }

  /// <summary><c>reply</c>, <c>like</c>, <c>repost</c>, <c>bookmark</c>, <c>rsvp</c> or <c>mention</c>.</summary>
  [SerializedLabel("kind")]
  public required string Kind { get; init; }

  [SerializedLabel("author_name")]
  public string? AuthorName { get; init; }

  [SerializedLabel("author_url")]
  public string? AuthorUrl { get; init; }

  /// <summary>When it was published, or else received, as ISO 8601.</summary>
  [SerializedLabel("published")]
  public string? Published { get; init; }
}
