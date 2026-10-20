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
  FeedConfig,
  FooterConfig,
  GraphConfig,
  PostListingConfig,
  SeoConfig,
  SiteConfig,
  SocialConfig,
  SubscribeConfig,
  TagDictionary,
  TagExplorerConfig,
  TagListConfig,
} from "./site.config.types.ts"

export const site: SiteConfig = {
  title: "Chaotic Good Computing",
  titleSuffix: " | Spencer Elkington",
  locale: "en-US",
  author: { name: "Spencer Elkington", url: "/about" },
  publisher: { name: "Chaotic Good Computing", url: "/about" },
  repository: {
    url: "https://github.com/chaoticgoodcomputing/blog",
    branch: "main",
    vaultPath: "content/public",
  },
  articleFolders: ["content"],
  private: {
    tags: ["private"],
    backlinks: "omit",
    explorer: "omit",
  },
}

// One colour for two top-level tags.
const red = "light-dark(#cc0000, #FF0000)"

export const tags: TagDictionary = {
  economics: { color: "light-dark(#b35f00, #de8200)", icon: "mdi:earth" },
  "economics/finance": { icon: "mdi:currency-usd" },
  "economics/markets": { icon: "mdi:handshake" },
  "economics/policy": { icon: "mdi:script" },
  "economics/strategy": { icon: "mdi:arrow-decision" },
  engineering: { color: "light-dark(#0070cc, #008CFF)", icon: "mdi:wrench" },
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
  horticulture: { color: "light-dark(#1a8a1a, #00FF00)", icon: "mdi:flower" },
  "horticulture/seasons": { icon: "mdi:weather-sunny" },
  "horticulture/seasons/rhythm": { icon: "mdi:music-note" },
  "horticulture/seasons/systems": { icon: "mdi:connection" },
  private: { color: red, icon: "mdi:lock" },
  projects: { color: red, icon: "mdi:source-branch" },
  "projects/dayjob": { icon: "mdi:vote" },
  "projects/flowthru": { icon: "mdi:graph-outline" },
  "projects/games": { icon: "custom:d20" },
  "projects/games/magic-atlas": { icon: "mdi:cards-outline" },
  "projects/games/roblox": { icon: "custom:roblox" },
  "projects/games/the-neighborhood": { icon: "mdi:city" },
  "projects/homelab": { icon: "mdi:home-sound-out" },
  "projects/site": { icon: "custom:quartz-filled" },
  "projects/teaching": { icon: "mdi:school" },
  "projects/undergrad": { icon: "custom:uofu" },
  writing: { color: "light-dark(#9a7400, #FFD637)", icon: "mdi:pencil" },
  "writing/notes": { icon: "mdi:sprout" },
  "writing/annotations": { icon: "mdi:chat-plus" },
  "writing/annotations/a-pattern-language": { icon: "mdi:home-city" },
  "writing/annotations/meetings": { icon: "mdi:account-group" },
  "writing/notes/emails": { icon: "mdi:email" },
  "writing/essays": { icon: "mdi:pine-tree" },
  "writing/fragments": { icon: "mdi:seed" },
  "writing/notes": { icon: "mdi:map" },
}

export const tagList: TagListConfig = {
  showParents: false,
}

export const footer: FooterConfig = {
  links: [
    { label: "Contact", url: "/contact" },
    { label: "GitHub", url: "https://github.com/spelkington" },
    { label: "LinkedIn", url: "https://www.linkedin.com/in/spelkington" },
    { label: "Privacy Policy", url: "https://chaoticgood.computer/privacy" },
    { label: "AI Policy", url: "https://chaoticgood.computer/ai-policy" },
  ],
  copyright: [
    { label: "Spencer Elkington", url: "https://chaoticgood.computer/contact" },
    { label: "Chaotic Good Computing", url: "https://github.com/chaoticgoodcomputing" },
  ],
}

export const postListing: PostListingConfig = {
  title: "Recent Posts",
  collapsedItemCount: 5,
  showTagCounts: false,
  emptyText: "No posts found.",
}

export const feed: FeedConfig = {
  limit: 40,
}

