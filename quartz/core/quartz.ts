import fs from "node:fs"
import path from "node:path"
import YAML from "yaml"
import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"
import { PageTypeDispatcher } from "./quartz/plugins/pageTypes/dispatcher"
import { componentRegistry } from "./quartz/components/registry"
import ConditionalRender from "./quartz/components/ConditionalRender"
import type { FullPageLayout } from "./quartz/cfg"
import type { QuartzComponent, QuartzComponentConstructor } from "./quartz/components/types"

// A steering file of Quartz Core (VENDORED.md): upstream's template, plus the site's one layout rule
// that its YAML config can't express (#70).
//
// v4's home page had components no other page has: the post listing after the body, and the
// "Newsletter" subscribe box and the social cards in the right sidebar. Quartz 5 ships no `is-index`
// condition, and the site adds none (the owner's decision on #70). So the site config gives each of
// them its slot as usual, and this file keeps each to the index page, plus the page types named for
// it here, by wrapping it wherever else it is placed in a condition that holds on the index alone.
// Each is named as the config's `byPageType.exclude` names it: a package source by its package name,
// an object source by its `name`.
const HOME_PAGE: Record<string, string[]> = {
  // v4's index, 404 and tags layouts listed the posts.
  "@chaoticgoodcomputing/quartz-post-listing": ["tag", "404"],
  // v4's index and tags layouts had the sidebar box.
  "email-subscribe-sidebar": ["tag"],
  // v4's index alone had the cards.
  "@chaoticgoodcomputing/quartz-social": [],
}

// The rule is the site's. Every root the e2e harness builds shares this file, since Quartz bundles
// it from Core's own path, so it applies only to a config that loads the site's own layer,
// site-components, which no fixture config does: a fixture site stays a stock one.
const SITE_LAYER = "@chaoticgoodcomputing/site-components"

const config = await loadQuartzConfig()
export default config
export const layout = await loadQuartzLayout()

type Slot = "header" | "beforeBody" | "afterBody" | "left" | "right" | "footer"
const SLOTS: Slot[] = ["header", "beforeBody", "afterBody", "left", "right", "footer"]
// Prefixes the `displayName` of each home page component built for the marked layout.
const MARKER = "site-home-page:"

const onIndex = (component: QuartzComponent) =>
  ConditionalRender({ component, condition: ({ fileData }) => fileData.slug === "index" })

const pascal = (name: string) =>
  name
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("")

type Source = string | { repo?: string; name?: string }

function readSiteConfig(): { plugins?: { source: Source; enabled?: boolean }[] } {
  // A root without quartz.config.yaml builds from Core's fallbacks, which never load the site layer.
  const file = path.join(process.cwd(), "quartz.config.yaml")
  if (!fs.existsSync(file)) return {}
  return YAML.parse(fs.readFileSync(file, "utf8")) ?? {}
}

// An entry's name as Core's loader and `byPageType.exclude` give it: an object source's `name`,
// else its `repo`; a package source's whole package name.
const entryName = (source: Source) =>
  typeof source === "object" && source !== null ? (source.name ?? source.repo) : source

const enabledEntries = (readSiteConfig().plugins ?? []).filter(({ enabled }) => enabled)
const loadsSiteLayer = enabledEntries.some(
  ({ source }) =>
    source === SITE_LAYER || (typeof source === "object" && source?.repo === SITE_LAYER),
)

