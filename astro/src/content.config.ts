import path from "node:path"
import { defineCollection } from "astro:content"
import { glob, type Loader, type LoaderContext } from "astro/loaders"
import { z } from "astro/zod"
import { assembleVault, readManifest } from "./lib/assembly.ts"
import { getLinksDigest } from "./lib/notes.ts"
import { VAULT_ROOT, refreshVault, slugFor } from "./lib/vault.ts"

/**
 * The vault's notes, loaded by Astro's own `glob`, with one addition. `glob` keeps a note's rendered
 * HTML for as long as that note's own source is unchanged, but a note's links depend on the rest of
 * the vault, and on where the notes query sends a link to each file of it: adding or renaming one
 * note changes where another's link goes, and so does a rule that takes a kind of note out of
 * publication. A note that embeds another shows that note's content too, so an edit to the one
 * changes the other's page. So the loader keeps the notes query's links digest beside the notes,
 * which covers all of these, and when it has changed, renders every note again (docs/adr/0201).
 *
 * The digest knows the query's answers, not the code of a Markdown plugin. A change to how a plugin
 * renders is followed by `astro build --force` (README.md, "Tests").
 *
 * In dev it also does `glob`'s watching itself, since the vault has to be read again before any note
 * is rendered against it. An assembled vault (src/lib/assembly.ts) is watched at its sources, where
 * Obsidian saves, and assembled again before it is read: in this process rather than by a watcher of
 * its own beside the dev server, so a change is in the vault before the vault is read again, and a
 * vault the dev server has open is never assembled by anyone else. Assembling again rewrites only
 * what changed, in a fraction of a second.
 */
function vaultNotes(): Loader {
  const notes = glob({
    base: VAULT_ROOT,
    pattern: "**/*.{md,mdx}",
    generateId: ({ entry }) => slugFor(entry),
  })

  const sync = async (context: LoaderContext) => {
    const digest = getLinksDigest()
    if (context.meta.get("vault-links-digest") !== digest) {
      context.store.clear()
      context.meta.set("vault-links-digest", digest)
    }
    // Without the watcher, `glob` loads once and registers no handlers of its own.
    await notes.load({ ...context, watcher: undefined })
  }

  return {
    name: "vault-notes",
    async load(context) {
      await sync(context)

      const watcher = context.watcher
      if (!watcher) return
      // A vault that is not assembled is its own source.
      const sources = readManifest(VAULT_ROOT)?.sources
      const watched = sources ?? [VAULT_ROOT]
      watcher.add(watched)

      // A save often arrives as several events, so they are gathered, and one refresh runs at a time.
      let timer: ReturnType<typeof setTimeout> | undefined
      let running = Promise.resolve()
      const refresh = (changed: string) => {
        const relative = watched
          .map((root) => path.relative(root, changed))
          .find((relative) => !relative.startsWith("..") && !path.isAbsolute(relative))
        if (relative === undefined || relative.split(path.sep).some((part) => part.startsWith("."))) return
        clearTimeout(timer)
        timer = setTimeout(() => {
          running = running
            .then(async () => {
              if (sources) assembleVault(sources, VAULT_ROOT)
              await refreshVault()
              await sync(context)
              context.logger.info(`Vault read again after a change to ${relative}`)
            })
            .catch((error) => context.logger.error(`Vault refresh failed: ${(error as Error).message}`))
        }, 50)
      }
      watcher.on("add", refresh)
      watcher.on("change", refresh)
      watcher.on("unlink", refresh)
    },
  }
}

const notes = defineCollection({
  loader: vaultNotes(),
  // No property is read from an entry. What a note knows (its title, tags, date, whether it is
  // private) is asked of the notes query, src/lib/notes.ts, which reads the vault's own cache; the
  // collection is what renders a note's body (docs/adr/0006). A vault's notes carry whatever
  // properties their plugins write, so an entry's data is left as it comes.
  schema: z.looseObject({}),
})

export const collections = { notes }
