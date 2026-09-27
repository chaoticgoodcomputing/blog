// cgc-tag-explorer: browse the site by tag (v4's TagExplorer, #76). A consumer of the cgc-tags
// engine: it reads the tags the engine publishes on each page's `fileData`, and paints with the
// engine's `--cgc-tag-*` properties. The component is in ./components; this is the plugin's emitter
// half, which does two things:
//
// - ships the component's stylesheet, from externalResources(), in its family layer,
//   `@layer cgc.tag-explorer` (ADR-0003 rule 11), with the drawer at the site's breakpoint;
// - writes the pages under each tag, `static/cgcTagExplorer.json`, which the component's script
//   fills a tag in with as it opens (docs/adr/0001).
import fs from "node:fs/promises"
import path from "node:path"
import type { BuildCtx, FilePath, ProcessedContent } from "@quartz-community/types"
import style from "./style.css"
import { lazySettings, type TagExplorerOptions } from "./options"
import { PAGES_INDEX, pagesIndexOf, type PageData } from "./tree"

export type { TagExplorerOptions, TagSort } from "./options"
export { PAGES_INDEX } from "./tree"

// The one media query in the stylesheet, at the plugin's default breakpoint. build.mjs refuses any
// other, so the site's breakpoint replaces every one.
const DRAWER_QUERY = "(max-width: 800px)"

export default function TagExplorerPlugin(options?: TagExplorerOptions) {
  const settings = lazySettings(options)
  return {
    name: "cgc-tag-explorer",
    externalResources: () => {
      const { drawerBreakpoint } = settings()
      const css = style.replaceAll(DRAWER_QUERY, `(max-width: ${drawerBreakpoint}px)`)
      return { css: [{ content: css, inline: true }] }
    },
    async emit(ctx: BuildCtx, content: ProcessedContent[]): Promise<FilePath[]> {
      const index = pagesIndexOf(
        content.map(([, file]) => file.data as PageData),
        settings(),
      )
      const dest = path.join(ctx.argv.output, PAGES_INDEX)
      await fs.mkdir(path.dirname(dest), { recursive: true })
      await fs.writeFile(dest, JSON.stringify(index))
      return [dest as FilePath]
    },
  }
}
