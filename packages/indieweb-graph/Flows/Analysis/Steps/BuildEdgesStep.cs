using Flowthru.Step;
using Flowthru.Step.Testing;
using IndiewebGraph.Data.Schemas;

namespace IndiewebGraph.Flows.Analysis.Steps;

/// <summary>
/// The graph's edges: a crawled site's links to each other site, and the webmentions each other
/// site sent it, counted by kind. A site's links to itself, and anything to or from a host on the
/// blocklist or a subdomain of one, are no edge.
/// </summary>
[FlowthruStep]
public static class BuildEdgesStep
{
  public static Func<(IEnumerable<LinkSchema>, IEnumerable<MentionSchema>, IEnumerable<BlockedHostSchema>), IEnumerable<EdgeSchema>> Create() =>
    input =>
    {
      var (links, mentions, blocklist) = input;
      var blocked = blocklist.Select(entry => entry.Host.Trim().ToLowerInvariant()).ToList();
      bool IsBlocked(string host) =>
        blocked.Any(entry => host == entry || host.EndsWith("." + entry, StringComparison.Ordinal));

      var seen = links
        .Select(link => (Source: link.SourceSite, Target: link.TargetHost, link.Kind, SeenAs: "link"))
        .Concat(mentions.Select(mention => (Source: mention.SourceHost, Target: mention.TargetSite, mention.Kind, SeenAs: "webmention")));

      return seen
        .Where(edge => edge.Source != edge.Target && !IsBlocked(edge.Source) && !IsBlocked(edge.Target))
        .GroupBy(edge => edge)
        .Select(group => new EdgeSchema
        {
          Source = group.Key.Source,
          Target = group.Key.Target,
          Kind = group.Key.Kind,
          SeenAs = group.Key.SeenAs,
          Count = group.Count(),
        })
        .OrderByDescending(edge => edge.Count)
        .ThenBy(edge => edge.Source, StringComparer.Ordinal)
        .ThenBy(edge => edge.Target, StringComparer.Ordinal)
        .ToList();
    };

#if FUNIT_ENABLED
  public class Tests : FUnitContext
  {
    static LinkSchema Link(string target, string kind = "link") => new()
    {
      SourceSite = "a.example",
      SourceUrl = "https://a.example/post",
      TargetUrl = $"https://{target}/",
      TargetHost = target,
      Kind = kind,
    };

    static MentionSchema Mention(string source, string kind = "mention") => new()
    {
      TargetSite = "a.example",
      TargetUrl = "https://a.example/post",
      SourceUrl = $"https://{source}/reply",
      SourceHost = source,
      Kind = kind,
    };

    static readonly BlockedHostSchema[] Blocklist = [new() { Host = "twitter.com" }, new() { Host = "Wikipedia.org " }];

    [FUnitStepTest(typeof(BuildEdgesStep))]
    public void CountsLinksAndMentionsByKindAndDirection()
    {
      var links = new[] { Link("b.example"), Link("b.example"), Link("b.example", "reply") };
      var mentions = new[] { Mention("b.example", "reply"), Mention("c.example") };

      var edges = Invoke(Create(), (links, mentions, Blocklist))
        .Select(edge => (edge.Source, edge.Target, edge.Kind, edge.SeenAs, edge.Count))
        .ToList();

      Assert.That(edges, Is.EqualTo(new[]
      {
        ("a.example", "b.example", "link", "link", 2),
        ("a.example", "b.example", "reply", "link", 1),
        ("b.example", "a.example", "reply", "webmention", 1),
        ("c.example", "a.example", "mention", "webmention", 1),
      }));
    }

    [FUnitStepTest(typeof(BuildEdgesStep))]
    public void LeavesOutBlockedHostsTheirSubdomainsAndTheSiteItself()
    {
      var links = new[] { Link("twitter.com"), Link("en.wikipedia.org"), Link("a.example"), Link("notwikipedia.org") };

      var targets = Invoke(Create(), (links, Array.Empty<MentionSchema>(), Blocklist)).Select(edge => edge.Target);

      Assert.That(targets, Is.EqualTo(new[] { "notwikipedia.org" }));
    }
  }
#endif
}
