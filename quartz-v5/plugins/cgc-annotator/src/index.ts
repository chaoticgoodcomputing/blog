// cgc-annotator: shows annotations written with Obsidian's Annotator plugin (CONTEXT.md).
//
// This is the emitter half: it mirrors every annotation page's source document into the site.
// Mirrors are pinned on first fetch, and a document that can't be fetched costs a warning, never
// the build (docs/adr/0001).
import fs from "node:fs"
import path from "node:path"
import { styleText } from "node:util"
import { annotationTarget, cacheEntry, mirrorName, pinned, sourceUrl, Unmirrorable } from "./mirror"

export interface Options {
  /** Where mirrors are served from, relative to the site root. Keep it out of search in `robots.txt`. */
  mirrorDir: string
  /** Where source documents are pinned between builds: relative to the Quartz root, or absolute. */
  cacheDir: string
  /** How long to wait for a source document before building without it, in milliseconds. */
  fetchTimeout: number
}

const defaults: Options = {
  mirrorDir: "mirrors",
  cacheDir: "node_modules/.cache/cgc-annotator",
  fetchTimeout: 60_000,
}

// The little of Quartz's build context and content this plugin reads.
interface Ctx {
  argv: { output: string }
}
interface File {
  path?: string
  data?: { frontmatter?: Record<string, unknown>; relativePath?: string }
}
type Content = [unknown, File | undefined][]
interface ChangeEvent {
  type: "add" | "change" | "delete"
  file?: File
}

const warn = (message: string) => console.warn(styleText("yellow", "⚠") + ` cgc-annotator: ${message}`)

export default function CgcAnnotator(userOpts?: Partial<Options>) {
  const opts = { ...defaults, ...userOpts }
  // Quartz runs from its root, so a relative cache directory is taken from there.
  const cacheDir = path.resolve(opts.cacheDir)
  const mirrorDir = opts.mirrorDir.replace(/^\/+|\/+$/g, "")

  // Mirrors the source documents the given pages annotate, one fetch per document however many
  // pages share it. Resolves with the files written.
  async function mirror(ctx: Ctx, files: (File | undefined)[]): Promise<string[]> {
    const sources = new Map<string, { url: URL; pages: string[] }>()
    for (const file of files) {
      const target = annotationTarget(file?.data?.frontmatter)
      if (!target) continue
      const page = file?.data?.relativePath ?? file?.path ?? "?"
      const url = sourceUrl(target)
      if (url instanceof Unmirrorable) {
        warn(`no mirror for ${page}: its annotation-target "${target}" is ${url.message}.`)
        continue
      }
      const name = mirrorName(url)
      const source = sources.get(name) ?? { url, pages: [] }
      source.pages.push(page)
      sources.set(name, source)
    }

    const written = await Promise.all(
      [...sources].map(async ([name, { url, pages }]) => {
        try {
          const entry = await pinned(url, cacheDir, opts.fetchTimeout)
          const dest = path.join(ctx.argv.output, mirrorDir, name)
          await fs.promises.mkdir(path.dirname(dest), { recursive: true })
          await fs.promises.copyFile(entry, dest)
          return [dest]
        } catch (err) {
          // Never the build: someone else's host being down or blocking us is not the author's fault.
          const reason = err instanceof Unmirrorable ? err.message : String(err)
          warn(
            `could not mirror ${url.href} (${reason}) for ${pages.join(", ")}. Its viewer will link to the source instead. ` +
              `To pin a copy by hand, save it as ${cacheEntry(url, cacheDir)}`,
          )
          return []
        }
      }),
    )
    return written.flat()
  }

  return {
    name: "cgc-annotator",
    async emit(ctx: Ctx, content: Content) {
      return mirror(
        ctx,
        content.map(([, file]) => file),
      )
    },
    // Under `serve`, only pages that were added or changed can name a new source document. Output
    // is not cleaned between rebuilds, so every other mirror is still in place.
    async partialEmit(ctx: Ctx, _content: Content, _resources: unknown, changes: ChangeEvent[]) {
      return mirror(
        ctx,
        changes.filter((change) => change.type !== "delete").map((change) => change.file),
      )
    },
  }
}
