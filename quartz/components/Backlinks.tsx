import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/backlinks.scss"
import { resolveAbsolute, simplifySlug } from "../util/path"
import { i18n } from "../i18n"
import { classNames } from "../util/lang"
import OverflowListFactory from "./OverflowList"
import { concatenateResources } from "../util/resources"

// @ts-ignore
import script from "./scripts/Backlinks.inline"

interface BacklinksOptions {
  hideWhenEmpty: boolean
}

const defaultOptions: BacklinksOptions = {
  hideWhenEmpty: true,
}

export default ((opts?: Partial<BacklinksOptions>) => {
  const options: BacklinksOptions = { ...defaultOptions, ...opts }
  const { OverflowList, overflowListAfterDOMLoaded } = OverflowListFactory()

  const Backlinks: QuartzComponent = ({
    fileData,
    allFiles,
    displayClass,
    cfg,
  }: QuartzComponentProps) => {
    const slug = simplifySlug(fileData.slug!)
    let backlinkFiles = allFiles.filter((file) => file.links?.includes(slug))

    // Sort: public posts first, then by date descending, then reverse alphabetically
    backlinkFiles = backlinkFiles.sort((a, b) => {
      const aIsPrivate = a.frontmatter?.tags?.includes("private") ?? false
      const bIsPrivate = b.frontmatter?.tags?.includes("private") ?? false

      // Sort by public/private status first
      if (aIsPrivate !== bIsPrivate) {
        return aIsPrivate ? 1 : -1  // Public first
      }

      // Then sort by date descending
      const aDate = a.dates?.modified ?? a.dates?.published ?? new Date(0)
      const bDate = b.dates?.modified ?? b.dates?.published ?? new Date(0)
      const dateDiff = bDate.getTime() - aDate.getTime()
      if (dateDiff !== 0) {
        return dateDiff
      }

      // Finally, sort reverse alphabetically by title
      const aTitle = a.frontmatter?.title?.toLowerCase() ?? ""
      const bTitle = b.frontmatter?.title?.toLowerCase() ?? ""
      return bTitle.localeCompare(aTitle)
    })

    if (options.hideWhenEmpty && backlinkFiles.length == 0) {
      return null
    }
    return (
      <div class={classNames(displayClass, "backlinks")}>
        <h3>{i18n(cfg.locale).components.backlinks.title}</h3>
        <OverflowList>
          {backlinkFiles.length > 0 ? (
            backlinkFiles.map((f) => {
              const isPrivate = f.frontmatter?.tags?.includes("private") ?? false
              return (
                <li>
                  <a
                    href={resolveAbsolute(f.slug!)}
                    class={classNames("file-link", isPrivate && "private")}
                  >
                    <span class="file-icon"></span>
                    <span class="file-title">{f.frontmatter?.title}</span>
                  </a>
                </li>
              )
            })
          ) : (
            <li>{i18n(cfg.locale).components.backlinks.noBacklinksFound}</li>
          )}
        </OverflowList>
      </div>
    )
  }

  Backlinks.css = style
  Backlinks.afterDOMLoaded = concatenateResources(script, overflowListAfterDOMLoaded)

  return Backlinks
}) satisfies QuartzComponentConstructor
