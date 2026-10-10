// Icon ids, `prefix:name`, and the collections they name: an installed Iconify set, `mdi` from
// @iconify-json/mdi, or the site's own SVG files in src/icons, under the prefix `custom`. astro-icon
// draws them, inline, when the site builds (docs/adr/1101). It knows the site's own files as its
// "local" icons, named by the file alone, which is why an id is turned into its name here.
//
// Read where the Astro config runs, and in the unit tests: the files are found from this module's
// own place in the project.

import fs from "node:fs"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"

/** The prefix of the site's own icon collection: `custom:d20` is `src/icons/d20.svg`. */
export const SITE_ICONS = "custom"

const siteIcons = fileURLToPath(new URL("../icons/", import.meta.url))
const require = createRequire(import.meta.url)

// An icon id as Iconify writes one: a collection prefix and an icon name.
const ICON_ID = /^([a-z0-9]+(?:-[a-z0-9]+)*):([a-z0-9]+(?:-[a-z0-9]+)*)$/

interface IconSet {
  icons: Record<string, unknown>
  aliases?: Record<string, unknown>
}

// An installed set, by its prefix, or nothing when no such set is installed.
function installedSet(prefix: string): IconSet | undefined {
  try {
    return require(`@iconify-json/${prefix}/icons.json`) as IconSet
  } catch {
    return undefined
  }
}

/** Whether an icon id names an icon some collection has. */
export function hasIcon(id: string): boolean {
  const match = ICON_ID.exec(id)
  if (!match) return false
  const [, prefix, name] = match as unknown as [string, string, string]
  if (prefix === SITE_ICONS) return fs.existsSync(`${siteIcons}${name}.svg`)
  const set = installedSet(prefix)
  return set !== undefined && (Object.hasOwn(set.icons, name) || Object.hasOwn(set.aliases ?? {}, name))
}

/** The name astro-icon's `<Icon>` draws an icon id by: the id, or for the site's own the file's name. */
export function iconName(id: string): string {
  const [prefix, name] = id.split(":")
  return prefix === SITE_ICONS && name ? name : id
}

/**
 * An icon of Material Design Icons, the set astro-icon draws the site's others from, as an `<svg>`
 * element a Markdown plugin writes into a note, 1em square in the colour of its text. A Markdown
 * plugin can't render astro-icon's `<Icon>`, and the icon is written as elements, not as the set's
 * SVG text, since an MDX note is compiled to JSX, which holds no raw HTML (docs/adr/3402). An icon
 * that is anything but one path fails the build here rather than drawing part of itself.
 * `properties` are the `<svg>`'s besides its box.
 */
export function noteIcon(name: string, properties: Record<string, string> = {}) {
  const body = (installedSet("mdi")?.icons[name] as { body: string } | undefined)?.body ?? ""
  const d = /^<path fill="currentColor" d="([^"]+)"\/>$/.exec(body)?.[1]
  if (d === undefined) throw new Error(`mdi:${name} is not one path: ${body}`)
  return {
    type: "element" as const,
    tagName: "svg",
    properties: { viewBox: "0 0 24 24", width: "1em", height: "1em", ...properties },
    children: [{ type: "element" as const, tagName: "path", properties: { fill: "currentColor", d }, children: [] }],
  }
}
