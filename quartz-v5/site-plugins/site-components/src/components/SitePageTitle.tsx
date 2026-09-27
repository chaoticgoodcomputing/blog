import type { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "@quartz-community/types"
import { i18n } from "../i18n"
import { siteRoot } from "../root"

export interface SitePageTitleOptions {
  /**
   * The site's author, shown under the title as "by <author>". Fixed for the whole site: it never
   * changes per page. The site config shares it with quartz-seo's `defaultAuthor` through one YAML
   * anchor (#44). No byline when unset.
   */
  author?: string
}

// v4's PageTitle (FORK-LEDGER `components/PageTitle.tsx`): the site's icon, 4rem square, beside the
// title and the author's byline, all one link to the home page. The icon is `static/icon.png`, which
// the site's post-build step replaces with the site's own (`quartz-v5/utils/postbuild.mjs`). The
// class names are v4's; the site styles them (site-styles, components tier).
export default ((opts?: SitePageTitleOptions) => {
  const author = opts?.author?.trim()

  const SitePageTitle: QuartzComponent = ({ cfg, displayClass }: QuartzComponentProps) => {
    const strings = i18n(cfg?.locale)
    const root = siteRoot(cfg?.baseUrl)
    return (
      <h2 class={["page-title", displayClass].filter(Boolean).join(" ")}>
        <a href={root}>
          <img src={`${root}static/icon.png`} class="page-title-icon" alt="" />
          <div class="page-title-text">
            <span class="page-title-name">{cfg?.pageTitle ?? strings.untitled}</span>
            {author && <span class="page-title-author">{strings.byline(author)}</span>}
          </div>
        </a>
      </h2>
    )
  }

  return SitePageTitle
}) satisfies QuartzComponentConstructor<SitePageTitleOptions>
