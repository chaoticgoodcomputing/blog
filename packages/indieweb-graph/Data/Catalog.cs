using Flowthru.Data.Catalog;
using Flowthru.Data.Catalog.Configuration;
using IndiewebGraph.Data.Schemas;
using Microsoft.Extensions.Configuration;

namespace IndiewebGraph.Data;

/// <summary>
/// The graph's data, in layers: <c>_01_Raw</c>, the seeds, the blocklist and what a crawl fetched; <c>_02_Primary</c>, the
/// graph made of it; <c>_03_Reporting</c>, what is read of the graph.
/// </summary>
public class Catalog(string basePath, IConfiguration configuration) : CatalogAbstract
{
  /// <summary>The sites to crawl from: each crawler's own, not committed (seeds.sample.json is).</summary>
  public IItem<IEnumerable<SeedSchema>> Seeds =>
    CreateItem(() => Item.Of<IEnumerable<SeedSchema>>("Seeds")
      .Json()
      .AtPath($"{basePath}/_01_Raw/seeds.json")
      .Build());

  public IItem<CrawlOptions> CrawlOptions =>
    CreateItem(() => Item.Of<CrawlOptions>("CrawlOptions")
      .FromConfiguration(configuration)
      .AtSection("Flowthru:Flows:Crawl:CrawlOptions")
      .Build());

  /// <summary>Hosts known not to accept webmentions, kept by hand: no edge of the graph.</summary>
  public IItem<IEnumerable<BlockedHostSchema>> Blocklist =>
    CreateItem(() => Item.Of<IEnumerable<BlockedHostSchema>>("Blocklist")
      .Csv()
      .AtPath($"{basePath}/_01_Raw/blocklist.csv")
      .Build());

  public IItem<IEnumerable<PageSchema>> Pages =>
    CreateItem(() => Item.Of<IEnumerable<PageSchema>>("Pages")
      .Parquet()
      .AtPath($"{basePath}/_01_Raw/pages.parquet")
      .Build());

  public IItem<IEnumerable<LinkSchema>> Links =>
    CreateItem(() => Item.Of<IEnumerable<LinkSchema>>("Links")
      .Parquet()
      .AtPath($"{basePath}/_01_Raw/links.parquet")
      .Build());

  public IItem<IEnumerable<MentionSchema>> Mentions =>
    CreateItem(() => Item.Of<IEnumerable<MentionSchema>>("Mentions")
      .Parquet()
      .AtPath($"{basePath}/_01_Raw/mentions.parquet")
      .Build());

  public IItem<IEnumerable<EdgeSchema>> Edges =>
    CreateItem(() => Item.Of<IEnumerable<EdgeSchema>>("Edges")
      .Csv()
      .AtPath($"{basePath}/_02_Primary/edges.csv")
      .Build());

  public IItem<IEnumerable<SiteSummarySchema>> SiteSummaries =>
    CreateItem(() => Item.Of<IEnumerable<SiteSummarySchema>>("SiteSummaries")
      .Csv()
      .AtPath($"{basePath}/_03_Reporting/sites.csv")
      .Build());
}
