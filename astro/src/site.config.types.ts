// The shape of the site's configuration: one type for each block of site.config.ts, which holds the
// values. Types only; nothing here is a value, so a change of setting never touches this file, and a
// value of the wrong shape is a type error, which stops the build (`astro:build` depends on
// `astro:check`).
//
// One block per feature, in site.config.ts's order, each with a blank line on either side. What a
// setting means is said here, once; site.config.ts says only why a value is what it is.

/** How something that lists pages treats a private page: leaves it out, or shows it marked. */
export type PrivateTreatment = "omit" | "mark"

/** Someone the site names, and the page that says who they are. */
export interface SiteParty {
  name: string
  url: string
}
/** What site this is: its name, whose it is, where its source is, and which pages are private. */
export interface SiteConfig {
  title: string
  /** Follows every page's title in its `<title>`. */
  titleSuffix: string
  locale: string
  author: SiteParty
  publisher: SiteParty
  /**
   * Where the vault's files are on GitHub: `<url>/blob/<branch>/<a file's path in the repository>`.
   * In the assembled vault, a file's path is its source file's, as the manifest names it
   * (src/lib/source-link.ts); in any other vault, `<vaultPath>/<its path in the vault>`.
   */
  repository: { url: string; branch: string; vaultPath: string }
  /** A note under one of these folders of the vault is an article: what the feed holds. */
  articleFolders: string[]
  private: {
    /** The private tags. A page under one of them, or under a tag under one, is a private page. */
    tags: string[]
    backlinks: PrivateTreatment
    explorer: PrivateTreatment
  }
}

/** What the tag dictionary holds for one tag. A tag without either takes its nearest ancestor's. */
export interface TagDefinition {
  /** Any colour value CSS accepts, `light-dark()` included. */
  color?: string
  /**
   * An icon id, `prefix:name`: `mdi:robot` from Material Design Icons, or `custom:d20` from the
   * site's own SVG files, `src/icons/d20.svg` (docs/adr/1101).
   */
  icon?: string
}
/**
 * The tag dictionary, by tag slug: one entry for each tag that is drawn differently from its
 * parent. Every other tag takes its nearest ancestor's colour and icon (src/lib/tag-dictionary.ts),
 * and a tag with neither in its lineage is drawn without them. The build reports an entry that no
 * note's tag is, or is under, and fails on an icon id no collection has.
 */
export type TagDictionary = Record<string, TagDefinition>

/** The tag badges under a note's title, and those a tag page links to. */
export interface TagListConfig {
  /**
   * Whether each tag's ancestors are shown too, each before the tags under it. On a tag page, the
   * ancestors of its tag, before its subtags.
   */
  showParents: boolean
}

/** A link the site writes out: what it reads as, and where it goes. */
export interface SiteLink {
  label: string
  url: string
}
/**
 * The footer: its links, in order, and who the copyright line names. The holders are `site.author`
 * and `site.publisher`, each linked where the footer has always linked them, which is not their
 * `url`, the page that says who they are.
 */
export interface FooterConfig {
  links: SiteLink[]
  copyright: SiteLink[]
}

/**
 * The post listing, after the body of the home page, a tag page and the 404 page: posts, newest
 * first. A private page is in none (src/lib/post-listing.ts).
 */
export interface PostListingConfig {
  /** Its heading. */
  title: string
  /** How many posts a listing shows until the reader asks for the rest. */
  collapsedItemCount: number
  /** Whether each post's tag badges say how many posts are under the tag. */
  showTagCounts: boolean
  /** What a listing with no posts says. */
  emptyText: string
}

/**
 * The feed, at `/index.xml` (docs/adr/1501): the site's newest articles that are posts. What the
 * channel says it is names the limit and the site's title, "Last 40 notes on …".
 */
export interface FeedConfig {
  /** The most articles it holds. */
  limit: number
}

/**
 * The schema.org type an article's page says it is, in its JSON-LD. Every one but `HowTo` is an
 * Article in schema.org, and only an Article has a section there.
 */
