#!/usr/bin/env node
// Keeps README.md's generated blocks current, as Flowthru's examples do theirs
// (https://github.com/chaoticgoodcomputing/flowthru/blob/main/scripts/update-example-readmes.mjs):
//
//   - <!-- flowthru:mermaid:start --> … <!-- flowthru:mermaid:end -->: the flows' DAG, as the
//     Mermaid metadata extension writes it to Metadata/dag-merged.md on a dry run, which runs the
//     pre-flight checks and no step.
//   - <!-- flowthru:filetree:start --> … <!-- flowthru:filetree:end -->: the project's files, as
//     git would commit them, so what a crawl fetched and what a build made are never listed.
//
// Everything between a pair of markers is this script's; the rest of the README is the author's.
// A README without a pair gets one appended.

import { spawnSync } from "node:child_process"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const project = join(dirname(fileURLToPath(import.meta.url)), "..")
const readme = join(project, "README.md")
const NAME = "indieweb-graph"

function dag() {
  const run = spawnSync("dotnet", ["run", "--", "--dry-run"], { cwd: project, encoding: "utf8" })
  const merged = join(project, "Metadata", "dag-merged.md")
  if (run.status !== 0 || !existsSync(merged)) {
    const tail = `${run.stdout ?? ""}${run.stderr ?? ""}`.trim().split("\n").slice(-6).join("\n    ")
    console.warn(`⚠ The dry run made no Metadata/dag-merged.md (exit ${run.status}); the diagram is left as it was.\n    ${tail}`)
    return null
  }
  return readFileSync(merged, "utf8")
}

// The files git would commit, as a tree: tracked, or untracked and not ignored.
function filetree() {
  const listed = spawnSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "--deduplicate", "."], {
    cwd: project,
    encoding: "utf8",
  })
  if (listed.status !== 0) throw new Error(listed.stderr)
  const root = {}
  for (const path of listed.stdout.split("\n").filter(Boolean).sort()) {
    if (!existsSync(join(project, path))) continue
    let node = root
    for (const part of path.split("/")) node = node[part] ??= {}
  }
  const lines = [`${NAME}/`]
  const walk = (node, prefix) => {
    // Files before folders, as Flowthru's trees read: entry point, then data, then flows.
    const names = Object.keys(node).sort((a, b) => {
      const [aDir, bDir] = [Object.keys(node[a]).length > 0, Object.keys(node[b]).length > 0]
      return aDir === bDir ? a.localeCompare(b) : aDir ? 1 : -1
    })
    names.forEach((name, index) => {
      const last = index === names.length - 1
      const isDir = Object.keys(node[name]).length > 0
      lines.push(`${prefix}${last ? "└── " : "├── "}${name}${isDir ? "/" : ""}`)
      if (isDir) walk(node[name], prefix + (last ? "    " : "│   "))
    })
  }
  walk(root, "")
  return "```\n" + lines.join("\n") + "\n```"
}

function splice(content, block, payload) {
  const [start, end] = [`<!-- flowthru:${block}:start -->`, `<!-- flowthru:${block}:end -->`]
  const wrapped = `${start}\n${payload.trimEnd()}\n${end}`
  const from = content.indexOf(start)
  const to = from === -1 ? -1 : content.indexOf(end, from)
  if (to === -1) return `${content.trimEnd()}\n\n${wrapped}\n`
  return content.slice(0, from) + wrapped + content.slice(to + end.length)
}

let content = existsSync(readme) ? readFileSync(readme, "utf8") : `# ${NAME}\n`
const diagram = dag()
if (diagram !== null) content = splice(content, "mermaid", diagram)
content = splice(content, "filetree", filetree())
writeFileSync(readme, content)
console.log(`README.md: ${diagram === null ? "file tree" : "diagram and file tree"} synced`)
