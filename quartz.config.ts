import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

const RED = "#FF0000"
const ORANGE = "#de8200"
const YELLOW = "#FFD637"
const GREEN = "#00FF00"
const BLUE = "#008CFF"
const PINK = "#FF69B4"
const VIOLET = "#8A2BE2"

/**
 * Quartz 4 Configuration
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "Chaotic Good Computing",
    pageTitleSuffix: " | Spencer Elkington",
    enableSPA: true,
    enablePopovers: true,
    analytics: {
      provider: "plausible",
    },
    locale: "en-US",
    baseUrl: "blog.chaoticgood.computer",
    repoUrl: "https://github.com/chaoticgoodcomputing/chaoticgoodcomputing.github.io/blob/main",
    ignorePatterns: ["private", "templates", ".obsidian"],
    defaultDateType: "modified",
    tags: {
      colors: [
        // Top-level categories
        { tag: "horticulture", color: PINK },
        { tag: "engineering", color: GREEN },
        { tag: "economics", color: ORANGE },
        { tag: "projects", color: BLUE },
        { tag: "writing", color: VIOLET },
        { tag: "private", color: RED },
      ],
      icons: [
        
        // Specific Projects
        { tag: "projects/games/roblox", icon: "custom:roblox" },
        { tag: "projects/games/magic-atlas", icon: "mdi:cards-outline" },
        { tag: "projects/flowthru", icon: "mdi:graph-outline" },
        { tag: "projects/homelab", icon: "mdi:home-sound-out" },
        
        // Engineering Subtopics
        { tag: "engineering/bio", icon: "mdi:molecule" },
        { tag: "engineering/languages", icon: "mdi:code-braces" },
        { tag: "engineering/data", icon: "mdi:pulse" },
        { tag: "engineering/devops", icon: "mdi:cloud" },
        { tag: "engineering/frontend", icon: "mdi:palette" },
        { tag: "engineering/ai", icon: "mdi:robot" },
        
        // Economics Subtopics
        { tag: "economics/strategy", icon: "mdi:arrow-decision" },
        { tag: "economics/finance", icon: "mdi:currency-usd" },
        { tag: "economics/markets", icon: "mdi:handshake" },
        
        // Project Types
        { tag: "projects/games", icon: "mdi:controller-classic" },
        { tag: "projects/teaching", icon: "mdi:thought-bubble" },

        // Programming Languages
        { tag: "engineering/languages/python", icon: "mdi:language-python" },
        { tag: "engineering/languages/typescript", icon: "mdi:language-typescript" },
        { tag: "engineering/languages/csharp", icon: "mdi:language-csharp" },
        { tag: "engineering/languages/lua", icon: "mdi:language-lua" },
        { tag: "engineering/languages/scratch", icon: "mdi:cat" },
        
        // Secondary project types
        { tag: "projects/college", icon: "custom:uofu" },
        
        // Writing types
        { tag: "writing/annotations", icon: "mdi:chat-plus" },
        { tag: "writing/articles", icon: "mdi:file-edit" },
        { tag: "writing/tutorials", icon: "mdi:school" },

        { tag: "horticulture/seasons", icon: "mdi:weather-sunny" },
        
        // Top-level Categories
        { tag: "writing", icon: "mdi:pencil" },
        { tag: "horticulture", icon: "mdi:flower" },
        { tag: "economics", icon: "mdi:chart-bell-curve" },
        { tag: "engineering", icon: "mdi:wrench" },
        { tag: "projects", icon: "mdi:source-branch" },
        
        // Seasonal Themes
        { tag: "horticulture/seasons/rhythm", icon: "mdi:music-note" },
        { tag: "horticulture/seasons/systems", icon: "mdi:connection" },

        { tag: "horticulture/health", icon: "mdi:heart" },

        // Dayjob
        { tag: "projects/dayjob", icon: "mdi:vote" },

        // Access/Privacy
        { tag: "private", icon: "mdi:lock" },
      ],
      defaultColor: "#888888",
      defaultIcon: null,
    },
    structuredData: {
      mappings: [
        // Writing types (most specific)
        { tag: "writing/annotations", type: "ScholarlyArticle", section: "Annotations" },
        { tag: "writing/tutorials", type: "HowTo", section: "Tutorials" },
        { tag: "writing/articles", type: "Article", section: "Articles" },
        
        // Subject areas (fallback categories)
        { tag: "engineering", type: "TechArticle", section: "Engineering" },
        { tag: "economics", type: "Article", section: "Economics" },
        { tag: "horticulture", type: "BlogPosting", section: "Digital Garden" },
        { tag: "projects", type: "Report", section: "Projects" },
      ],
      defaultType: "Article",
      author: {
        type: "Person",
        name: "Spencer Elkington",
        url: "https://blog.chaoticgood.computer/about",
      },
      publisher: {
        type: "Organization",
        name: "Chaotic Good Computing",
        url: "https://blog.chaoticgood.computer/about",
      },
    },
    theme: {
      fontOrigin: "local",
      cdnCaching: true,
      typography: {
        header: "Schibsted Grotesk",
        body: "Source Sans 3",
        code: "IBM Plex Mono",
      },
      colors: {
        light: "#161618",
        lightgray: "#393639",
        gray: "#646464",
        darkgray: "#d4d4d4",
        dark: "#ebebec",
        secondary: "#7b97aa",
        tertiary: "#84a59d",
        highlight: "rgba(143, 159, 169, 0.15)",
        textHighlight: "#b3aa0288",
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.Annotations(), // Must run before MDX to remove annotation blocks
      Plugin.MDX(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "git", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({
        enableInHtmlEmbed: false,
        enableCheckbox: true,
        parseTags: false,
      }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.WidgetScripts(), // Emit widget scripts to /static/widgets/
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.TagIndex(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
        rssLimit: 40,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
      Plugin.CustomOgImages({ generateOnServe: false }),
    ],
  },
}

export default config