export const seo: SeoConfig = {
  description:
    "Articles for the data and engineering consulting practice Chaotic Good Computing, as well as personal notes by Spencer Elkington.",
  articleTypes: [
    { tag: "writing/annotations", type: "ScholarlyArticle", section: "Annotations" },
    { tag: "writing/notes", type: "HowTo", section: "Tutorials" },
    { tag: "writing/essays", type: "Article", section: "Articles" },
    { tag: "engineering", type: "TechArticle", section: "Engineering" },
    { tag: "economics", type: "Article", section: "Economics" },
    { tag: "horticulture", type: "BlogPosting", section: "Digital Garden" },
    { tag: "projects", type: "Report", section: "Projects" },
  ],
  defaultArticleType: "Article",
}

export const tagExplorer: TagExplorerConfig = {
  title: "Tag Explorer",
}

export const graph: GraphConfig = {
  local: {
    depth: 1,
    // The private tags, and every tag under one.
    removeTags: site.private.tags,
    privatePages: "mark",
    forces: {
      charge: -200,
      center: 0.5,
      linkDistance: { tagTag: 50, tagNote: 50, noteNote: 50 },
      linkStrength: { tagTag: 0.3, tagNote: 0.3, noteNote: 0.3 },
    },
    sizes: {
      tag: { base: 10, scaling: 1 },
      note: { base: 10, scaling: 2 },
      private: 0.8,
      current: 1.4,
      // The Quartz site's: its `fontSize`, 0.6 of 15px, over its `scale`, 0.55.
      label: 16.36,
    },
    edges: {
      // An edge from a note to a tag pulls the two together, and is never seen.
      opacity: { tagTag: { min: 1, max: 1 }, tagNote: { min: 0, max: 0 }, noteNote: { min: 1, max: 1 } },
      style: { tagTag: "solid", tagNote: "solid", noteNote: "dotted" },
    },
  },
  global: {
    removeTags: site.private.tags,
    privatePages: "mark",
    forces: {
      charge: -500,
      center: 0.05,
      linkDistance: { tagTag: 20, tagNote: 60, noteNote: 20 },
      linkStrength: { tagTag: 0.5, tagNote: 0.5, noteNote: 0.5 },
    },
    sizes: {
      tag: { base: 20, scaling: 1.2 },
      note: { base: 10, scaling: 1 },
      private: 0.8,
      current: 1.4,
      label: 11.25,
    },
    edges: {
      opacity: {
        tagTag: { min: 0.99, max: 1 },
        tagNote: { min: 0.5, max: 1 },
        noteNote: { min: 0.2, max: 1 }
      },
      style: { tagTag: "solid", tagNote: "solid", noteNote: "dotted" },
    },
    shell: {
      pinnedTags: ["engineering", "writing", "horticulture", "projects", "economics"],
      radiusBase: 150,
      radiusScale: 50,
      zoomMargin: 80,
      circumferentialRepulsion: 1,
      style: { opacity: 1, lineStyle: "dotted", lineWidth: 3 },
    },
    hoverPulse: { on: 800, off: 1000, delay: 200 },
    filters: { timePeriod: "month", includePrivate: false, minPosts: 3 },
  },
}

export const subscribe: SubscribeConfig = {
  buttondown: "chaoticgoodcomputing",
  underNote: {
    title: "Subscribe for more!",
    description: "Be notified about new highlights and cool updates!",
  },
  sidebar: {
    title: "Newsletter",
    description: "Occasional emails with highlights and updates.",
  },
}

export const social: SocialConfig = {
  github: {
    username: "spelkington",
    title: "GitHub Activity",
    // GitHub's own calendar colours, in either scheme.
    levelColors: [
      "light-dark(#ebedf0, #161b22)",
      "light-dark(#9be9a8, #0e4429)",
      "light-dark(#40c463, #006d32)",
      "light-dark(#30a14e, #26a641)",
      "light-dark(#216e39, #39d353)",
    ],
  },
  bluesky: {
    handle: "speen.us",
    title: "ATProto Feed",
    postLimit: 5,
    showMetrics: false,
  },
}

export const analytics: AnalyticsConfig = {
  posthogKey: "phc_BviHJVml66FIB1RFmgeAzZpKRWA0nntGdIOo47hTA3X",
  posthogHost: "https://app.posthog.com",
  navigationSources: {
    ".tag-explorer": "tag-explorer",
    ".tag-badge": "tag-badge",
    ".prose a": "inline-link",
  },
}
