import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import { i18n } from "../i18n"

interface ShowPageSourceOptions {
  /**
   * Base GitHub repository URL (e.g., "https://github.com/user/repo/blob/main")
   * Trailing slashes will be automatically removed.
   */
  repoUrl: string
}

const defaultOptions: ShowPageSourceOptions = {
  repoUrl: "",
}

export default ((opts?: Partial<ShowPageSourceOptions>) => {
  const options: ShowPageSourceOptions = { ...defaultOptions, ...opts }

  const ShowPageSource: QuartzComponent = ({ fileData, displayClass, cfg }: QuartzComponentProps) => {
    // Skip if no repo URL configured or if this is a special page (404, tag pages, etc.)
    if (!options.repoUrl || !fileData.filePath) {
      return null
    }

    // Clean up the repo URL by removing trailing slashes
    const cleanRepoUrl = options.repoUrl.replace(/\/+$/, "")

    // The filePath includes "content/" prefix (e.g., "content/public/index.md")
    // We need to keep this path structure for GitHub
    const sourceUrl = `${cleanRepoUrl}/${fileData.filePath}`

    return (
      <div class={classNames(displayClass, "page-source")}>
        <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
          </svg>
          {i18n(cfg.locale).components.pageSource.linkText}
        </a>
      </div>
    )
  }

  ShowPageSource.css = `
.page-source {
  margin: 1rem 0;
}

.page-source a {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--lightgray);
  border-radius: 5px;
  text-decoration: none;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.page-source a:hover {
  background: var(--lightgray);
  border-color: var(--secondary);
}

.page-source svg {
  flex-shrink: 0;
}
`

  return ShowPageSource
}) satisfies QuartzComponentConstructor
