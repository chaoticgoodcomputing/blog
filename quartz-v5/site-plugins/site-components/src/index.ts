// site-components: this site's own layout components (#44, #70), a site plugin. Component-only: the
// loader imports this entry, then registers the components from `./components`, which is where they
// live, and its frame from `./frames`. The site config places each component through an entry of its
// own (CONTEXT.md, Placement).
export type { SitePageTitleOptions, SiteFooterOptions } from "./components"
