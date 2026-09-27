// The upstream cache: a bare git repo, `quartz-v5/.upstream-cache/` (gitignored), that holds every
// upstream commit the upgrade has fetched. The upgrade reads the pinned and target trees from it
// without checking either out, and a ref already fetched is never fetched again, so a rerun, or an
// upgrade to the pinned ref, needs no network.
import { existsSync, mkdirSync } from "node:fs"
import path from "node:path"
import { gitFrom, sh } from "./upstream-git.mjs"

/** The cache's path, relative to the repo root. */
export const CACHE_REL = "quartz-v5/.upstream-cache"

/** A full commit id: what the cache, and the guards' checkouts (upstream-tree.mjs), key commits by. */
export const SHA = /^[0-9a-f]{40}$/

/** Open the cache at `dir`, creating it if need be. Returns `dir`. */
export function openCache(dir) {
  if (!existsSync(path.join(dir, "HEAD"))) {
    mkdirSync(dir, { recursive: true })
    sh("git", ["init", "--quiet", "--bare", dir])
  }
  return dir
}

const hasCommit = (cache, sha) => {
  try {
    sh("git", ["-C", cache, "cat-file", "-e", `${sha}^{commit}`])
    return true
  } catch {
    return false
  }
}

/**
 * Fetch `ref` (a commit, branch or tag) of `repo` into the cache and return the commit it names. A
 * commit the cache already holds is not fetched again. Each fetched commit is kept under
 * `refs/fetched/<sha>`, so git never collects it.
 */
export function fetchRef(cache, repo, ref) {
  if (SHA.test(ref) && hasCommit(cache, ref)) return ref
  try {
    gitFrom(repo, ["-C", cache, "fetch", "--quiet", "--depth=1", repo, ref])
  } catch (err) {
    throw new Error(
      `could not fetch ${ref} from ${repo}: ${String(err.stderr ?? err.message).trim()}`,
    )
  }
  const sha = sh("git", ["-C", cache, "rev-parse", "--verify", "FETCH_HEAD^{commit}"]).trim()
  sh("git", ["-C", cache, "update-ref", `refs/fetched/${sha}`, sha])
  return sha
}

/**
 * Every file of commit `sha`, as a Map of path → `{ mode, blob }`, where `mode` is the file mode
 * git records ("100644", "100755", "120000") and `blob` the object id.
 */
export function commitFiles(cache, sha) {
  const out = sh("git", ["-C", cache, "ls-tree", "-r", "-z", "--full-tree", sha])
  const files = new Map()
  for (const entry of out.split("\0").filter(Boolean)) {
    const [meta, rel] = [entry.slice(0, entry.indexOf("\t")), entry.slice(entry.indexOf("\t") + 1)]
    const [mode, type, blob] = meta.split(" ")
    if (type === "blob") files.set(rel, { mode, blob })
  }
  return files
}

/** One blob's contents, as a Buffer. */
export const readBlob = (cache, blob) =>
  sh("git", ["-C", cache, "cat-file", "blob", blob], { encoding: "buffer" })
