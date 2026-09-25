import fs from "node:fs"
import path from "node:path"
import type { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "@quartz-community/types"
import { i18n } from "../i18n"

export interface PageSourceOptions {
  /**
   * Where the repository's files can be browsed, up to the branch: for GitHub,
   * `https://github.com/<owner>/<repo>/blob/<branch>`. Required. Trailing slashes are ignored.
   */
  repoUrl: string
  /**
   * The content folder's path from the repository root. Defaults to `content`, where a stock Quartz
   * site keeps it. Set it to `""` if `repoUrl` already reaches the content folder.
   */
  contentPath?: string
  /** The link's text. Defaults to "View source on GitHub", in the site's locale where the plugin has it. */
  linkText?: string
}

const trimSlashes = (path: string) => path.replace(/^\/+|\/+$/g, "")

export default ((opts?: Partial<PageSourceOptions>) => {
  // Options arrive as the site's config gives them: Quartz merges no defaults into a component's.
  const repoUrl = opts?.repoUrl?.replace(/\/+$/, "")
  if (!repoUrl) {
    throw new Error(`cgc-page-source: set the "repoUrl" option, e.g. https://github.com/<owner>/<repo>/blob/<branch>`)
  }
  const contentPath = trimSlashes(opts?.contentPath ?? "content")

  // The page's file as a path from the repository root: the content folder's path, then the file's
  // path inside it. A page whose file is a symlink, as a plugin note is (a README linked into the
  // vault), names the file the link points at instead, when that file is in the same repository.
  const sourcePath = (contentDir: string | undefined, filePath: string, relativePath: string) => {
    const inContent = [contentPath, relativePath].filter(Boolean).join("/")
    if (!contentDir) return inContent
    try {
      // The repository root is the content folder, less the content folder's path from the root.
      const content = fs.realpathSync(contentDir).split(path.sep).join("/")
      if (contentPath && !content.endsWith(`/${contentPath}`)) return inContent
      const root = contentPath ? content.slice(0, -contentPath.length - 1) : content
      const file = path.relative(root, fs.realpathSync(filePath)).split(path.sep).join("/")
      return file === ".." || file.startsWith("../") || path.isAbsolute(file) ? inContent : file
    } catch {
      return inContent
    }
  }

  const PageSource: QuartzComponent = ({ ctx, fileData, displayClass, cfg }: QuartzComponentProps) => {
    // Only a page read from a file has a `filePath`. Quartz gives the pages it makes up (the 404 page,
    // a tag page with no description) a `relativePath` of their slug plus `.md`, naming no real file,
    // so that alone is not enough. As in v4, they get no link.
    const { filePath, relativePath } = fileData
    if (typeof filePath !== "string" || !filePath || typeof relativePath !== "string" || !relativePath) return null
    const contentDir = (ctx as { argv?: { directory?: string } } | undefined)?.argv?.directory
    const file = sourcePath(contentDir, filePath, relativePath).split("/").map(encodeURIComponent).join("/")

    return (
      <div class={["cgc-page-source", displayClass].filter(Boolean).join(" ")}>
        <a class="cgc-page-source__link" href={`${repoUrl}/${file}`} target="_blank" rel="noopener noreferrer">
          <svg
            class="cgc-page-source__icon"
            aria-hidden="true"
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
          {opts?.linkText ?? i18n(cfg?.locale).linkText}
        </a>
      </div>
    )
  }

  return PageSource
}) satisfies QuartzComponentConstructor<Partial<PageSourceOptions>>
