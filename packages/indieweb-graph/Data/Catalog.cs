using Flowthru.Data.Catalog;
using Flowthru.Data.Catalog.Configuration;
using Flowthru.Data.Storage;
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

  /// <summary>
  /// Hosts known not to accept webmentions, as the run starts: those kept by hand, and those earlier
  /// runs' ProbeHosts added.
  /// </summary>
  public IItem<IEnumerable<BlockedHostSchema>> Blocklist =>
    CreateItem(() => Item.Of<IEnumerable<BlockedHostSchema>>("Blocklist")
      .Csv()
      .AtPath(BlocklistPath)
      .Build());

  /// <summary>
  /// The blocklist with this run's probes added, written over the file <see cref="Blocklist"/> read:
  /// two items of one file, so that a run's probes are the next run's blocklist with no hand between.
  /// No cycle in the DAG, since the file is read before it is written.
  /// </summary>
  public IItem<IEnumerable<BlockedHostSchema>> ProbedBlocklist =>
    CreateItem(() => Item.Of<IEnumerable<BlockedHostSchema>>("ProbedBlocklist")
      .Csv()
      .AtPath(BlocklistPath)
      .Build());

  private string BlocklistPath => $"{basePath}/_01_Raw/blocklist.csv";

  /// <summary>The views of the mention graph the blog draws besides the whole one, kept by hand and committed.</summary>
  public IItem<IEnumerable<GraphViewSchema>> GraphViews =>
    CreateItem(() => Item.Of<IEnumerable<GraphViewSchema>>("GraphViews")
      .Csv()
      .AtPath($"{basePath}/_01_Raw/graph-views.csv")
      .Build());

  /// <summary>The IndieWeb's canonical utilities, such as its wiki, kept by hand and committed, as the blocklist is.</summary>
  public IItem<IEnumerable<UtilitySchema>> Utilities =>
    CreateItem(() => Item.Of<IEnumerable<UtilitySchema>>("Utilities")
      .Csv()
      .AtPath($"{basePath}/_01_Raw/utilities.csv")
      .Build());

  /// <summary>
  /// The hosts earlier runs probed, and what each one's home page showed: a webmention endpoint, an
  /// h-card. Not committed, as what a crawl fetched isn't; the setup target starts it empty.
  /// </summary>
  public IItem<IEnumerable<HostSchema>> Hosts =>
    CreateItem(() => Item.Of<IEnumerable<HostSchema>>("Hosts")
      .Csv()
      .AtPath(HostsPath)
      .Build());

  /// <summary>
  /// The hosts with this run's probes added, written over the file <see cref="Hosts"/> read, as
  /// <see cref="ProbedBlocklist"/> is over the blocklist's.
  /// </summary>
  public IItem<IEnumerable<HostSchema>> ProbedHosts =>
    CreateItem(() => Item.Of<IEnumerable<HostSchema>>("ProbedHosts")
      .Csv()
      .AtPath(HostsPath)
      .Build());

  private string HostsPath => $"{basePath}/_01_Raw/hosts.csv";

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

  /// <summary>The mention graph's nodes and edges: webmention-compatible blogs, their posts, and which post mentions which.</summary>
  public IItem<IEnumerable<BlogSchema>> Blogs =>
    CreateItem(() => Item.Of<IEnumerable<BlogSchema>>("Blogs")
      .Csv()
      .AtPath($"{basePath}/_02_Primary/blogs.csv")
      .Build());

  public IItem<IEnumerable<PostSchema>> Posts =>
    CreateItem(() => Item.Of<IEnumerable<PostSchema>>("Posts")
      .Csv()
      .AtPath($"{basePath}/_02_Primary/posts.csv")
      .Build());

  public IItem<IEnumerable<BlogHasPostSchema>> BlogHasPost =>
    CreateItem(() => Item.Of<IEnumerable<BlogHasPostSchema>>("BlogHasPost")
      .Csv()
      .AtPath($"{basePath}/_02_Primary/blog_has_post.csv")
      .Build());

  public IItem<IEnumerable<PostHasMentionSchema>> PostHasMention =>
    CreateItem(() => Item.Of<IEnumerable<PostHasMentionSchema>>("PostHasMention")
      .Csv()
      .AtPath($"{basePath}/_02_Primary/post_has_mention.csv")
      .Build());

  /// <summary>
  /// The mention graph, blog to blog and laid out, as the blog's widget reads it and as an SVG of
  /// the same picture: <c>mention-graph.json</c> and <c>.svg</c>, and each view's beside them.
  /// Committed, to be copied beside the widget.
  /// </summary>
  public IItem<DirectoryOf<string>> MentionGraphs =>
    CreateItem(() => Item.Of<DirectoryOf<string>>("MentionGraphs")
      .Directory(file => file.Text())
      .AtPath($"{basePath}/_03_Reporting")
      .WithFilePattern("mention-graph*")
      .Build());

  public IItem<IEnumerable<SiteSummarySchema>> SiteSummaries =>
    CreateItem(() => Item.Of<IEnumerable<SiteSummarySchema>>("SiteSummaries")
      .Csv()
      .AtPath($"{basePath}/_03_Reporting/sites.csv")
      .Build());
}
