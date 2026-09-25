// Reconstructs Quartz's configured transformer pipeline, mirroring `quartz/processors/parse.ts`
// (createMdProcessor / createHtmlProcessor / createFileParser). Everything comes off
// `ctx.cfg.plugins.transformers`, so no core import is needed. Proven at parity with `.md` on #19.
// The additions are remark-mdx and the island collector, which must run last.
import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkRehype from "remark-rehype"
import remarkMdx from "remark-mdx"
import { VFile } from "vfile"
import type { Root } from "hast"
import { collectIslands } from "./islands"

export async function renderMdx(ctx: any, raw: string, fullPath: string, relativePath: string, slug: string) {
  const transformers = ctx.cfg.plugins.transformers ?? []
  let value = raw
  for (const plugin of transformers) if (plugin.textTransform) value = plugin.textTransform(ctx, value)

  const file = new VFile({ value, path: fullPath })
  Object.assign(file.data, { filePath: fullPath, relativePath, slug })

  const markdown = unified()
    .use(remarkParse)
    // Registered before the Latex transformer's remark-math, which then claims `$…$` first and keeps
    // acorn from choking on `{…}` inside inline maths.
    .use(remarkMdx)
    .use(transformers.flatMap((p: any) => p.markdownPlugins?.(ctx) ?? []))
    .use(collectIslands)
  const html = unified()
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(transformers.flatMap((p: any) => p.htmlPlugins?.(ctx) ?? []))

  const mdast = await markdown.run(markdown.parse(file), file)
  const hast = (await html.run(mdast as any, file)) as unknown as Root
  return { hast, file }
}
