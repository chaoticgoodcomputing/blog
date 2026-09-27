// cgc-og-image: stock og-image, wrapped. Stock does the work (fonts, satori, sharp, the `og:image`
// head tags); this plugin supplies the card it draws, which stock only accepts from TypeScript
// (`imageStructure` is left out of its YAML options).
//
// It replaces stock og-image, so a site disables that one. The emitter keeps stock's name,
// `CustomOgImages`: core `Head` looks for that name to decide whether to write its own default
// `og:image` tags, and would write a second set otherwise.
import fs from "node:fs"
import path from "node:path"
import { CustomOgImages, CustomOgImagesEmitterName, type SocialImageOptions } from "@quartz-community/og-image"
import { card } from "./card"

export type Options = Partial<Omit<SocialImageOptions, "imageStructure">> & {
  /**
   * The image drawn in the card's corner, in place of stock's, which is read from inside the
   * Quartz copy. A PNG, JPEG or SVG file, resolved against the Quartz root as a local `source:` is.
   */
  icon?: string
}

const ICON_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
}

// Read when the cards are drawn, not when the plugin is constructed: Quartz logs a plugin whose
// factory throws and builds on without it, so a bad path would silently lose every card. A throw
// from `emit` fails the build.
async function readIcon(file: string | undefined) {
  if (file === undefined) return undefined
  const type = ICON_TYPES[path.extname(file).toLowerCase()]
  if (!type) throw new Error(`cgc-og-image: icon "${file}" must be a PNG, JPEG or SVG file`)
  const resolved = path.resolve(file)
  try {
    return `data:${type};base64,${(await fs.promises.readFile(resolved)).toString("base64")}`
  } catch (err) {
    throw new Error(`cgc-og-image: cannot read icon "${file}" at ${resolved}: ${(err as Error).message}`)
  }
}

// Stock og-image left on beside this plugin would draw every card and write every `og:image` tag a
// second time, each over the other's. Both emitters carry the name core looks for, so count them.
function refuseStockBeside(ctx: Parameters<ReturnType<typeof CustomOgImages>["emit"]>[0]) {
  const emitters = (ctx.cfg.plugins as { emitters?: { name: string }[] } | undefined)?.emitters ?? []
  if (emitters.filter((emitter) => emitter.name === CustomOgImagesEmitterName).length > 1) {
    throw new Error("cgc-og-image wraps stock og-image and replaces it: disable @quartz-community/og-image")
  }
}

export default function CgcOgImage(opts: Options = {}) {
  const { icon, ...stockOptions } = opts
  const stockWith = (iconSrc: string | undefined) => CustomOgImages({ ...stockOptions, imageStructure: card(iconSrc) })
  // Stock's name, head tags and components. Its emitters run from a copy that holds the icon.
  const stock = stockWith(undefined)
  // Nothing is drawn under `quartz build --serve`: a card per page is the slowest part of a build,
  // and nobody shares a link to a local preview. v4's `generateOnServe: false`, with no option.
  return {
    ...stock,
    async *emit(...args: Parameters<typeof stock.emit>) {
      refuseStockBeside(args[0])
      if (args[0].argv.serve) return
      yield* await stockWith(await readIcon(icon)).emit(...args)
    },
    async *partialEmit(...args: Parameters<NonNullable<typeof stock.partialEmit>>) {
      if (args[0].argv.serve) return
      const emitted = stockWith(await readIcon(icon)).partialEmit?.(...args)
      if (emitted) yield* await emitted
    },
  }
}
