using Flowthru.Data.Schema;

namespace IndiewebGraph.Data.Schemas;

/// <summary>An edge of the mention graph: a blog to each of its posts.</summary>
[FlowthruSchema]
public partial record BlogHasPostSchema
{
  /// <summary>The blog's host (<see cref="BlogSchema.Host"/>).</summary>
  [SerializedLabel("blog")]
  public required string Blog { get; init; }

  /// <summary>The post's address (<see cref="PostSchema.Url"/>).</summary>
  [SerializedLabel("post")]
  public required string Post { get; init; }
}
