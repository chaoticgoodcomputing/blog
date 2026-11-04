using Flowthru.Data.Schema;

namespace IndiewebGraph.Data.Schemas;

/// <summary>
/// An edge of the mention graph: from the post that mentions to the post it mentions, each on a
/// different webmention-compatible blog. Once per pair, however often it was seen.
/// </summary>
[FlowthruSchema]
public partial record PostHasMentionSchema
{
  /// <summary>The mentioning post's address (<see cref="PostSchema.Url"/>).</summary>
  [SerializedLabel("source")]
  public required string Source { get; init; }

  /// <summary>The mentioned post's address.</summary>
  [SerializedLabel("target")]
  public required string Target { get; init; }

  /// <summary>
  /// What it is: <c>reply</c>, <c>repost</c>, <c>like</c>, <c>bookmark</c>, <c>rsvp</c> or
  /// <c>mention</c>, a plain link. Seen as more than one, the most telling.
  /// </summary>
  [SerializedLabel("kind")]
  public required string Kind { get; init; }

  /// <summary>
  /// Where it was seen: <c>outgoing</c>, a link in a crawled post, which its blog's webmention would
  /// be sent for; <c>incoming</c>, a webmention a seed received; or <c>both</c>.
  /// </summary>
  [SerializedLabel("seen_as")]
  public required string SeenAs { get; init; }
}
