import { GameOfLife } from "./component.tsx"
import script from "./script.inline.ts"
import css from "./style.inline.scss"

// Import types from the global widget system
import type { WidgetDefinition } from "../../../../quartz/widgets/types"

export const gameOfLife: WidgetDefinition = {
  Component: GameOfLife,
  script: script,
  css: css,
  selector: ".widget-game-of-life",
  scriptName: "game-of-life",
}
