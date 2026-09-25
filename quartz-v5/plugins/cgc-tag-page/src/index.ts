// cgc-tag-page: stock tag-page, with the tag's description article as each tag page's only body
// (#72). Stock does the work that makes the pages: every tag a page carries, and each of its
// ancestors, gets one at `tags/<t>`, and a tag with a description file at `tags/<t>.md` gets that
// file's page instead of a made-up one. The body is ours, and so is one addition: the pages other
// page types make count as pages that carry tags.
//
// Quartz takes a page's body from its page type alone, never from the `tag` layout, so replacing
// the body means replacing the page type: this plugin replaces stock tag-page, and a site disables
// that one (docs/adr/0001).
import { TagPage } from "@quartz-community/tag-page"
import type {
  BuildCtx,
  PluginTypes,
  ProcessedContent,
  QuartzPageTypePlugin,
} from "@quartz-community/types"
import { DescriptionBody } from "./DescriptionBody"

export interface Options {
  /** Title a tag with no description file "Tag: <tag>" rather than "<tag>". Stock's option. */
  prefixTags?: boolean
}

// Stock tag-page left on beside this plugin would make every tag's page a second time, each over
// the other's, and theirs would list the tag's pages. Checked from a hook: Quartz logs a plugin
// whose factory throws and builds on without it, but a throw from here fails the build.
function refuseStockBeside(ctx: BuildCtx, stockName: string) {
  const pageTypes = (ctx.cfg.plugins as Partial<PluginTypes> | undefined)?.pageTypes ?? []
  if (pageTypes.some((pageType) => pageType.name === stockName)) {
    throw new Error(
      "cgc-tag-page wraps stock tag-page and replaces it: disable @quartz-community/tag-page",
    )
  }
}

// The pages other page types have made so far in this pass, such as cgc-mdx's `.mdx` pages. Quartz
// resets the list before each pass and generates in priority order, so it holds the pages of every
// page type generated before this one: a higher priority than stock's 10, or the same priority and
// earlier in the config. Stock counts only the Markdown Quartz parsed, so a tag that
// only `.mdx` pages carry would get no page, and their tag badges would link nowhere.
const madeUpSoFar = (ctx: BuildCtx) =>
  (ctx as { virtualPages?: ProcessedContent[] }).virtualPages ?? []

const CgcTagPage: QuartzPageTypePlugin<Options> = (opts) => {
  const stock = TagPage({ prefixTags: opts?.prefixTags })
  return {
    // Stock's matcher, priority and `tag` layout, so the site's `layout.byPageType.tag` still
    // places everything around the body.
    ...stock,
    name: "cgc-tag-page",
    generate(args) {
      refuseStockBeside(args.ctx, stock.name)
      return stock.generate!({ ...args, content: [...args.content, ...madeUpSoFar(args.ctx)] })
    },
    body: DescriptionBody,
  }
}

export default CgcTagPage