// Not through `loadQuartzLayout`'s own override (`layoutOverrides`, with `byPageType`): it replaces
// a slot's whole array rather than merging into it, and Core never reads this file's `layout`
// export. So this file finds the YAML-placed components itself and rebuilds Core's dispatcher. It
// leans on Core internals an upgrade must re-check (VENDORED.md, "The site's quartz.ts"), and fails
// the build, rather than placing a component on every page, when one of them changes.
if (loadsSiteLayer) {
  // Quartz builds each placed component from the constructor it registered for the entry, and
  // wraps it for the entry's `display` and `condition`. Each home page component's constructor is
  // swapped, for one layout build, for one that marks what it builds by its `displayName`, which
  // the `display` wrappers copy outwards. So the outermost component in a slot says which entry it
  // is, and is kept to the index as a whole: no empty `desktop-only` wrapper is left on other
  // pages. A `condition` wrapper copies no `displayName`, so a home page component can't take one
  // in the config; the check below says so.
  const restore: (() => void)[] = []
  const placing = new Set<string>()
  for (const name of Object.keys(HOME_PAGE)) {
    const key = [name, pascal(name)].find((k) => componentRegistry.get(k))
    if (!key) {
      // Not enabled in this config: nothing to place. Enabled, Core would place it where this file
      // can't mark it, on every page, so the build stops.
      if (enabledEntries.some(({ source }) => entryName(source) === name))
        throw new Error(
          `quartz.ts: "${name}" is enabled but Core's component registry has it under neither ` +
            `"${name}" nor "${pascal(name)}", so it can't be kept to its pages. ` +
            "Re-check quartz.ts against Core's registry (VENDORED.md, \"The site's quartz.ts\").",
        )
      continue
    }
    const registered = componentRegistry.get(key)!
    const ctor = registered.component as QuartzComponentConstructor
    const marking: QuartzComponentConstructor = (opts) => {
      const marked = ConditionalRender({ component: ctor(opts), condition: () => true })
      marked.displayName = MARKER + name
      return marked
    }
    componentRegistry.register(key, marking, registered.source, registered.manifest)
    placing.add(name)
    restore.push(() =>
      componentRegistry.register(key, ctor, registered.source, registered.manifest),
    )
  }
  const marked = await loadQuartzLayout()
  for (const undo of restore) undo()

  const found = new Set<string>()
  const nameOf = (component: QuartzComponent) =>
    component.displayName?.startsWith(MARKER)
      ? component.displayName.slice(MARKER.length)
      : undefined
  for (const slots of [marked.defaults, ...Object.values(marked.byPageType)])
    for (const slot of SLOTS) for (const c of slots[slot] ?? []) found.add(nameOf(c) ?? "")
  for (const name of placing)
    if (!found.has(name))
      throw new Error(
        `quartz.ts: "${name}" is enabled but none of its placements is marked. ` +
          "A home page component takes no `condition` in the site config.",
      )

  const place = (
    slots: Partial<FullPageLayout>,
    pageType: string | null,
  ): Partial<FullPageLayout> => {
    const placed: Partial<FullPageLayout> = { ...slots }
    for (const slot of SLOTS) {
      placed[slot] = slots[slot]?.map((component) => {
        const name = nameOf(component)
        if (name === undefined || (pageType !== null && HOME_PAGE[name].includes(pageType)))
          return component
        return onIndex(component)
      })
    }
    return placed
  }

  // Every page type gets its layout spelled out, so each is placed by its own name, not by the
  // defaults a page type without an override of its own would fall back to.
  if (!config.plugins.pageTypes?.length) throw new Error("quartz.ts: Core loaded no page types")
  const pageTypes = config.plugins.pageTypes.map((pt) => pt.layout)
  layout.defaults = place(marked.defaults, null)
  layout.byPageType = Object.fromEntries(
    pageTypes.map((pt) => [pt, place(marked.byPageType[pt] ?? marked.defaults, pt)]),
  )

  // Core builds its page dispatcher from the YAML layout inside `loadQuartzConfig`, and nothing
  // reads this file's `layout` export, so the dispatcher is rebuilt from it.
  const emitters = config.plugins.emitters
  const at = emitters.findIndex((emitter) => emitter.name === "PageTypeDispatcher")
  if (at < 0) throw new Error("quartz.ts: Core's PageTypeDispatcher emitter is missing")
  emitters[at] = PageTypeDispatcher({ defaults: layout.defaults, byPageType: layout.byPageType })
}
