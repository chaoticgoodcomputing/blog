import { PageLayout } from "../cfg"
import * as Component from "../components"
import { defaultGraphOptions, defaultLocalGraphOptions } from "./index.layout"

/**
 * Layout configuration for regular note/content pages.
 * This is the default layout for markdown files.
 */
export const notesLayout: PageLayout = {
  beforeBody: [
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.TagList(),
    Component.ShowPageSource({
      repoUrl: "https://github.com/chaoticgoodcomputing/chaoticgoodcomputing.github.io/blob/main",
    }),
  ],
  body: [
    Component.Content(),
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
  right: [
    Component.Graph({
      localGraph: defaultLocalGraphOptions,
      globalGraph: defaultGraphOptions,
    }),
    Component.DesktopOnly(Component.TableOfContents()),
    Component.Backlinks(),
  ],
}
