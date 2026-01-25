import { PageLayout } from "../cfg"
import * as Component from "../components"
import { 
  shellGraphOptions as defaultGraphOptions,
  defaultLocalGraphOptions
} from "./conf/graph.layout"

/**
 * Layout configuration for regular note/content pages.
 * This is the default layout for markdown files.
 */
export const notesLayout: PageLayout = {
  beforeBody: [
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.TagList(),
  ],
  body: [
    Component.Content(),
    Component.ShowPageSource(),
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
  right: [
    Component.Graph({
      localGraph: defaultLocalGraphOptions,
      globalGraph: defaultGraphOptions,
    }),
    Component.DesktopOnly(Component.TableOfContents()),
    Component.Backlinks(),
  ],
}
