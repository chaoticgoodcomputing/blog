import { ProcessedContent } from "../vfile"
import { BuildCtx } from "../../util/ctx"
import { loadSource } from "./loader"
import externalSources from "../../../external.config"

declare module "vfile" {
  interface DataMap {
    external?: string
  }
}

export async function loadExternalContent(ctx: BuildCtx): Promise<ProcessedContent[]> {
  if (externalSources.length === 0) return []

  // External source paths in `external.config.ts` are workspace-relative.
  // Quartz is invoked from the workspace root, so process.cwd() is correct.
  const workspaceRoot = process.cwd()
  const all: ProcessedContent[] = []

  for (const source of externalSources) {
    const nodes = await loadSource(source, workspaceRoot)
    for (const node of nodes) {
      ctx.externalUrlMap.set(node.url, node.slug)
      all.push(node.content)
    }
    if (ctx.argv.verbose) {
      console.log(`[external] ${source.name}: loaded ${nodes.length} nodes`)
    }
  }

  return all
}
