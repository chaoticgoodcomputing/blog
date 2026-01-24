import { PageLayout } from "../cfg"
import * as Component from "../components"
import { 
  shellGraphOptions as defaultGraphOptions,
  defaultLocalGraphOptions
} from "./conf/graph.layout"

/**
 * Layout configuration for PDF annotation pages.
 * Displays PDFs on the left with synchronized annotations on the right.
 * 
 * Features:
 * - Split-view layout with PDF viewer and annotations sidebar
 * - Synced scrolling between PDF position and relevant annotations
 * - Click annotations to jump to their position in the PDF
 * - Responsive design collapses to stacked layout on smaller screens
 */
export const annotationsLayout: PageLayout = {
  beforeBody: [
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.TagList(),
  ],
  body: [
    Component.AnnotationViewer(),
    Component.Graph({
      localGraph: defaultLocalGraphOptions,
      globalGraph: defaultGraphOptions,
    }),
    Component.Backlinks(),
  ],
  left: [],
  right: [],
}
