import { PageLayout } from "../cfg"
import * as Component from "../components"
import { 
  shellGraphOptions as defaultGraphOptions,
  defaultLocalGraphOptions
} from "./conf/graph.layout"

/**
 * Layout configuration for tag and folder list pages.
 * Displays collections of pages organized by taxonomy or location.
 */
export const tagsLayout: PageLayout = {
  beforeBody: [
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.TagList({ showSubtags: true, showParentTag: true, showCount: true }),
  ],
  left: [
    Component.PageTitle(),
    Component.Search(),
    Component.TagExplorer({
      tagNodeSort: "count-desc",
      fileNodeSort: "date-desc",
      excludeTags: ["private"],
      showFileCount: true,
      folderDefaultState: "collapsed",
      folderClickBehavior: "link",
    }),
  ],
  right: [
    Component.EmailSubscribe(),
    Component.Backlinks()
  ],
  body: [
    Component.Content(),
    Component.Graph({
      localGraph: defaultLocalGraphOptions,
      globalGraph: defaultGraphOptions,
    }),
    Component.PostListing({
      excludeTags: ["private"],
      filterToCurrentTag: true,
      includeSubtags: true,
      collapsedItemCount: 5,
      showEmptyMessage: true,
    }),
  ]
}
