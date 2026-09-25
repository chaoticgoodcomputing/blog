// A probe plugin for this library's specs (see tests/harness/probe.mjs): an emitter that runs the
// content's `probe.md` through the site's configured pipeline twice, whole and minus its `skip`
// option, and writes both results as HTML. It stands in for cgc-annotator, the first plugin that
// will skip transformers.
import fs from "node:fs"
import path from "node:path"
import { toHtml } from "hast-util-to-html"
import { createPipeline } from "../../src/index"

export default function PipelineProbe(options: { skip?: string[] } = {}) {
  return {
    name: "PipelineProbe",
    async emit(ctx: any) {
      const written: string[] = []
      const filePath = path.join(ctx.argv.directory, "probe.md")
      const source = await fs.promises.readFile(filePath, "utf8")
      const runs = { full: [], skipped: options.skip ?? [] }
      for (const [name, skip] of Object.entries(runs)) {
        const { hast } = await createPipeline(ctx, { skip }).run(source, {
          filePath,
          relativePath: "probe.md",
          slug: "probe",
        })
        const dest = path.join(ctx.argv.output, "probe", `${name}.html`)
        await fs.promises.mkdir(path.dirname(dest), { recursive: true })
        await fs.promises.writeFile(dest, toHtml(hast, { allowDangerousHtml: true }))
        written.push(dest)
      }
      return written
    },
  }
}
