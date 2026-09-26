// The plugin's page frames, which Quartz's loader imports from `./frames` by the names in
// package.json's `quartz.frames` and registers under each frame's `name` (docs/adr/0002).
import { h, type FunctionComponent } from "preact"
import type { PageFrame, PageFrameProps, QuartzComponent, QuartzComponentProps } from "@quartz-community/types"

// Each of a slot's components, with the page's data. The shared types leave a component's return
// type open, so they are drawn through `h`, as Quartz's own frames draw them through JSX.
const draw = (components: QuartzComponent[], props: QuartzComponentProps) =>
  components.map((component) => h(component as FunctionComponent<QuartzComponentProps>, props))

/**
 * The site's full-width frame, for a page whose body needs the page's whole width: an annotation
 * page's Viewer (#37). Core's `full-width` frame drops whatever the layout places `left` or `right`,
 * so this one keeps both, out of the body's way. The left components (the page title and the
 * toolbar) are a bar at the top of the page header, and the right ones (the graph and the backlinks)
 * come after the body, before the after-body components, as v4's annotation layout had them.
 * The site styles it (site-styles, objects tier).
 */
export const SiteFullWidthFrame: PageFrame = {
  name: "site-full-width",
  render({ componentData, header, beforeBody, pageBody, afterBody, left, right, footer }: PageFrameProps) {
    return (
      <>
        <div class="center full-width">
          <div class="page-header">
            <div class="site-full-width__bar">{draw(left, componentData)}</div>
            {header.length > 0 && <header>{draw(header, componentData)}</header>}
            <div class="popover-hint">{draw(beforeBody, componentData)}</div>
          </div>
          {draw([pageBody], componentData)}
          <hr />
          <div class="page-footer">
            {draw(right, componentData)}
            {draw(afterBody, componentData)}
          </div>
        </div>
        {draw(footer, componentData)}
      </>
    )
  },
}
