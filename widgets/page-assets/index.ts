import { PageAssets } from "./component.tsx"
import script from "./script.inline.ts"
import css from "./style.inline.scss"
import type { WidgetDefinition } from "../../../../quartz/widgets/types"

export const pageAssets: WidgetDefinition = {
  Component: PageAssets,
  script: script,
  css: css,
  selector: ".widget-page-assets",
  scriptName: "page-assets",
}
