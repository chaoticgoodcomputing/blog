// The site's configuration: the values a page, a component, an endpoint or the Astro config reads
// to know what site this is. Values only; their types, and what each setting means, are in
// site.config.types.ts, and a value of the wrong shape stops the build. Nothing here computes.
//
// The site's address is not here. It is `site` in astro.config.ts, where Astro keeps it, and is
// read as `Astro.site`, as `import.meta.env.SITE`, or as an endpoint's `context.site`. An address
// below that starts with `/` is on the site: a link on a page writes it as it is, and where a whole
// address is needed (the head, a feed) it is made whole with `new URL(path, Astro.site)`.
//
// One block per feature, each with a blank line on either side. A comment that names a ticket is a
// label, not a reserved line; a change to this file is recorded in README.md, "Working in parallel".

import type {
  AnalyticsConfig,
  BlueskyConfig,
  ConnectionsConfig,
  DiscussionConfig,
  FeedConfig,
  FooterConfig,
  GraphConfig,
  HackerNewsConfig,
  LayoutConfig,
  ListsConfig,
  PostListingConfig,
  SeoConfig,
  SiteConfig,
  TagDictionary,
  TagListConfig,
  TrailConfig,
  WebmentionsConfig,
} from "./site.config.types.ts"

export const site: SiteConfig = {
  title: "Chaotic Good Computing",
  titleSuffix: " | Spencer Elkington",
  locale: "en-US",
  author: { name: "Spencer Elkington", url: "/contact" },
  publisher: { name: "Chaotic Good Computing", url: "/contact" },
  repository: {
    url: "https://github.com/chaoticgoodcomputing/blog",
    branch: "main",
    vaultPath: "content/public",
  },
  // Off for now: a note's page has no "View source on GitHub" button.
  sourceLink: false,
  articleFolders: ["content"],
  private: {
    tags: ["private"],
    description: "This is a private note.",
    backlinks: "omit",
    explorer: "omit",
  },
  // Highlights of other sites' pages (the Annotator extension's): theirs, quoted, more than ours.
  fragments: {
    tags: ["writing/fragments"],
  },
}

// One colour for two top-level tags.
const red = "light-dark(#cc0000, #FF0000)"

export const tags: TagDictionary = {
  economics: { color: "light-dark( #B35F00, #de8200)", icon: "mdi:earth" },
  "economics/finance": { icon: "mdi:currency-usd" },
  "economics/markets": { icon: "mdi:handshake" },
  "economics/policy": { icon: "mdi:script" },
  "economics/strategy": { icon: "mdi:arrow-decision" },
  "economics/management": { icon: "mdi:account-group" },
  engineering: { color: "light-dark( #0070CC, #008CFF)", icon: "mdi:wrench" },
  "engineering/ai": { icon: "mdi:robot" },
  "engineering/bio": { icon: "mdi:dna" },
  "engineering/data": { icon: "mdi:pulse" },
  "engineering/devops": { icon: "mdi:cloud" },
  "engineering/frontend": { icon: "mdi:palette" },
  "engineering/languages": { icon: "mdi:code-braces" },
  "engineering/languages/csharp": { icon: "mdi:language-csharp" },
  "engineering/languages/lua": { icon: "mdi:language-lua" },
  "engineering/languages/python": { icon: "mdi:language-python" },
  "engineering/languages/scratch": { icon: "mdi:cat" },
  "engineering/languages/typescript": { icon: "mdi:language-typescript" },
  horticulture: { color: "light-dark( #FF00CC, #FF00CC)", icon: "mdi:flower" },
  "horticulture/seasons": { icon: "mdi:weather-sunny" },
  "horticulture/seasons/rhythm": { icon: "mdi:music-note" },
  "horticulture/seasons/systems": { icon: "mdi:connection" },
  "horticulture/seasons/stamps": { icon: "mdi:check-decagram" },
  private: { color: red, icon: "mdi:lock" },
  projects: { color: "light-dark( #CC0000, #DD0000)", icon: "mdi:source-branch" },
  "projects/dayjob": { icon: "mdi:vote" },
  "projects/flowthru": { icon: "mdi:graph-outline" },
  "projects/games": { icon: "custom:d20" },
  "projects/games/magic-atlas": { icon: "mdi:cards-outline" },
  "projects/games/roblox": { icon: "custom:roblox" },
  "projects/games/the-neighborhood": { icon: "mdi:plane-train" },
  "projects/homelab": { icon: "mdi:home-sound-out" },
  "projects/site": { icon: "custom:cgc-cpu-only" },
  "projects/site/quartz": { icon: "custom:quartz-filled" },
  "projects/teaching": { icon: "mdi:school" },
  "projects/undergrad": { icon: "custom:uofu" },
  "projects/a-pattern-language": { icon: "mdi:home-city" },
  writing: { color: "light-dark( #1A8A1A, #00FF00)", icon: "mdi:pencil" },
  "writing/notes": { icon: "mdi:sprout" },
  "writing/fragments/meetings": { icon: "mdi:microphone" },
  "writing/notes/emails": { icon: "mdi:email" },
  "writing/essays": { icon: "mdi:pine-tree" },
  "writing/fragments": { icon: "mdi:seed" },
  reading: { color: "light-dark( #128db6, #00e5ff)", icon: "mdi:book-open-blank-variant" },
  "reading/lit": { icon: "mdi:book-open-blank-variant" },
  "reading/papers": { icon: "mdi:file-document-outline" },
  "reading/web": { icon: "mdi:web" },
}

