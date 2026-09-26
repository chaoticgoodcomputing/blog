// Bundles the plugin to dist/. Two things are built:
//
//   1. The site's Sass, compiled here, at the plugin's build, and inlined into dist/index.js as a
//      string, so the built plugin imports nothing and Quartz never sees Sass (ADR-0003's site-plugin
//      amendment: application CSS stays Sass, compiled in the plugin's own build).
//   2. The site's fonts (#84): Inter and IBM Plex Mono, fetched from Google Fonts here and never at
//      run time, into dist/fonts/, which the plugin's emitter copies into the site. What each face
//      declares is written into dist/index.js, which turns it into `@font-face` rules at the site's
//      base path. A fetch that fails fails the build.
import esbuild from "esbuild"
import crypto from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import * as sass from "sass"

// 2. The fonts ---------------------------------------------------------------------------------

// v4's typography, in the weights and styles the site's CSS and core's use. Inter is variable, so
// one range covers every weight that is set (400, 500, 600 and bold), upright and italic. IBM Plex
// Mono is not, so it comes in core's two code weights and bold, upright only.
const FONTS_CSS =
  "https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400..700;1,400..700&family=IBM+Plex+Mono:wght@400;600;700&display=swap"
const FAMILIES = ["IBM Plex Mono", "Inter"]
// Google Fonts answers with the formats the asking browser takes: woff2 for any current one.
const USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"
// Each fetch is kept, so a rebuild needs no network. Delete it to refetch. It is keyed on everything
// that shapes what it holds: the URL, the browser it asks as (which picks the format), the families
// it must hold, and the code that names and checks its files (parseFaces, hoisted). So a change to
// any of them fetches afresh, instead of silently serving files the new code never made.
const CACHE_KEY = [FONTS_CSS, USER_AGENT, FAMILIES.join(","), parseFaces.toString()].join("\n")
const CACHE = path.join("node_modules", ".cache", "site-styles-fonts", crypto.createHash("sha256").update(CACHE_KEY).digest("hex").slice(0, 16))
const FONTS_OUT = "dist/fonts"

async function get(url, as) {
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } })
  if (!response.ok) throw new Error(`site-styles: fetching ${url} failed: ${response.status} ${response.statusText}`)
  return as === "text" ? response.text() : Buffer.from(await response.arrayBuffer())
}

// Each `@font-face` in Google's answer, with the subset its comment names and the file it points at.
function parseFaces(css) {
  const faces = []
  for (const [, subset, body] of css.matchAll(/\/\*\s*([\w-]+)\s*\*\/\s*@font-face\s*\{([^}]*)\}/g)) {
    const read = (property) => body.match(new RegExp(`${property}:\\s*([^;]+);`))?.[1].trim()
    const [, url, format] = read("src")?.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)\s*format\('(\w+)'\)/) ?? []
    if (!url || format !== "woff2") throw new Error(`site-styles: a ${subset} face with no woff2 source:\n${body}`)
    const face = {
      family: read("font-family").replace(/^'|'$/g, ""),
      style: read("font-style"),
      weight: read("font-weight"),
      display: read("font-display"),
      unicodeRange: read("unicode-range"),
    }
    const slug = face.family.toLowerCase().replace(/\s+/g, "-")
    face.file = `${slug}-${face.style}-${face.weight.replace(/\s+/g, "-")}-${subset}.woff2`
    faces.push({ ...face, url })
  }
  const families = [...new Set(faces.map((face) => face.family))].sort()
  if (JSON.stringify(families) !== JSON.stringify(FAMILIES)) {
    throw new Error(`site-styles: Google Fonts answered with ${families.join(", ") || "no faces"}, not ${FAMILIES.join(", ")}`)
  }
  const files = faces.map((face) => face.file)
  if (new Set(files).size !== files.length) throw new Error(`site-styles: two faces share a file name: ${files}`)
  return faces
}

// The faces, from the cache or else from Google Fonts, with their files in the cache.
async function fetchFonts() {
  const manifest = path.join(CACHE, "faces.json")
  if (fs.existsSync(manifest)) return JSON.parse(fs.readFileSync(manifest, "utf8"))
  const faces = parseFaces(await get(FONTS_CSS, "text"))
  const partial = `${CACHE}.partial-${process.pid}`
  fs.rmSync(partial, { recursive: true, force: true })
  fs.mkdirSync(partial, { recursive: true })
  await Promise.all(faces.map(async (face) => fs.writeFileSync(path.join(partial, face.file), await get(face.url))))
  const declared = faces.map(({ url, ...face }) => face)
  fs.writeFileSync(path.join(partial, "faces.json"), JSON.stringify(declared, null, 2))
  fs.rmSync(CACHE, { recursive: true, force: true })
  fs.renameSync(partial, CACHE)
  return declared
}

const faces = await fetchFonts()
fs.rmSync("dist", { recursive: true, force: true })
fs.mkdirSync(FONTS_OUT, { recursive: true })
for (const face of faces) fs.copyFileSync(path.join(CACHE, face.file), path.join(FONTS_OUT, face.file))

// 1. The stylesheet, and the plugin ------------------------------------------------------------

const compileScss = {
  name: "scss",
  setup(build) {
    build.onLoad({ filter: /\.scss$/ }, (args) => {
      const { css, loadedUrls } = sass.compile(args.path, { style: "expanded" })
      return { contents: css, loader: "text", watchFiles: loadedUrls.map((url) => url.pathname) }
    })
  },
}

await esbuild.build({
  entryPoints: ["src/index.ts"],
  outfile: "dist/index.js",
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  plugins: [compileScss],
  define: { __SITE_STYLES_FONT_FACES__: JSON.stringify(faces) },
  logLevel: "warning",
})
