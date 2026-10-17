// Assembles the site's vault, dist/vault, from its sources: `pnpm nx run astro:vault`, which the
// build and the dev server run first (src/lib/assembly.ts). The sources are the public vault,
// content/public, and the private notes' stubs, dist/vault-private, in that order; one that isn't
// there is empty. The assembly only reads them, and writes only into dist/vault, which git ignores.
// Two sources with a file at the same path fail it, naming both.

import path from "node:path"
import { fileURLToPath } from "node:url"
import { assembleVault } from "../src/lib/assembly.ts"

const repository = fileURLToPath(new URL("../../", import.meta.url))
const sources = ["content/public", "dist/vault-private"].map((source) => path.join(repository, source))
const root = path.join(repository, "dist/vault")

try {
  const { files } = assembleVault(sources, root)
  console.log(`${files.size} files assembled into ${path.relative(process.cwd(), root)}.`)
} catch (error) {
  console.error(`✗ ${(error as Error).message}`)
  process.exitCode = 1
}
