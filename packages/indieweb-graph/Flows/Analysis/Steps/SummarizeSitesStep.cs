using Flowthru.Step;
using Flowthru.Step.Testing;
using IndiewebGraph.Data.Schemas;

namespace IndiewebGraph.Flows.Analysis.Steps;

/// <summary>
/// Each site of the graph: how much it points at others and they at it, how many sites it is
/// connected to, and how many of those point both ways. The most connected first.
/// </summary>
[FlowthruStep]
public static class SummarizeSitesStep
{
  public static Func<IEnumerable<EdgeSchema>, IEnumerable<SiteSummarySchema>> Create() =>
    input =>
    {
      var edges = input.ToList();
      var sites = edges.SelectMany(edge => new[] { edge.Source, edge.Target }).Distinct();

      return sites
        .Select(site =>
        {
          var outgoing = edges.Where(edge => edge.Source == site).ToList();
          var incoming = edges.Where(edge => edge.Target == site).ToList();
          var pointsAt = outgoing.Select(edge => edge.Target).ToHashSet();
          var pointedAtBy = incoming.Select(edge => edge.Source).ToHashSet();
          return new SiteSummarySchema
          {
            Site = site,
            Outgoing = outgoing.Sum(edge => edge.Count),
            Incoming = incoming.Sum(edge => edge.Count),
            Neighbours = pointsAt.Union(pointedAtBy).Count(),
            Mutual = pointsAt.Intersect(pointedAtBy).Count(),
          };
        })
        .OrderByDescending(summary => summary.Outgoing + summary.Incoming)
        .ThenBy(summary => summary.Site, StringComparer.Ordinal)
        .ToList();
    };

#if FUNIT_ENABLED
  public class Tests : FUnitContext
  {
    static EdgeSchema Edge(string source, string target, int count) =>
      new() { Source = source, Target = target, Kind = "link", SeenAs = "link", Count = count };

    [FUnitStepTest(typeof(SummarizeSitesStep))]
    public void CountsEachSitesEdgesAndWhichPointBothWays()
    {
      var edges = new[] { Edge("a.example", "b.example", 3), Edge("b.example", "a.example", 1), Edge("a.example", "c.example", 2) };

      var summaries = Invoke(Create(), edges)
        .Select(site => (site.Site, site.Outgoing, site.Incoming, site.Neighbours, site.Mutual))
        .ToList();

      Assert.That(summaries, Is.EqualTo(new[]
      {
        ("a.example", 5, 1, 2, 1),
        ("b.example", 1, 3, 1, 1),
        ("c.example", 0, 2, 1, 0),
      }));
    }
  }
#endif
}