export type ArticleType = "Article" | "BlogPosting" | "HowTo" | "Report" | "ScholarlyArticle" | "TechArticle"
/** A note under `tag`, or under a tag under it, is a `type`, in `section`. */
export interface ArticleTypeRule {
  tag: string
  type: ArticleType
  section: string
}
/**
 * What a page's head tells search engines and link previews. The author and publisher it names are
 * `site.author` and `site.publisher`, and its logo is the site's icon.
 */
export interface SeoConfig {
  /** A page's description when it has none of its own: what the site is. */
  description: string
  /** The rules that give an article its type and section. The first whose tag the note is under wins. */
  articleTypes: ArticleTypeRule[]
  /** An article's type when no rule matches. It has no section. */
  defaultArticleType: ArticleType
}

/**
 * The tag explorer in the left sidebar: the site's tags as a tree, each with the notes under it. A
 * private page in it is left out or marked, as `site.private.explorer` says.
 */
export interface TagExplorerConfig {
  /** Its heading, which also names the button that opens it as a drawer on a narrow screen. */
  title: string
}

/**
 * The three kinds of edge in a graph: a tag to a tag under it, a note to a tag it carries, a note
 * to a note it links to.
 */
export type EdgeKind = "tagTag" | "tagNote" | "noteNote"
/** One value for each kind of edge. */
export type PerEdge<T> = Record<EdgeKind, T>
/** How a node's radius, in CSS pixels, grows: `base + scaling × √n`. */
export interface NodeSize {
  base: number
  scaling: number
}
/**
 * One graph's settings: what it draws, and the forces, sizes and opacities it is drawn with. The
 * forces are d3-force's (src/lib/graph-layout.ts).
 */
export interface GraphSettings {
  /** Tags left out, as tag slugs, each with every tag under it. A note under one is still drawn. */
  removeTags: string[]
  /** Whether a private page is left out, or drawn, smaller by `sizes.private` and marked as one. */
  privatePages: PrivateTreatment
  forces: {
    /** Each node's many-body strength: below zero, it pushes every other node away. */
    charge: number
    /** How strongly the graph is pulled to the middle of its box. */
    center: number
    /**
     * Each kind of edge's length at rest, as a share of the shell's diameter (`shellSize`): at 1,
     * an edge reaches right across the shell.
     */
    linkDistance: PerEdge<number>
    /** How strongly each kind of edge pulls towards its length. */
    linkStrength: PerEdge<number>
  }
  sizes: {
    /** A tag's radius, by how many notes in the graph are under it. */
    tag: NodeSize
    /** A note's radius, by how many edges it has in the graph. */
    note: NodeSize
    /** A private page's radius, as a share of a public page's. */
    private: number
    /** How far the page's own node swells and shrinks, as a multiple of its radius. */
    current: number
    /** A label's size in the graph, in CSS pixels, which the view zooms with everything else. */
    label: number
  }
  edges: {
    /** Each kind's opacity: `max` at half its length or nearer, `min` at twice it or further. */
    opacity: PerEdge<{ min: number; max: number }>
    style: PerEdge<"solid" | "dotted">
  }
  /**
   * The shell's radius, in CSS pixels, by how many nodes the graph has: `base + scaling × √n`. Every
   * graph has a shell size, the unit its link distances are measured in, though only a graph with
   * `shell` draws the ring or pins tags to it.
   */
  shellSize: NodeSize
  /** A ring the chosen top-level tags are pinned to, which the notes settle around. */
  shell?: ShellSettings
  /** How a hovered node's lit edges pulse. With none, they are lit whole. */
  hoverPulse?: HoverPulse
}
/**
 * The pseudo-shell: a ring through the middle of the graph's box, `shellSize` in radius, which the
 * pinned tags are fixed on, evenly spaced. Each note is pulled towards its tags, so the
 * notes settle in a shell around each one.
 */
