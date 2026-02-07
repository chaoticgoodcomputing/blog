import { PageLayout } from "../cfg"
import * as Component from "../components"
import { 
  shellGraphOptions as defaultGraphOptions,
  defaultLocalGraphOptions
} from "./conf/graph.layout"


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
    Component.TagList({ showCount: true }),
  ],
  left: [
    Component.PageTitle(),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
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
    Component.Graph({
      localGraph: defaultLocalGraphOptions,
      globalGraph: defaultGraphOptions,
    }),
    Component.PostListing({
      excludeTags: ["private"],
      collapsedItemCount: 5,
      showEmptyMessage: false,
    }),
  ],
  right: [
    Component.EmailSubscribe(),
    Component.DesktopOnly(
      Component.SocialMediaGitHub({
        username: "spelkington",
        theme: "default",
        showHeader: true,
        showFooter: true,
        showThumbnail: false,
        title: "GitHub Activity",
      })
    ),
    Component.DesktopOnly(
      Component.SocialMediaBlueSky({
        handle: "speen.us",
        postLimit: 5,
        showMetrics: false,
        title: "ATProto Feed",
      })
    )
  ],
}
