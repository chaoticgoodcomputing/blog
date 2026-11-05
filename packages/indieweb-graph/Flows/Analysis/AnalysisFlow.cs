using Flowthru.Flow;
using Flowthru.Step.Python;
using IndiewebGraph.Data;
using IndiewebGraph.Data.Schemas;
using IndiewebGraph.Flows.Analysis.Steps;

namespace IndiewebGraph.Flows.Analysis;

/// <summary>
/// Makes graphs of what the crawl found: of sites, summarizing each one's place in it; and the mention
/// graph, of webmention-compatible blogs, their posts, and which post mentions which, which ExportGraph
/// (Python) lays out and writes for the blog.
/// </summary>
public static class AnalysisFlow
{
  public static BuiltFlow Create(Catalog catalog, IPythonExecutor executor) =>
    FlowBuilder.CreateFlow("Analysis", pipeline =>
    {
      pipeline.AddStep<IEnumerable<LinkSchema>, IEnumerable<MentionSchema>, IEnumerable<BlockedHostSchema>, IEnumerable<EdgeSchema>>(
        label: "BuildEdges",
        transform: BuildEdgesStep.Create(),
        inputs: (catalog.Links, catalog.Mentions, catalog.ProbedBlocklist),
        outputs: catalog.Edges
      );

      pipeline.AddStep<
        IEnumerable<SeedSchema>,
        IEnumerable<PageSchema>,
        IEnumerable<LinkSchema>,
        IEnumerable<MentionSchema>,
        IEnumerable<HostSchema>,
        IEnumerable<BlogSchema>,
        IEnumerable<PostSchema>,
        IEnumerable<BlogHasPostSchema>,
        IEnumerable<PostHasMentionSchema>
      >(
        label: "BuildMentionGraph",
        transform: BuildMentionGraphStep.Create(),
        inputs: (catalog.Seeds, catalog.Pages, catalog.Links, catalog.Mentions, catalog.ProbedHosts),
        outputs: (catalog.Blogs, catalog.Posts, catalog.BlogHasPost, catalog.PostHasMention)
      );

      pipeline.AddPythonStep(
        label: "ExportGraph",
        module: "Flows.Analysis.Steps.export_graph",
        function: "export_graph",
        input: (catalog.Blogs, catalog.PostHasMention, catalog.Utilities, catalog.GraphViews),
        output: catalog.MentionGraphs,
        executor: executor
      );

      pipeline.AddStep<IEnumerable<EdgeSchema>, IEnumerable<SiteSummarySchema>>(
        label: "SummarizeSites",
        transform: SummarizeSitesStep.Create(),
        inputs: catalog.Edges,
        outputs: catalog.SiteSummaries
      );
    });
}
