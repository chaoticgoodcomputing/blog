import { Initialization } from "./component.tsx"
import script from "./script.inline.ts"
import css from "./style.inline.scss"

// Import types from the global widget system
import type { WidgetDefinition } from "../../../../quartz/widgets/types"

export const initialization: WidgetDefinition = {
  Component: Initialization,
  script: script,
  css: css,
  selector: ".widget-content-initialization",
  scriptName: "initialization",
}
