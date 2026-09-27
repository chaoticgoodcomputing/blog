// The dependency DAG on the plugins' tag page (#86): a Mermaid flowchart of every package under
// quartz-v5/, drawn from what their manifests declare, and written between two generated markers in
// the description note of `projects/site/plugins`. The owner decided it is generated and guarded
// (review notes, 2026-09-26): tests/specs/plugin-dag.spec.mjs fails whenever the note's block differs
// from what this script would write.
//
//   node quartz-v5/utils/plugin-dag.mjs          rewrite the note's block  (pnpm nx run site-v5:plugin-dag)
//   node quartz-v5/utils/plugin-dag.mjs --check  exit 1 if it has drifted, writing nothing
//
// Two kinds of edge, drawn apart:
// - an engine edge, solid, from a plugin to each plugin its `quartz.dependencies` names. Those are
//   plugin names (ADR-0002's plugin-name amendment), matched as Quartz matches them: by package name,
//   `@chaoticgoodcomputing/quartz-<name>` for a plugin that is a package (#89, #93-#95), or, for a
//   plugin listed by a local source, its directory, which is also its package name. A package's
//   manifest name, `quartz.name`, names its CSS, not the plugin: a dependency on it finds nothing,
//   here or at a site;
// - a library edge, dotted, from a package to each of our libraries it builds with: a plugin's
//   `workspace:` devDependency (ADR-0005's *our libraries are inlined*; `file:` before #92), or a
//   library's `workspace:` dependency on another.
// Packages come in three groups, each drawn apart: the shareable plugins in plugins/ as boxes, the
// libraries in libs/ as stadiums, and the site plugins in site-plugins/ as hexagons in a subgraph of
// their own. Each is drawn by its directory, and a shareable plugin's node links to its plugin note,
// which is named for the directory too (`/plugins/quartz-graph`).
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { ourPackages } from "./packages.mjs"

export const quartzRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
export const vault = path.resolve(quartzRoot, "../content/public")
const TAG = "projects/site/plugins"

// Each group's kind (its directory is `KINDS` in packages.mjs), and how its nodes are drawn, in the
// order they are drawn. Only the site plugins get a subgraph: Mermaid lays out edges into and out of
// a subgraph badly, and nothing depends on a site plugin. The other two groups are told apart by shape: a plugin is a box, a
// library a stadium.
const GROUPS = [
  { kind: "plugin", shape: (label) => `["${label}"]` },
  { kind: "library", shape: (label) => `(["${label}"])` },
  { kind: "site-plugin", shape: (label) => `{{"${label}"}}`, subgraph: 'site_plugins["Site plugins"]' },
]

const START = "%% plugin-dag: start. Generated from the packages' manifests by `pnpm nx run site-v5:plugin-dag`: don't edit by hand. %%"
const END = "%% plugin-dag: end %%"

/**
 * Every package under `root`, sorted by group then directory: `{ dir, name, kind, engines,
 * libraries }`, where `engines` are the directories of the plugins its manifest depends on and
 * `libraries` those of the libraries it builds with. Throws on a dependency that names no package.
 */
export function readPackages(root = quartzRoot) {
  const kinds = GROUPS.map(({ kind }) => kind)
  const packages = ourPackages(path.dirname(root), kinds, root).map(({ dir, kind, pkg }) => ({ dir, kind, manifest: pkg }))
  const plugins = packages.filter((p) => p.manifest.quartz?.name)
  const byPluginName = new Map(plugins.map((p) => [p.manifest.name, p]))
  const libraryByName = new Map(packages.filter((p) => p.kind === "library").map((p) => [p.manifest.name, p]))
  return packages.map(({ dir, kind, manifest }) => {
    const engines = (manifest.quartz?.dependencies ?? []).map((name) => {
      const engine = byPluginName.get(name)
      if (!engine) throw new Error(`plugin-dag: ${dir} depends on ${name}, which no package under ${root} is named`)
      return engine.dir
    })
    const specs = { ...manifest.dependencies, ...manifest.devDependencies }
    const libraries = Object.entries(specs)
      .filter(([name, spec]) => libraryByName.has(name) && /^(file|workspace):/.test(spec))
      .map(([name]) => libraryByName.get(name).dir)
    return { dir, name: manifest.name, kind, engines: [...engines].sort(), libraries: libraries.sort() }
  })
}

const nodeId = (kind, dir) => `${kind.replace(/-/g, "_")}_${dir.replace(/[^A-Za-z0-9]/g, "_")}`

/** The Mermaid source of the DAG, without its fence. */
export function flowchart(packages) {
  const idOf = new Map(packages.map((p) => [p.dir, nodeId(p.kind, p.dir)]))
  const lines = ["flowchart LR"]
  for (const { kind, shape, subgraph } of GROUPS) {
    const members = packages.filter((p) => p.kind === kind)
    if (!members.length) continue
    const indent = subgraph ? "    " : "  "
    if (subgraph) lines.push(`  subgraph ${subgraph}`)
    for (const p of members) lines.push(`${indent}${idOf.get(p.dir)}${shape(p.dir)}`)
    if (subgraph) lines.push("  end")
  }
  for (const p of packages) for (const engine of p.engines) lines.push(`  ${idOf.get(p.dir)} --> ${idOf.get(engine)}`)
  for (const p of packages) for (const library of p.libraries) lines.push(`  ${idOf.get(p.dir)} -.-> ${idOf.get(library)}`)
  for (const p of packages.filter((p) => p.kind === "plugin")) lines.push(`  click ${idOf.get(p.dir)} "/plugins/${p.dir}"`)
  return lines.join("\n")
}

/** The note's generated block, markers included. */
export function generatedBlock(packages = readPackages()) {
  return [START, "", "```mermaid", flowchart(packages), "```", "", END].join("\n")
}

/** The generated block in a note's text, markers included, or null when it has none. */
export function blockOf(text) {
  const start = text.indexOf(START)
  const end = text.indexOf(END, start)
  return start < 0 || end < 0 ? null : text.slice(start, end + END.length)
}

/**
 * The tag's description note: `tags/projects/site/plugins.md` once the cutover rename (#43) has
 * moved it, and until then at the vault's current convention, `tags/projects/site/plugins/index.md`.
 */
export function notePath(vaultDir = vault) {
  const renamed = path.join(vaultDir, "tags", `${TAG}.md`)
  return fs.existsSync(renamed) ? renamed : path.join(vaultDir, "tags", TAG, "index.md")
}

function main(args) {
  const file = notePath()
  const text = fs.readFileSync(file, "utf8")
  const current = blockOf(text)
  if (current === null) throw new Error(`plugin-dag: ${file} has no generated block: add the two markers,\n${START}\n${END}`)
  const wanted = generatedBlock()
  const where = path.relative(process.cwd(), file)
  if (current === wanted) return console.log(`plugin-dag: ${where} is up to date`)
  if (args.includes("--check")) {
    console.error(`plugin-dag: ${where} has drifted from the packages' manifests. Run: pnpm nx run site-v5:plugin-dag`)
    process.exitCode = 1
    return
  }
  fs.writeFileSync(file, text.replace(current, () => wanted))
  console.log(`plugin-dag: wrote ${where}`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv.slice(2))
