# IndieWeb Graph

> [!NOTE]
> Who on the IndieWeb points at whom?

This project maps who links to whom across a handful of personal sites, by crawling their posts
and the webmentions those posts received.

This project:

- Crawls each seed site in Python: lists its pages from its sitemaps and feeds, reads the links
  out of their content, and asks [webmention.io](https://webmention.io/) for the webmentions they
  received, where the site uses it.
- Probes the sites the seeds point at, and adds those that show no sign of being someone's
  IndieWeb site (no webmention endpoint, no h-card) to the blocklist, for this run and the next.
- Analyzes the crawl in C#: counts the links and mentions between sites by kind, without the
  blocklisted platforms, and summarizes each site's place in the graph.

It's a [Flowthru](https://github.com/chaoticgoodcomputing/flowthru) project, patterned on the
[SpaceflightsPython](https://github.com/chaoticgoodcomputing/flowthru/tree/main/examples/starter/SpaceflightsPython)
starter. [CONTEXT.md](./CONTEXT.md) defines its terms.

## Getting Started

It needs the .NET 10 SDK and [`uv`](https://docs.astral.sh/uv/). From the repo root, set up the
Python environment and the seeds, then crawl and analyze:

```bash
pnpm nx run @chaoticgoodcomputing/indieweb-graph:setup
pnpm nx run @chaoticgoodcomputing/indieweb-graph:crawl
pnpm nx run @chaoticgoodcomputing/indieweb-graph:analyze
```

`setup` copies [`seeds.sample.json`](./Data/_01_Raw/seeds.sample.json) to `Data/_01_Raw/seeds.json`,
your own list of seeds, which isn't committed. The graph lands in `Data/_02_Primary/edges.csv`, and
each site's summary in `Data/_03_Reporting/sites.csv`. The mention graph, of webmention-compatible
blogs only, is four tables in `Data/_02_Primary`: `blogs.csv` and `posts.csv`, its nodes, and
`blog_has_post.csv` and `post_has_mention.csv`, its edges, the latter from the mentioning post to
the mentioned.

## Concepts

- **Python steps that fetch:** the [Crawl flow](./Flows/Crawl/CrawlFlow.cs) runs
  [`@step` functions](./Flows/Crawl/Steps/discover_pages.py) between typed catalog items. None is
  cacheable, since each does I/O; a re-run is cheap through [their own HTTP cache](./Flows/Crawl/Steps/fetching.py)
  instead, which also throttles each host and follows robots.txt.
- **C# steps that count:** the [Analysis flow](./Flows/Analysis/AnalysisFlow.cs) reads the crawl's
  Parquet back into typed records for [BuildEdges](./Flows/Analysis/Steps/BuildEdgesStep.cs),
  [SummarizeSites](./Flows/Analysis/Steps/SummarizeSitesStep.cs) and
  [BuildMentionGraph](./Flows/Analysis/Steps/BuildMentionGraphStep.cs), one step with four outputs,
  whose tests sit beside them (Flowthru.FUnit).
- **Hand-kept data as catalog items:** the [seeds](./Data/Schemas/SeedSchema.cs) and the
  hand-kept rows of the blocklist are inputs in the [catalog](./Data/Catalog.cs) like any
  crawled data, so a change to either reruns what depends on it.
- **A file read and written by one run:** the [blocklist](./Data/_01_Raw/blocklist.csv) is two
  catalog items, `Blocklist` and `ProbedBlocklist`, so [ProbeHosts](./Flows/Crawl/Steps/probe_hosts.py)
  reads it and writes it back with its findings, which BuildEdges and the next run read. The
  hosts it probed, with their webmention endpoints, are kept the same way, in `Hosts` and
  `ProbedHosts`.
- **Options bound from configuration:** how politely to crawl is
  [`CrawlOptions`](./Data/Schemas/CrawlOptions.cs), from [`appsettings.json`](./appsettings.json).

## Structure

### Diagram

<!-- flowthru:mermaid:start -->
```mermaid
flowchart TB

    %% External Data Inputs
    Blocklist[("Blocklist")]
    CrawlOptions{{"CrawlOptions"}}
    Hosts[("Hosts")]
    Seeds[("Seeds")]

    subgraph Analysis["Analysis"]
        BuildEdges["BuildEdges"]
        Edges[("Edges")]
        BuildMentionGraph["BuildMentionGraph"]
        Blogs[("Blogs")]
        Posts[("Posts")]
        BlogHasPost[("BlogHasPost")]
        PostHasMention[("PostHasMention")]
        SummarizeSites["SummarizeSites"]
        SiteSummaries[("SiteSummaries")]
    end

    subgraph Crawl["Crawl"]
        DiscoverPages["DiscoverPages<br>──<br>IPythonExecutor"]
        Pages[("Pages")]
        ExtractLinks["ExtractLinks<br>──<br>IPythonExecutor"]
        Links[("Links")]
        FetchMentions["FetchMentions<br>──<br>IPythonExecutor"]
        Mentions[("Mentions")]
        ProbeHosts["ProbeHosts<br>──<br>IPythonExecutor"]
        ProbedBlocklist[("ProbedBlocklist")]
        ProbedHosts[("ProbedHosts")]
    end

    %% Service legend
    subgraph service_legend["services"]
        svc_Flowthru_Step_Python_IPythonExecutor["IPythonExecutor<br>• cache: neutral<br>• cap: 1"]
    end
    style service_legend fill:#EEF4FF,stroke:#3B6FB0
    classDef serviceNode fill:#EEF4FF,stroke:#3B6FB0
    class svc_Flowthru_Step_Python_IPythonExecutor serviceNode

    %% Edges
    Seeds --> DiscoverPages
    CrawlOptions --> DiscoverPages
    DiscoverPages --> Pages
    Pages --> ExtractLinks
    CrawlOptions --> ExtractLinks
    ExtractLinks --> Links
    Pages --> FetchMentions
    CrawlOptions --> FetchMentions
    FetchMentions --> Mentions
    Pages --> ProbeHosts
    Links --> ProbeHosts
    Mentions --> ProbeHosts
    Seeds --> ProbeHosts
    Blocklist --> ProbeHosts
    Hosts --> ProbeHosts
    CrawlOptions --> ProbeHosts
    ProbeHosts --> ProbedBlocklist
    ProbeHosts --> ProbedHosts
    Links --> BuildEdges
    Mentions --> BuildEdges
    ProbedBlocklist --> BuildEdges
    BuildEdges --> Edges
    Seeds --> BuildMentionGraph
    Pages --> BuildMentionGraph
    Links --> BuildMentionGraph
    Mentions --> BuildMentionGraph
    ProbedHosts --> BuildMentionGraph
    BuildMentionGraph --> Blogs
    BuildMentionGraph --> Posts
    BuildMentionGraph --> BlogHasPost
    BuildMentionGraph --> PostHasMention
    Edges --> SummarizeSites
    SummarizeSites --> SiteSummaries

```
<!-- flowthru:mermaid:end -->

### Files

<!-- flowthru:filetree:start -->
```
indieweb-graph/
├── .gitignore
├── .python-version
├── appsettings.json
├── CONTEXT.md
├── Directory.Packages.props
├── IndiewebGraph.csproj
├── Program.cs
├── project.json
├── pyproject.toml
├── README.md
├── uv.lock
├── Data/
│   ├── Catalog.cs
│   ├── _01_Raw/
│   │   ├── blocklist.csv
│   │   └── seeds.sample.json
│   └── Schemas/
│       ├── BlockedHostSchema.cs
│       ├── BlogHasPostSchema.cs
│       ├── BlogSchema.cs
│       ├── CrawlOptions.cs
│       ├── EdgeSchema.cs
│       ├── HostSchema.cs
│       ├── LinkSchema.cs
│       ├── MentionSchema.cs
│       ├── PageSchema.cs
│       ├── PostHasMentionSchema.cs
│       ├── PostSchema.cs
│       ├── SeedSchema.cs
│       └── SiteSummarySchema.cs
├── Flows/
│   ├── Analysis/
│   │   ├── AnalysisFlow.cs
│   │   └── Steps/
│   │       ├── BuildEdgesStep.cs
│   │       ├── BuildMentionGraphStep.cs
│   │       └── SummarizeSitesStep.cs
│   └── Crawl/
│       ├── CrawlFlow.cs
│       └── Steps/
│           ├── __init__.py
│           ├── discover_pages.py
│           ├── extract_links.py
│           ├── fetch_mentions.py
│           ├── fetching.py
│           ├── parsing.py
│           └── probe_hosts.py
├── scripts/
│   └── sync-readme.mjs
└── tests/
    └── python/
        └── test_parsing.py
```
<!-- flowthru:filetree:end -->
