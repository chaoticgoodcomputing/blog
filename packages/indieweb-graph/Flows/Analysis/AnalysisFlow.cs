using Flowthru.Flow;
using IndiewebGraph.Data;
using IndiewebGraph.Data.Schemas;
using IndiewebGraph.Flows.Analysis.Steps;

namespace IndiewebGraph.Flows.Analysis;

/// <summary>Makes a graph of sites of what the crawl found, and summarizes each site's place in it.</summary>
public static class AnalysisFlow
{
  public static BuiltFlow Create(Catalog catalog) =>
    FlowBuilder.CreateFlow("Analysis", pipeline =>
    {
      pipeline.AddStep<IEnumerable<LinkSchema>, IEnumerable<MentionSchema>, IEnumerable<BlockedHostSchema>, IEnumerable<EdgeSchema>>(
        label: "BuildEdges",
        transform: BuildEdgesStep.Create(),
        inputs: (catalog.Links, catalog.Mentions, catalog.Blocklist),
        outputs: catalog.Edges
      );

      pipeline.AddStep<IEnumerable<EdgeSchema>, IEnumerable<SiteSummarySchema>>(
        label: "SummarizeSites",
        transform: SummarizeSitesStep.Create(),
        inputs: catalog.Edges,
        outputs: catalog.SiteSummaries
      );
    });
}
