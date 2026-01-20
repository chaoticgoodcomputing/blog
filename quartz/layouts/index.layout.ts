import { PageLayout } from "../cfg"
import * as Component from "../components"
import { D3Config } from "../components/Graph"

/**
 * Common graph configuration options shared across multiple page types.
 * These can be overridden in individual layouts as needed.
 */
export const defaultGraphOptions: Partial<D3Config> = {
  scale: 0.5,
  linkStrength: {
    tagTag: 0.5,
    tagPost: 0.20,
    postPost: 0.03,
  },
  edgeOpacity: {
    tagTag: { min: 0.9, max: 0.9 },
    tagPost: { min: 0.2, max: 0.9 },
    postPost: { min: 0.05, max: 0.9 },
  },
  repelForce: 2.5,
  centerForce: 0.25,
  linkDistance: {
    tagTag: 50,
    tagPost: 75,
    postPost: 100,
  },
  baseSize: {
    tags: 14,
    posts: 10,
  },
  sizeScaling: {
    tags: 2,
    posts: 1,
  },
  tagColorGradient: [
    "#FF0000",
    "#FF7F00",
    "#FFFF00",
    "#00FF00",
    "#0000FF",
    "#B301FF",
    "#FF0000",
  ],
  labelAnchor: {
    baseY: 1.2,
    scaleFactor: 0.05,
  },
}

/**
 * Local graph options optimized for content pages.
 * Shows immediate connections with tighter spacing.
 */
export const defaultLocalGraphOptions: Partial<D3Config> = {
  ...defaultGraphOptions,
  depth: 1,
  scale: 1,
  baseSize: {
    tags: 5,
    posts: 5,
  },
  sizeScaling: {
    tags: 1,
    posts: 2,
  },
  linkDistance: {
    tagTag: 25,
    tagPost: 25,
    postPost: 25,
  },
}

/**
 * Layout configuration for the site index/homepage.
 * Can be customized to provide a unique landing page experience.
 * 
 * Customization options:
 * - Adjust FullGraph height by changing the "height" property (e.g., "600px", "50vh")
 * - Modify graph behavior by overriding defaultGraphOptions properties
 */
export const indexLayout: PageLayout = {
  pageHeader: [],
  beforeBody: [
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.TagList(),
  ],
  left: [
    Component.PageTitle(),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
        { Component: Component.DesktopOnly(Component.ReaderMode()) },
      ],
    }),
    Component.TagExplorer({
      tagNodeSort: "count-desc",
      fileNodeSort: "date-desc",
      excludeTags: ["private"],
      showFileCount: true,
      folderDefaultState: "collapsed",
      folderClickBehavior: "link",
    }),
  ],
  body: [
    Component.Content(),
    // Component.FullGraph({
    //   globalGraph: defaultGraphOptions,
    //   height: "500px", // Adjust this value to change graph height
    // }),
    Component.PostListing({
      excludeTags: ["private"],
      collapsedItemCount: 5,
      showEmptyMessage: false,
    }),
  ],
  right: [
    Component.Graph({
      localGraph: defaultLocalGraphOptions,
      globalGraph: defaultGraphOptions,
    }),
    Component.DesktopOnly(Component.TableOfContents()),
  ],
  afterBody: [
  ],
}
