// cgc-seo: what search engines see of the site. Today that is each page's head, through
// `additionalHead`'s per-page form: `noindex` on private pages, and the canonical URL, `article:*`
// meta and JSON-LD ported from the v4 `Head` fork. The glossary is CONTEXT.md; the decision is #28.
//
// An emitter, so that Quartz collects its `externalResources` exactly once: core gathers them from
// transformers and emitters alike, and a plugin in both categories would add its head twice. It
// writes nothing yet; the sitemap and RSS feed come here next (#67).
import { headFor } from "./head"
import type { Options } from "./options"

export type { Options, AuthorOption } from "./options"

export default function CgcSeo(opts?: Partial<Options>) {
  const options: Options = { noindexTags: ["private"], ...opts }
  return {
    name: "cgc-seo",
    externalResources(ctx: any) {
      const cfg = ctx.cfg.configuration
      const site = {
        baseUrl: cfg.baseUrl,
        pageTitle: cfg.pageTitle,
        locale: cfg.locale,
        ogImages: (ctx.cfg.plugins?.emitters ?? []).some((emitter: { name?: string }) => emitter.name === "CustomOgImages"),
      }
      return { additionalHead: [headFor(site, options)] }
    },
    async emit() {
      return []
    },
  }
}
