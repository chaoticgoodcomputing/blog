import { PageLayout } from "../cfg"
import * as Component from "../components"
import { defaultGraphOptions, defaultLocalGraphOptions } from "./index.layout"

/**
 * Layout configuration for tag and folder list pages.
 * Displays collections of pages organized by taxonomy or location.
 */
export const tagsLayout: PageLayout = {
  beforeBody: [
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.TagList({ showSubtags: true, showCount: true }),
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
  right: [
    Component.Graph({
      localGraph: defaultLocalGraphOptions,
      globalGraph: defaultGraphOptions,
    }),
    Component.Backlinks()
  ],
  afterBody: [
    Component.PostListing({
      excludeTags: ["private"],
      filterToCurrentTag: true,
      includeSubtags: true,
      collapsedItemCount: 5,
      showEmptyMessage: true,
    }),
  ],
}
