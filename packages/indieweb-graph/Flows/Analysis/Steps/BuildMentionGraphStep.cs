using Flowthru.Step;
using Flowthru.Step.Testing;
using IndiewebGraph.Data.Schemas;

namespace IndiewebGraph.Flows.Analysis.Steps;

/// <summary>
/// The mention graph, of webmention-compatible blogs only: those whose home page announces a
/// webmention endpoint, as probing recorded. Its nodes are the blogs and their posts; its edges, each
/// blog to its posts, and each post to the posts on other blogs it mentions. A mention is outgoing,
/// a link in a crawled post, or incoming, a webmention a seed received: either way from the post
/// that mentions to the post mentioned. Anything to or from a blog with no endpoint is left out,
/// a social network's post that Bridgy relays among them.
/// </summary>
[FlowthruStep]
public static class BuildMentionGraphStep
{
  /// <summary>The more telling kind first: a reply over a like, a like over a plain mention.</summary>
  static readonly string[] KindOrder = ["reply", "repost", "like", "bookmark", "rsvp", "mention"];

  public static Func<
    (IEnumerable<SeedSchema>, IEnumerable<PageSchema>, IEnumerable<LinkSchema>, IEnumerable<MentionSchema>, IEnumerable<HostSchema>),
    (IEnumerable<BlogSchema>, IEnumerable<PostSchema>, IEnumerable<BlogHasPostSchema>, IEnumerable<PostHasMentionSchema>)
  > Create() =>
    input =>
    {
      var (seeds, pages, links, mentions, hosts) = input;
      var endpoints = hosts
        .Where(host => !string.IsNullOrWhiteSpace(host.Endpoint))
        .ToDictionary(host => host.Host.Trim().ToLowerInvariant(), host => host.Endpoint!);
      var names = seeds
        .Select(seed => (Url: PostUrl(seed.Url), seed.Name))
        .Where(seed => seed.Url is not null)
        .ToDictionary(seed => HostOf(seed.Url!), seed => seed.Name);
      bool Compatible(string url) => endpoints.ContainsKey(HostOf(url));

      var seen = links
        .Select(link => (Source: PostUrl(link.SourceUrl), Target: PostUrl(link.TargetUrl), Kind: link.Kind == "link" ? "mention" : link.Kind, SeenAs: "outgoing"))
        .Concat(mentions.Select(mention => (Source: PostUrl(mention.SourceUrl), Target: PostUrl(mention.TargetUrl), mention.Kind, SeenAs: "incoming")))
        .Where(edge => edge.Source is not null && edge.Target is not null)
        .Select(edge => (Source: edge.Source!, Target: edge.Target!, edge.Kind, edge.SeenAs))
        .Where(edge => HostOf(edge.Source) != HostOf(edge.Target) && Compatible(edge.Source) && Compatible(edge.Target));

      var mentioned = seen
        .GroupBy(edge => (edge.Source, edge.Target))
        .Select(group =>
        {
          var ways = group.Select(edge => edge.SeenAs).Distinct().ToList();
          return new PostHasMentionSchema
          {
            Source = group.Key.Source,
            Target = group.Key.Target,
            Kind = group.Select(edge => edge.Kind).MinBy(Rank)!,
            SeenAs = ways.Count > 1 ? "both" : ways[0],
          };
        })
        .OrderBy(edge => edge.Source, StringComparer.Ordinal)
        .ThenBy(edge => edge.Target, StringComparer.Ordinal)
        .ToList();

      var crawled = pages
        .Select(page => PostUrl(page.Url))
        .Where(url => url is not null && Compatible(url))
        .Select(url => url!)
        .ToHashSet();
      var posts = mentioned
        .SelectMany(edge => new[] { edge.Source, edge.Target })
        .Concat(crawled)
        .Distinct()
        .Order(StringComparer.Ordinal)
        .Select(url => new PostSchema { Url = url, Crawled = crawled.Contains(url) })
        .ToList();

      var blogHasPost = posts
        .Select(post => new BlogHasPostSchema { Blog = HostOf(post.Url), Post = post.Url })
        .ToList();

      var blogs = blogHasPost
        .Select(edge => edge.Blog)
        .Distinct()
        .Order(StringComparer.Ordinal)
        .Select(host => new BlogSchema
        {
          Host = host,
          Endpoint = endpoints[host],
          Seed = names.ContainsKey(host),
          Name = names.GetValueOrDefault(host),
        })
        .ToList();

      return (blogs, posts, blogHasPost, mentioned);
    };

  static int Rank(string kind)
  {
    var rank = Array.IndexOf(KindOrder, kind);
    return rank < 0 ? KindOrder.Length : rank;
  }

