// Where a note's text is in the repository, for the link to its source (SourceLink.astro).

import { site } from "../site.config.ts"

/** The path in the repository of the file that holds a note's text: its path in the vault, under the vault's folder. */
export function sourcePath(file: { path: string }, vaultPath: string = site.repository.vaultPath): string {
  return `${vaultPath}/${file.path}`
}
