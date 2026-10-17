// Where a note's text is in the repository, for the link to its source (SourceLink.astro).

import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { site } from "../site.config.ts"
import { type Manifest, readManifest } from "./assembly.ts"
import { VAULT_ROOT } from "./vault.ts"

/** Where an assembled vault's files came from: its manifest, and the root of the repository its sources are in. */
interface Sources {
  manifest: Manifest
  repository: string
}

// Read once for each vault: every page asks.
const sourcesOf = new Map<string, Sources | undefined>()

function sources(vaultRoot: string): Sources | undefined {
  if (!sourcesOf.has(vaultRoot)) {
    const manifest = readManifest(vaultRoot)
    let repository: string | undefined
    try {
      repository = manifest && execFileSync("git", ["rev-parse", "--show-toplevel"], { cwd: vaultRoot, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim()
    } catch {
      repository = undefined
    }
    sourcesOf.set(vaultRoot, manifest && repository ? { manifest, repository } : undefined)
  }
  return sourcesOf.get(vaultRoot)
}

/**
 * The path in the repository of the file that holds a note's text. In a vault `astro:vault`
 * assembled, that is its source file, as the manifest names it: `content/public/<path>` for a
 * public note, `dist/vault-private/<path>` for a private note's stub. In any other vault, it is the
 * note's path under `vaultPath`, the vault's folder in the repository.
 */
export function sourcePath(
  file: { path: string },
  vaultPath: string = site.repository.vaultPath,
  vaultRoot: string = VAULT_ROOT,
): string {
  const assembled = sources(vaultRoot)
  const source = assembled?.manifest.files.get(file.path)
  // Git names the repository by its real path, so the source is read by its real path too.
  if (assembled && source) return path.relative(assembled.repository, fs.realpathSync(source)).split(path.sep).join("/")
  return `${vaultPath}/${file.path}`
}
