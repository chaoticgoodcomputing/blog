using Flowthru.Data.Schema;

namespace IndiewebGraph.Data.Schemas;

/// <summary>
/// How often one site points at another, by kind: its links to the other, and the webmentions the
/// other received from it.
/// </summary>
[FlowthruSchema]
public partial record EdgeSchema
{
  [SerializedLabel("source")]
  public required string Source { get; init; }

  [SerializedLabel("target")]
  public required string Target { get; init; }

  /// <summary>A link's kind or a mention's (<see cref="LinkSchema.Kind"/>, <see cref="MentionSchema.Kind"/>).</summary>
  [SerializedLabel("kind")]
  public required string Kind { get; init; }

  /// <summary>Where it was seen: <c>link</c>, crawled from the source; <c>webmention</c>, received by the target.</summary>
  [SerializedLabel("seen_as")]
  public required string SeenAs { get; init; }

  [SerializedLabel("count")]
  public required int Count { get; init; }
}
