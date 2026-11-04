using Flowthru.Cli;
using Flowthru.Diagnostics;
using Flowthru.Hosting;
using Flowthru.Step.Python;
using IndiewebGraph.Data;
using IndiewebGraph.Flows.Analysis;
using IndiewebGraph.Flows.Crawl;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace IndiewebGraph;

/// <summary>
/// The graph's two flows: Crawl, in Python, fetches the seeds' pages, links and webmentions; and
/// Analysis, in C#, makes a graph of sites of them. Run from the project's directory, whose
/// <c>.venv</c> (<c>uv sync</c>) the Python steps run in.
/// </summary>
public static class Program
{
  public static Task<int> Main(string[] args) =>
    FlowthruCli.RunStandaloneAsync(args, services =>
      Configure(services, Directory.GetCurrentDirectory(), AppDomain.CurrentDomain.BaseDirectory));

  private static void Configure(IServiceCollection services, string basePath, string outputPath)
  {
    services.AddLogging(logging =>
    {
      logging.AddConsole();
      logging.SetMinimumLevel(LogLevel.Information);
    });

    var configuration = new ConfigurationBuilder()
      .SetBasePath(basePath)
      .AddJsonFile("appsettings.json", optional: false)
      .AddJsonFile("appsettings.Local.json", optional: true)
      .Build();
    services.AddSingleton<IConfiguration>(configuration);

    services.AddFlowthru(flowthru =>
    {
      flowthru.UseConfiguration(configuration);
      flowthru.RegisterCatalog(sp => new Catalog(Path.Combine(basePath, "Data"), sp.GetRequiredService<IConfiguration>()));
      flowthru.ConfigureMetadata(meta =>
        meta.AddMermaidMetadata(options => options.WithOutputDirectory(Path.Combine(basePath, "Metadata"))));

      flowthru.UsePython(python =>
      {
        python.ModuleSearchPaths.Add(basePath);
        python.ModuleSearchPaths.Add(outputPath);
        python.VenvPath = basePath;
      });

      flowthru
        .RegisterFlow<Catalog, IPythonExecutor>("Crawl", CrawlFlow.Create)
        .WithDescription("Lists the seeds' pages, and fetches their links and the webmentions they received");
      flowthru
        .RegisterFlow<Catalog, IPythonExecutor>("Analysis", AnalysisFlow.Create)
        .WithDescription("Makes a graph of sites of the crawl, summarizes each site's place in it, and exports the mention graph for the blog");
    });
  }
}
