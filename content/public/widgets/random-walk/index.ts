import { RandomWalk } from "./component.tsx"
import script from "./script.inline.ts"
import css from "./style.inline.scss"

// Import types from the global widget system
import type { WidgetDefinition } from "../../../../quartz/widgets/types"

export const randomWalk: WidgetDefinition = {
  Component: RandomWalk,
  script: script,
  css: css,
  selector: ".widget-random-walk",
  scriptName: "random-walk",
}
