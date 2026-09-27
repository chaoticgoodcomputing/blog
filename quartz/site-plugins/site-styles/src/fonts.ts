// The site's own fonts (#84): Inter and IBM Plex Mono, which build.mjs fetched from Google Fonts at
// the plugin's build into dist/fonts/. The emitter copies them into the site, and the stylesheet
// declares them at root-relative URLs, so they load from whatever host serves the site. Core's own
// self-hosting wrote absolute production URLs, which 404 anywhere else (FORK-LEDGER, "Fonts").
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

/** Where the fonts are served from, in the site's output: a path site-styles owns, never core's `static/fonts/`. */
export const FONTS_PATH = "static/site-styles/fonts"
const SOURCE = fileURLToPath(new URL("./fonts/", import.meta.url))

type Ctx = {
  argv: { output: string; serve?: boolean }
  cfg: { configuration: { baseUrl?: string } }
}

// The site's base path, as core computes it for `data-basepath` (renderPage.tsx): the path of
// `baseUrl`, and nothing under `serve`, which serves from the root. quartz-tags links its stylesheet
// the same way.
export function basePath(ctx: Ctx): string {
  const { baseUrl } = ctx.cfg.configuration
  return ctx.argv.serve || !baseUrl ? "" : new URL(`https://${baseUrl}`).pathname.replace(/\/$/, "")
}

/**
 * One `@font-face` per face, in the site layer's generic tier. Written nested, as `site.scss` writes
 * the tiers: lightningcss inverts sublayer order in a file that spells a layer both ways.
 */
export function fontFaces(ctx: Ctx): string {
  const root = `${basePath(ctx)}/${FONTS_PATH}`
  const rules = __SITE_STYLES_FONT_FACES__.map((face) =>
    [
      "    @font-face {",
      `      font-family: "${face.family}";`,
      `      font-style: ${face.style};`,
      `      font-weight: ${face.weight};`,
      `      font-display: ${face.display};`,
      `      src: url("${root}/${face.file}") format("woff2");`,
      `      unicode-range: ${face.unicodeRange};`,
      "    }",
    ].join("\n"),
  )
  return ["@layer site {", "  @layer generic {", ...rules, "  }", "}", ""].join("\n")
}

/**
 * Copies the fonts into the site. Nothing else writes under `static/site-styles/`, so this never
 * races the stock Static emitter, which copies only Quartz Core's own `static/` and runs at
 * the same time (full builds run every emitter at once).
 */
export async function emitFonts(ctx: Ctx): Promise<string[]> {
  const dest = path.join(ctx.argv.output, FONTS_PATH)
  await fs.promises.mkdir(dest, { recursive: true })
  return Promise.all(
    __SITE_STYLES_FONT_FACES__.map(async ({ file }) => {
      await fs.promises.copyFile(path.join(SOURCE, file), path.join(dest, file))
      return path.join(dest, file)
    }),
  )
}