export interface ShellSettings {
  /** The tags fixed on the ring, as tag slugs, in their order round it. */
  pinnedTags: string[]
  /** The room kept round the ring when the view fits the graph to its box, in the graph's pixels. */
  zoomMargin: number
  /** How the ring is drawn, in the palette's `--lightgray`. */
  style: { opacity: number; lineStyle: "solid" | "dotted"; lineWidth: number }
}
/**
 * A pulse along a hovered node's lit edges, in milliseconds: each swells and fades over `on`, rests
 * faint for `off`, and starts `delay` later for each tag further down a hovered tag's subtags.
 */
export interface HoverPulse {
  on: number
  off: number
  delay: number
}
/** The local graph's settings: a graph's, with how far from the page it reaches. */
export interface LocalGraphSettings extends GraphSettings {
  /** How many edges from the page a node may be, and be drawn. Below zero, every node is. */
  depth: number
}
/** Which notes the global graph draws, by date: those of the last month, of the last year, or all. */
export type TimePeriod = "month" | "year" | "all"
/** The global graph's settings: a graph's, with the filters it opens with. */
export interface GlobalGraphSettings extends GraphSettings {
  shell: ShellSettings
  hoverPulse: HoverPulse
  filters: {
    /** The period it opens on, widened until it holds `minPosts` posts: to a year, then to all. */
    timePeriod: TimePeriod
    /** Whether it opens with private pages drawn. A reader may choose otherwise. */
    includePrivate: boolean
    minPosts: number
  }
}
/**
 * Tickets 22 and 23: the local graph's settings, then the global graph's. How a graph treats a
 * private page is among them, and not under `site.private`: the global graph lets a reader choose
 * whether private pages are shown, which neither "omit" nor "mark" says.
 */
export interface GraphConfig {
  /** The graph in a page's right sidebar: the page, the notes it links to and from, and their tags. */
  local: LocalGraphSettings
  /**
   * The graph of every note and tag, in a dialog opened from the local graph. Its `privatePages` is
   * how a private page is drawn when the reader has asked for them.
   */
  global: GlobalGraphSettings
}

/** What one subscribe box says above its form. */
export interface SubscribeWording {
  title: string
  description: string
}
/**
 * The newsletter: the Buttondown list a subscribe box's form posts to, and what each box says. The
 * box under a note asks for more; the one in the sidebar of the home page and a tag page is
 * headed as a sidebar section is.
 */
export interface SubscribeConfig {
  /** The Buttondown newsletter's username, which names its list. */
  buttondown: string
  underNote: SubscribeWording
  sidebar: SubscribeWording
}

/**
 * The social cards, in the home page's right sidebar on a desktop: the site owner's year of
 * contributions on GitHub, and their latest posts on Bluesky. Each is fetched in the reader's
 * browser, so the build asks neither host for anything.
 */
export interface SocialConfig {
  github: {
    /** The GitHub user whose contributions the card shows. */
    username: string
    /** The card's heading. */
    title: string
    /**
     * The calendar's five colours, a colour value each, from a day with no contributions to the
     * busiest: the contributions API's five levels.
     */
    levelColors: [string, string, string, string, string]
  }
  bluesky: {
    /** The Bluesky account whose posts the card shows, by handle. */
    handle: string
    /** The card's heading. */
    title: string
    /** How many of the latest posts it shows, from 1 to 100. */
    postLimit: number
    /** Whether each post shows its reply, repost and like counts. */
    showMetrics: boolean
  }
}

/**
 * Analytics, sent to PostHog: a page view for each page shown, and for each link the client router
 * follows, the kind of link it was. Never from the dev server, and never for a reader whose browser
 * asks not to be tracked.
 */
export interface AnalyticsConfig {
  /** The PostHog project's key, `phc_…`. It is public: every page carries it. */
  posthogKey: string
  /** Where PostHog is reached. Its library is fetched from there, or from PostHog's asset host. */
  posthogHost: string
  /**
   * The kinds of link, each a CSS selector and the name a `navigation` event records for a link
   * that matches it or is inside what matches it. The first that matches, in this order, names the
   * link; a link none matches is `other`.
   */
  navigationSources: Record<string, string>
}
