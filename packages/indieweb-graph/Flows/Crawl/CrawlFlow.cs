using Flowthru.Flow;
using Flowthru.Step.Python;
using IndiewebGraph.Data;

namespace IndiewebGraph.Flows.Crawl;

/// <summary>
/// Fetches the seeds: lists each one's pages, then reads their links out of them and asks
/// webmention.io for the webmentions they received, and probes the sites those point at, recording
/// each one's webmention endpoint and blocking those that show no sign of being someone's IndieWeb site. The steps are Python's (Steps/), and none is
/// cacheable, since each fetches: a re-run is cheap through the crawl's own HTTP cache instead.
/// </summary>
public static class CrawlFlow
{
  public static BuiltFlow Create(Catalog catalog, IPythonExecutor executor) =>
    FlowBuilder.CreateFlow("Crawl", pipeline =>
    {
      pipeline.AddPythonStep(
        label: "DiscoverPages",
        module: "Flows.Crawl.Steps.discover_pages",
        function: "discover_pages",
        input: (catalog.Seeds, catalog.CrawlOptions),
        output: catalog.Pages,
        executor: executor
      );

      pipeline.AddPythonStep(
        label: "ExtractLinks",
        module: "Flows.Crawl.Steps.extract_links",
        function: "extract_links",
        input: (catalog.Pages, catalog.CrawlOptions),
        output: catalog.Links,
        executor: executor
      );

      pipeline.AddPythonStep(
        label: "FetchMentions",
        module: "Flows.Crawl.Steps.fetch_mentions",
        function: "fetch_mentions",
        input: (catalog.Pages, catalog.CrawlOptions),
        output: catalog.Mentions,
        executor: executor
      );

      pipeline.AddPythonStep(
        label: "ProbeHosts",
        module: "Flows.Crawl.Steps.probe_hosts",
        function: "probe_hosts",
        input: (catalog.Pages, catalog.Links, catalog.Mentions, catalog.Seeds, catalog.Blocklist, catalog.Hosts, catalog.CrawlOptions),
        output: (catalog.ProbedBlocklist, catalog.ProbedHosts),
        executor: executor
      );
    });
}
