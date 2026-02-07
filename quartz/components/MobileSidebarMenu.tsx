import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/mobileSidebarMenu.scss"
// @ts-ignore
import script from "./scripts/MobileSidebarMenu.inline"

/**
 * Mobile sidebar menu component that wraps the left sidebar content
 * and provides a hamburger button and retractable menu for mobile devices.
 * On desktop, this component is invisible and just passes through the children.
 */
export default (() => {
  const MobileSidebarMenu: QuartzComponent = ({ children }: QuartzComponentProps) => {
    return (
      <>
        {/* Caret toggle button - self-contained responsive behavior in SCSS */}
        <button
          class="mobile-sidebar-toggle"
          id="mobile-sidebar-toggle"
          aria-label="Toggle sidebar menu"
          aria-expanded="false"
        >
          <svg class="caret-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>

        {/* Backdrop overlay - self-contained responsive behavior in SCSS */}
        <div class="mobile-sidebar-backdrop" id="mobile-sidebar-backdrop"></div>

        {/* The actual sidebar container - self-contained responsive behavior in SCSS */}
        <div class="mobile-sidebar-container" id="mobile-sidebar-container">
          {children}
        </div>
      </>
    )
  }

  MobileSidebarMenu.css = style
  MobileSidebarMenu.afterDOMLoaded = script

  return MobileSidebarMenu
}) satisfies QuartzComponentConstructor<QuartzComponent>
