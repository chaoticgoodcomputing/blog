// A tag page's body: the tag's description article, and nothing else (#72). v4's TagContent, which
// had already dropped stock's list of the tag's pages for the post listing in its tags layout.
//
// The markup is stock tag-page's body without its `.page-listing`: a `popover-hint` wrapper, which
// is what core's page preview copies out of a fetched page, around the article. The wrapper is
// Quartz's, the same element stock renders, so the no-bleed spec holds it to stock's styles; the
// article is this plugin's, `.cgc-tag-page`.
import type { QuartzComponent, QuartzComponentConstructor } from "@quartz-community/types"
import { htmlToJsx } from "@quartz-community/utils"
import type { Root } from "hast"

export const DescriptionBody: QuartzComponentConstructor = () => {
  const TagPageBody: QuartzComponent = ({ fileData, tree }) => {
    const cssclasses: string[] = (fileData.frontmatter?.cssclasses as string[] | undefined) ?? []
    // A description file with no body shows its frontmatter description instead, as v4's and stock's
    // TagContent did. A tag with no description file is a page stock makes up, with neither: an
    // empty article.
    const empty = (tree as Root).children.length === 0
    return (
      <div class="popover-hint">
        <article class={["cgc-tag-page", ...cssclasses].join(" ")}>
          <div class="markdown-preview-view markdown-rendered">
            {empty ? fileData.description : htmlToJsx(tree as Root)}
          </div>
        </article>
      </div>
    )
  }
  return TagPageBody
}
