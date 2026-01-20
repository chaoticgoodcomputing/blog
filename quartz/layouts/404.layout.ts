import { PageLayout } from "../cfg"
import * as Component from "../components"
import { defaultGraphOptions } from "./index.layout"

/**
 * Layout configuration for the 404 error page.
 * Based on the index layout, providing full navigation and context
 * to help users find their way back to site content.
 */
export const notFoundLayout: PageLayout = {
  pageHeader: [ ],
  beforeBody: [],
  body: [
    Component.NotFound(),
    Component.FullGraph({
      globalGraph: defaultGraphOptions,
      height: "500px",
    }),
    Component.PostListing({
      excludeTags: ["private"],
      collapsedItemCount: 5,
      showEmptyMessage: false,
    }),
  ],
  left: [
    Component.PageTitle(),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.ReaderMode() },
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
  right: [],
  afterBody: [
  ],
}
