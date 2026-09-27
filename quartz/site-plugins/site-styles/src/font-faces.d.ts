// build.mjs fetches the site's fonts and writes what each face declares here (#84).
declare const __SITE_STYLES_FONT_FACES__: {
  family: string
  style: string
  weight: string
  display: string
  unicodeRange: string
  /** The face's file, in dist/fonts/ and, once emitted, in the site's `static/site-styles/fonts/`. */
  file: string
}[]
