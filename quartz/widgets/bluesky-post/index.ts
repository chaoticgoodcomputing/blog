import { WidgetDefinition } from "../types"
import { BlueSkyPost } from "./component"
import script from "./script.inline"
import style from "./style.inline.scss"

export const blueskyPost: WidgetDefinition = {
  Component: BlueSkyPost,
  script: script,
  css: style,
  selector: ".widget-bluesky-post",
  scriptName: "bluesky-post",
}
