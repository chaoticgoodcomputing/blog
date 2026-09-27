// A consumer of quartz-tags' per-page artifact, as every tag consumer is one: it reads what the engine
// published on each page's `fileData.cgcTags`, and nothing of the engine's options. It writes that,
// by page slug, to `static/fixture-tag-reader.json` for a spec to read. Pages that page types
// generate (`.mdx` pages, tag pages) are among the content an emitter sees.
import fs from "node:fs/promises"
import path from "node:path"

export const OUTPUT = "static/fixture-tag-reader.json"

export default function FixtureTagReader() {
  return {
    name: "FixtureTagReader",
    async emit(ctx, content) {
      const pages = Object.fromEntries(
        content
          .filter(([, file]) => file.data.cgcTags)
          .map(([, file]) => [file.data.slug, file.data.cgcTags]),
      )
      const dest = path.join(ctx.argv.output, OUTPUT)
      await fs.mkdir(path.dirname(dest), { recursive: true })
      await fs.writeFile(dest, JSON.stringify(pages))
      return [dest]
    },
  }
}
