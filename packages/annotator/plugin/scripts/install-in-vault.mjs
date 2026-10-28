// Installs the build, dist/, as a vault's copy of the plugin: into <vault>/.obsidian/plugins/<id>/,
// <id> being manifest.json's. Every file of the build replaces the one there; what else the folder
// holds stays, data.json among it, which is the plugin's settings. Obsidian picks the new build up
// when the plugin is next loaded: restart Obsidian, or turn the plugin off and on.
//
//   node scripts/install-in-vault.mjs [--vault=<path>]
//
// The vault is this repository's, content/, unless --vault names another.

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { parseArgs } from "node:util"

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const dist = path.join(root, "dist")
const { values } = parseArgs({ options: { vault: { type: "string" } } })
const vault = path.resolve(values.vault ?? path.join(root, "..", "..", "..", "content"))

if (!fs.existsSync(path.join(dist, "main.js"))) {
  console.error(`No build in ${dist}: build the plugin first.`)
  process.exit(1)
}
if (!fs.existsSync(path.join(vault, ".obsidian"))) {
  console.error(`${vault} is no Obsidian vault: it has no .obsidian folder.`)
  process.exit(1)
}

const { id } = JSON.parse(fs.readFileSync(path.join(dist, "manifest.json"), "utf8"))
const target = path.join(vault, ".obsidian", "plugins", id)
fs.mkdirSync(target, { recursive: true })
for (const entry of fs.readdirSync(dist, { recursive: true, withFileTypes: true })) {
  if (!entry.isFile()) continue
  const from = path.join(entry.parentPath, entry.name)
  const to = path.join(target, path.relative(dist, from))
  fs.mkdirSync(path.dirname(to), { recursive: true })
  fs.copyFileSync(from, to)
}
console.log(`Installed ${id} into ${target}`)