export const tagList: TagListConfig = {
  showParents: false,
}

export const footer: FooterConfig = {
  contacts: [
    // Says `rel="me"`: the GitHub profile links back to the site, which signs in to webmention.io.
    { label: "GitHub", url: "https://github.com/spelkington", me: true },
    { label: "LinkedIn", url: "https://www.linkedin.com/in/spelkington" },
    // The site's own account, which posts each new note (`bluesky` below).
    { label: "Bluesky", url: "https://bsky.app/profile/chaoticgood.computer", of: "publisher" },
    // The feed (src/pages/index.xml.ts).
    { label: "RSS", url: "/index.xml" },
  ],
  copyright: [
    { label: "Spencer Elkington", url: "https://chaoticgood.computer/contact" },
    // { label: "Chaotic Good Computing", url: "https://github.com/chaoticgoodcomputing" },
  ],
  notice: "Human writing, for human reading.",
}

export const lists: ListsConfig = { show: 5, more: 5 }

export const postListing: PostListingConfig = {
  listings: [
    { order: "recent", title: "Recent Posts" },
    { order: "central", title: "Core Posts" },
  ],
  pages: {
    // One under the other: the three newest, then the five most central essays, more on asking.
    home: {
      layout: "stacked",
      paging: { recent: { show: 3 } },
      listings: { central: { title: "Core Essays", tag: "writing/essays" } },
    },
    tag: { layout: "carousel" },
    404: { layout: "carousel" },
  },
  mentionWeight: 3,
  showTagCounts: false,
  emptyText: "No posts found.",
}

export const feed: FeedConfig = {
  limit: 40,
  // Every post is writing.
  excludedCategories: ["writing"],
  // Superfeedr's public hub: free, and the one feed readers such as Feedly and Inoreader subscribe through.
  hub: "https://pubsubhubbub.superfeedr.com/",
}

export const seo: SeoConfig = {
  description:
    "Articles for the data and engineering consulting practice Chaotic Good Computing, as well as personal notes by Spencer Elkington.",
  articleTypes: [
    { tag: "reading", type: "ScholarlyArticle", section: "Annotations" },
    { tag: "writing/notes", type: "HowTo", section: "Tutorials" },
    { tag: "writing/essays", type: "Article", section: "Articles" },
    { tag: "engineering", type: "TechArticle", section: "Engineering" },
    { tag: "economics", type: "Article", section: "Economics" },
    { tag: "horticulture", type: "BlogPosting", section: "Digital Garden" },
    { tag: "projects", type: "Report", section: "Projects" },
  ],
  defaultArticleType: "Article",
}

export const layout: LayoutConfig = {
  // About 65 characters to a line of the body font, as the New York Times sets its own: 20px text in
  // a 600px column.
  noteWidth: "37.5rem",
  noteFontSize: "1.25rem",
  // A block of code a little smaller than the text around it: 12pt is 16px.
  codeFontSize: "10pt",
  // About 35 characters to a line of a sidenote's smaller sans.
  sidenoteWidth: "10rem",
  sidenoteGap: "2rem",
}

export const trail: TrailConfig = {
  length: 4,
}

