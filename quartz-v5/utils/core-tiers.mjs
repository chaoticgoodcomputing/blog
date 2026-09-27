// Quartz Core's tiers (quartz-v5/VENDORED.md, ADR-0001's tiers amendment): which of Core's files
// are Core source, steering files, scaffolding, pruned upstream files, or Core's own pnpm files.
//
// The one place these lists live. The upstream tooling (`upstream.mjs`) reads them to decide what
// counts as drift; the repo guards and the upgrade read them too. Every path is relative to Core's
// root, `quartz-v5/core/`, with `/`, and a directory ends in `/`.
import path from "node:path"
import { fileURLToPath } from "node:url"

/** The repo root. */
export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..")
/** Core's root, relative to the repo root: upstream's install root, and Quartz's cwd. */
export const CORE_REL = "quartz-v5/core"
/** Core's root, absolute. */
export const CORE_DIR = path.join(REPO_ROOT, CORE_REL)
/** The pinned ref's record, relative to the repo root. */
export const MANIFEST_REL = "quartz-v5/upstream.json"
/**
 * The pnpm that installs Core, by exact version, whatever pnpm the repo root pins (VENDORED.md): the
 * one the upgrade and the `core-lock` guard import Core's lock with. The one other copy is
 * `site-v5:install`'s command in quartz-v5/project.json, which cannot import it: bump both together.
 */
export const CORE_PNPM = "pnpm@11.27.1"

/**
 * Core source: Core's `quartz/` tree, protected. It changes only through a vendored change, and it
 * keeps its name because Quartz's own `bin` and imports point at it.
 */
export const SOURCE = ["quartz/"]

/**
 * Steering files: the Core files Quartz's docs tell a site to edit. Edits to them are not drift,
 * and an upgrade never overwrites them. `quartz.config.yaml` is the site config.
 */
export const STEERING = ["quartz.ts", "quartz.config.yaml"]

/** Scaffolding: upstream's toolchain files at Core's root, taken from upstream on each upgrade. */
export const SCAFFOLDING = [
  "package.json",
  "tsconfig.json",
  "globals.d.ts",
  "index.d.ts",
  ".gitignore",
  ".prettierignore",
  ".prettierrc",
  "LICENSE.txt",
]

/**
 * Pruned files: upstream files deliberately absent from Core (#89), kept out of every diff and
 * never brought back by an upgrade. Upstream's docs, CI, container and community files, its
 * default config (so a missing site config fails loudly rather than building upstream's defaults)
 * and its npm files (Core installs with pnpm, from `PNPM_FILES`).
 */
export const PRUNED = [
  "docs/",
  ".github/",
  "README.md",
  "CODE_OF_CONDUCT.md",
  "Dockerfile",
  ".gitattributes",
  "content/.gitkeep",
  ".node-version",
  "quartz.config.default.yaml",
  "package-lock.json",
  ".npmrc",
]

/**
 * Core's pnpm files: ours, not upstream's. Core is a pnpm project of its own, and its lock is
 * `pnpm import`ed from the pinned ref's `package-lock.json` (`core-lock.mjs`).
 */
export const PNPM_FILES = ["pnpm-workspace.yaml", "pnpm-lock.yaml"]

/** The four tiers, and Core's pnpm files as "pnpm", by name, in the order `tierOf` tries them. */
export const TIERS = { source: SOURCE, steering: STEERING, scaffolding: SCAFFOLDING, pruned: PRUNED, pnpm: PNPM_FILES }

const matches = (rel, entry) => (entry.endsWith("/") ? rel.startsWith(entry) : rel === entry)

/**
 * The tier of a path relative to Core's root: "source", "steering", "scaffolding", "pruned" or
 * "pnpm", or null for a path in none of them (a file upstream added at Core's root, or one of ours
 * that has no business there).
 */
export function tierOf(rel) {
  const normal = rel.split(path.sep).join("/").replace(/^\.\//, "")
  for (const [tier, entries] of Object.entries(TIERS)) {
    if (entries.some((entry) => matches(normal, entry))) return tier
  }
  return null
}

/**
 * Whether a difference at this path is drift. Drift is any difference between Core and its pinned
 * ref except in steering files, pruned files and Core's pnpm files.
 */
export const countsAsDrift = (rel) => !["steering", "pruned", "pnpm"].includes(tierOf(rel))