  /// <summary>
  /// A post's address in one form, its id: <c>https</c>, its host lowercase and without <c>www.</c>,
  /// its query kept, and no fragment or trailing slash. None for one that isn't a web address.
  /// </summary>
  public static string? PostUrl(string? url)
  {
    if (!Uri.TryCreate(url?.Trim(), UriKind.Absolute, out var uri) || (uri.Scheme != "http" && uri.Scheme != "https"))
    {
      return null;
    }
    var host = uri.Host.ToLowerInvariant();
    if (host.StartsWith("www.", StringComparison.Ordinal))
    {
      host = host[4..];
    }
    var path = uri.AbsolutePath.Length > 1 ? uri.AbsolutePath.TrimEnd('/') : "";
    return $"https://{host}{path}{uri.Query}";
  }

  /// <summary>The host of an address <see cref="PostUrl"/> gave.</summary>
  static string HostOf(string postUrl) => new Uri(postUrl).Host;

#if FUNIT_ENABLED
  public class Tests : FUnitContext
  {
    static readonly HostSchema[] Hosts =
    [
      new() { Host = "a.example", Endpoint = "https://webmention.io/a.example/webmention", HCard = true, Probed = "2026-11-04" },
      new() { Host = "b.example", Endpoint = "https://b.example/webmention", HCard = true, Probed = "2026-11-04" },
      new() { Host = "c.example", Endpoint = null, HCard = true, Probed = "2026-11-04" },
    ];

    static readonly SeedSchema[] Seeds = [new() { Url = "https://a.example/", Name = "Ada" }];

    static readonly PageSchema[] Pages =
    [
      new() { Site = "a.example", Url = "https://a.example/one/", ListedIn = "sitemap" },
      new() { Site = "a.example", Url = "https://a.example/two", ListedIn = "sitemap" },
    ];

    static LinkSchema Link(string from, string to, string kind = "link") => new()
    {
      SourceSite = "a.example",
      SourceUrl = from,
      TargetUrl = to,
      TargetHost = new Uri(to).Host,
      Kind = kind,
    };

    static MentionSchema Mention(string from, string to, string kind = "mention") => new()
    {
      TargetSite = "a.example",
      TargetUrl = to,
      SourceUrl = from,
      SourceHost = new Uri(from).Host,
      Kind = kind,
    };

    [FUnitStepTest(typeof(BuildMentionGraphStep))]
    public void PointsFromTheMentioningPostToTheMentionedBetweenCompatibleBlogsOnly()
    {
      var links = new[]
      {
        Link("https://a.example/one/", "https://www.B.example/post/#top"),
        Link("https://a.example/one/", "https://c.example/post"),
        Link("https://a.example/one/", "https://a.example/two"),
      };
      var mentions = new[]
      {
        Mention("https://b.example/reply", "https://a.example/two", "reply"),
        Mention("https://mastodon.example/@b/1", "https://a.example/two", "like"),
      };

      var (_, _, _, edges) = Invoke(Create(), (Seeds, Pages, links, mentions, Hosts));

      Assert.That(edges.Select(edge => (edge.Source, edge.Target, edge.Kind, edge.SeenAs)), Is.EqualTo(new[]
      {
        ("https://a.example/one", "https://b.example/post", "mention", "outgoing"),
        ("https://b.example/reply", "https://a.example/two", "reply", "incoming"),
      }));
    }

    [FUnitStepTest(typeof(BuildMentionGraphStep))]
    public void SeenBothWaysIsOneEdgeOfTheMoreTellingKind()
    {
      var links = new[] { Link("https://b.example/reply", "https://a.example/two", "link") };
      var mentions = new[] { Mention("https://b.example/reply/", "https://a.example/two", "reply") };

      var (_, _, _, edges) = Invoke(Create(), (Seeds, Pages, links, mentions, Hosts));

      Assert.That(edges.Select(edge => (edge.Kind, edge.SeenAs)), Is.EqualTo(new[] { ("reply", "both") }));
    }

    [FUnitStepTest(typeof(BuildMentionGraphStep))]
    public void HasEveryCrawledAndMentionedPostUnderItsBlog()
    {
      var links = new[] { Link("https://a.example/one/", "https://b.example/post") };

      var (blogs, posts, blogHasPost, _) = Invoke(Create(), (Seeds, Pages, links, Array.Empty<MentionSchema>(), Hosts));

      Assert.That(blogs.Select(blog => (blog.Host, blog.Seed, blog.Name)), Is.EqualTo(new[] { ("a.example", true, "Ada"), ("b.example", false, (string?)null) }));
      Assert.That(posts.Select(post => (post.Url, post.Crawled)), Is.EqualTo(new[]
      {
        ("https://a.example/one", true),
        ("https://a.example/two", true),
        ("https://b.example/post", false),
      }));
      Assert.That(blogHasPost.Select(edge => (edge.Blog, edge.Post)), Is.EqualTo(new[]
      {
        ("a.example", "https://a.example/one"),
        ("a.example", "https://a.example/two"),
        ("b.example", "https://b.example/post"),
      }));
    }
  }
#endif
}