export const graph: GraphConfig = {
  // The graph column's: every note of the trail, and what is next to one.
  local: {
    depth: 1,
    focusZoom: 1.5,
    removeTags: site.private.tags,
    // A private page is never in the graph column's graph.
    privatePages: "omit",
    forces: {
      charge: -20,
      center: 0.05,
      linkDistance: { tagTag: 0.1, tagNote: 0.1, noteNote: 0.01 },
      linkStrength: { tagTag: 1.0, tagNote: 0.2, noteNote: 0.1 },
      collision: 0.1,
      trailThickness: 16,
    },
    // Never drawn, with no shell: the unit the link distances are measured in.
    shellSize: { base: 150, scaling: 15 },
    sizes: {
      tag: { base: 10, scaling: 1 },
      note: { base: 3, scaling: 3 },
      private: 0.5,
      current: 1.5,
      label: 9,
      gap: 15,
    },
    edges: {
      opacity: {
        tagTag: { min: 0.8, max: 1 },
        tagNote: { min: 0.8, max: 1 },
        noteNote: { min: 0.8, max: 1 },
      },
      style: { tagTag: "solid", tagNote: "solid", noteNote: "dotted" },
    },
    hoverPulse: { on: 800, off: 1000, delay: 200 },
  },
  global: {
    removeTags: site.private.tags,
    privatePages: "mark",
    forces: {
      charge: -20,
      center: 0.05,
      linkDistance: { tagTag: 0.1, tagNote: 0.1, noteNote: 0.01 },
      linkStrength: { tagTag: 1.0, tagNote: 0.2, noteNote: 0.1 },
      collision: 0.1,
      trailThickness: 16,
    },
    shellSize: { base: 150, scaling: 13 },
    sizes: {
      tag: { base: 10, scaling: 1 },
      note: { base: 3, scaling: 3 },
      private: 0.5,
      current: 1.5,
      label: 9,
      gap: 15,
    },
    edges: {
      opacity: {
        tagTag: { min: 0.8, max: 1 },
        tagNote: { min: 0.25, max: 1 },
        noteNote: { min: 0.8, max: 1 },
      },
      style: { tagTag: "solid", tagNote: "solid", noteNote: "dotted" },
    },
    shell: {
      pinnedTags: ["engineering", "writing", "horticulture", "projects", "economics", "reading"],
      zoomMargin: 80,
      style: { opacity: 1, lineStyle: "dotted", lineWidth: 3 },
    },
    hoverPulse: { on: 800, off: 1000, delay: 200 },
    filters: { timePeriod: "month", includePrivate: false, minPosts: 3 },
  },
}

// webmention.io receives the site's webmentions; the build reads them back (src/lib/mentions.ts).
export const webmentions: WebmentionsConfig = {
  endpoint: "https://webmention.io/blog.chaoticgood.computer/webmention",
  api: "https://webmention.io/api/mentions.jf2",
  blockedDomains: [],
  // The author's own Bluesky account (speen.us), whose likes, reposts and replies are no discussion.
  blockedAuthors: ["https://bsky.app/profile/speen.us", "did:plc:n4tz2nbbhlpmcu7gwrhioxjv"],
}

export const bluesky: BlueskyConfig = {
  handle: "chaoticgood.computer",
}

export const hackerNews: HackerNewsConfig = {
  comments: 5,
}

// What is under a note's body: its panels, in order, each with its heading (Connections.astro).
export const connections: ConnectionsConfig = {
  panels: [
    { panel: "outlinks", title: "Outgoing Links" },
    { panel: "backlinks", title: "Incoming Links" },
    { panel: "webmentions", title: "Around the Web" },
    { panel: "bluesky", title: "On Bluesky" },
    { panel: "hackerNews", title: "On Hacker News" },
  ],
}

// A note's discussion: each source on or off (src/lib/discussion.ts).
export const discussion: DiscussionConfig = {
  sources: { webmentions: true, bluesky: true, hackerNews: true },
}

export const analytics: AnalyticsConfig = {
  posthogKey: "phc_BviHJVml66FIB1RFmgeAzZpKRWA0nntGdIOo47hTA3X",
  posthogHost: "https://app.posthog.com",
  // The first that matches names the link, so a list of posts inside a panel is named for the
  // panel, and a tag badge for itself wherever it is.
  navigationSources: {
    "global-graph": "global-graph",
    "local-graph": "local-graph",
    ".search": "search",
    ".link-popover": "link-popover",
    ".tag-badge": "tag-badge",
    ".connection.outlinks": "outgoing-links",
    ".connection.backlinks": "incoming-links",
    ".posts": "post-list",
    ".prose a": "inline-link",
    ".site-title, .menu-bar-title": "site-title",
    ".site-footer": "footer",
  },
  // What Page.astro puts after a note's body: its connections, and the link to its source.
  endOfNote: '.page[data-kind="note"] .after-body',
}
