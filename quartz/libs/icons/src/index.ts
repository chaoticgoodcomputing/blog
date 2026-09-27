// @chaoticgoodcomputing/icons: an icon id, drawn (#29). It resolves `prefix:name` to inline SVG
// when the site builds, from an installed Iconify set (`mdi`, from @iconify-json/mdi) or from a
// directory of SVG files the site supplies as an icon collection (`custom`). Every icon comes out
// painted in `currentColor`, so CSS gives it its colour and size (ADR-0003). An id no collection
// has throws.
//
// Server-side only: it reads the file system. A plugin draws icons while the site builds, and a
// script that needs them in the browser carries the markup in its own published artifact.
import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"
import type { IconifyJSON } from "@iconify/types"
import { getIconData, iconToHTML, iconToSVG, replaceIDs } from "@iconify/utils"
import { isEmptyColor, parseColors } from "@iconify/tools/lib/colors/parse"
import { importDirectorySync } from "@iconify/tools/lib/import/directory"
import { runSVGO } from "@iconify/tools/lib/optimise/svgo"

/**
 * Icon collections a site supplies: each prefix, and the directory of SVG files that holds it. A
 * relative directory resolves against the Quartz root, as a local plugin `source:` does. One file
 * is one icon, named after the file: `icons/d20.svg` is `custom:d20` under `{ custom: "icons" }`.
 */
export type IconCollections = Record<string, string>

export interface IconsOptions {
  /** The site's own collections. Installed Iconify sets (`mdi`) need no entry. */
  iconCollections?: IconCollections
}

export interface Icons {
  /**
   * The icon an id names, as an `<svg>` element whose every mark is painted in `currentColor`.
   * `attributes` go on the element, over its defaults: `width` and `height` of `1em`, the icon's
   * `viewBox`, and `aria-hidden="true"`, since an icon is decoration beside the words it stands
   * for.
   * Throws an `IconError` on an id that isn't `prefix:name`, or that no collection has.
   */
  svg(id: string, attributes?: Record<string, string>): string
}

/** A misspelt or unknown icon id, or a collection that can't be read. */
export class IconError extends Error {
  override name = "IconError"
}

// An icon id as Iconify writes one: a collection prefix and an icon name.
const ICON_ID = /^([a-z0-9]+(?:-[a-z0-9]+)*):([a-z0-9]+(?:-[a-z0-9]+)*)$/

// Installed sets resolve from wherever this code runs: inlined into a plugin, from the plugin's own
// dependencies. Nothing is fetched.
const resolveFromHere = createRequire(import.meta.url)

function installedCollection(prefix: string): IconifyJSON | undefined {
  try {
    return resolveFromHere(`@iconify-json/${prefix}/icons.json`) as IconifyJSON
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "MODULE_NOT_FOUND") return undefined
    throw err
  }
}

// A site's SVG files, as an Iconify set: each is cleaned, has every colour it paints turned into
// `currentColor` (a mark it leaves unpainted, such as `fill="none"`, stays so), and is optimised.
function importCollection(prefix: string, directory: string): IconifyJSON {
  const root = path.resolve(directory)
  if (!fs.statSync(root, { throwIfNoEntry: false })?.isDirectory()) {
    throw new IconError(
      `icon collection "${prefix}": ${JSON.stringify(directory)} is not a directory (${root})`,
    )
  }
  const set = (() => {
    try {
      return importDirectorySync(root, { prefix })
    } catch (err) {
      throw new IconError(`icon collection "${prefix}" (${root}): ${(err as Error).message}`)
    }
  })()
  set.forEachSync((name, type) => {
    if (type !== "icon") return
    const svg = set.toSVG(name)
    if (!svg) return
    try {
      parseColors(svg, {
        defaultColor: "currentColor",
        callback: (_attr, colour, parsed) =>
          parsed && isEmptyColor(parsed) ? colour : "currentColor",
      })
      runSVGO(svg)
    } catch (err) {
      throw new IconError(`icon "${prefix}:${name}" (${root}): ${(err as Error).message}`)
    }
    set.fromSVG(name, svg)
  })
  return set.export()
}

// Normalised once per process, however many plugins or components ask.
const imported = new Map<string, IconifyJSON>()

/** Draws icon ids, from the installed Iconify sets and the site's own `iconCollections`. */
export function createIcons(options: IconsOptions = {}): Icons {
  const configured = options.iconCollections ?? {}
  const collections = new Map<string, IconifyJSON>()

  const collectionOf = (id: string, prefix: string): IconifyJSON => {
    let collection = collections.get(prefix)
    if (collection) return collection
    const directory = Object.hasOwn(configured, prefix) ? configured[prefix] : undefined
    if (directory !== undefined) {
      const key = `${prefix}\0${path.resolve(directory)}`
      collection = imported.get(key) ?? importCollection(prefix, directory)
      imported.set(key, collection)
    } else {
      collection = installedCollection(prefix)
    }
    if (!collection) {
      const known = Object.keys(configured)
      throw new IconError(
        `unknown icon ${JSON.stringify(id)}: no icon collection "${prefix}" is installed` +
          (known.length
            ? ` or configured (${known.map((p) => `"${p}"`).join(", ")})`
            : " or configured"),
      )
    }
    collections.set(prefix, collection)
    return collection
  }

  return {
    svg(id, attributes = {}) {
      const match = ICON_ID.exec(id)
      if (!match) throw new IconError(`${JSON.stringify(id)} is not an icon id, prefix:name`)
      const [, prefix, name] = match
      const data = getIconData(collectionOf(id, prefix), name)
      if (!data) {
        throw new IconError(
          `unknown icon ${JSON.stringify(id)}: the "${prefix}" collection has no icon "${name}"`,
        )
      }
      const { attributes: size, body } = iconToSVG(data)
      return iconToHTML(replaceIDs(body), {
        ...size,
        "aria-hidden": "true",
        ...Object.fromEntries(Object.entries(attributes).map(([k, v]) => [k, escape(v)])),
      })
    },
  }
}

// iconToHTML writes attribute values as they come.
const escape = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;")
