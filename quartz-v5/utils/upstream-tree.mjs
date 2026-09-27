// Upstream Quartz's tree at one commit, fetched once and kept: the pinned ref's, by default.
//
// The drift and lock guards compare Core with its pinned ref on every run, so the tree is cached by
// commit, in `quartz-v5/.upstream-cache/trees/<sha>/` (gitignored): a depth-1 checkout, with its `.git`,
// so `git ls-files` lists what upstream tracks. It sits inside the upstream cache, beside the upgrade's
// bare repo (upstream-cache.mjs), so the repo has one cache directory. A commit never changes, so an
// entry never goes stale; delete the directory to reclaim the space. The first fetch takes a few seconds; after it, no
// network is needed.
import fs from "node:fs"
import path from "node:path"
import { REPO_ROOT } from "./core-tiers.mjs"
import { CACHE_REL } from "./upstream-cache.mjs"
import { gitFrom, readManifest, sh } from "./upstream-git.mjs"

/** Where the checkouts live, relative to the repo root: `trees/` in the upstream cache. */
export const TREES_REL = `${CACHE_REL}/trees`

/**
 * The directory holding upstream's tree at commit `ref` of `repo`, fetching it on first use. Both
 * default to the pinned ref in upstream.json. `ref` must be a full commit sha: a branch moves.
 */
export function upstreamTree({ repo, ref } = {}) {
  const manifest = repo && ref ? {} : readManifest()
  repo ??= manifest.repo
  ref ??= manifest.commit
  if (!/^[0-9a-f]{40}$/.test(ref)) throw new Error(`upstreamTree caches by commit: ${ref} is not a full sha`)
  const root = path.join(REPO_ROOT, TREES_REL)
  const dir = path.join(root, ref)
  if (fs.existsSync(dir)) return dir

  // Fetch beside the entry, then rename it into place: a directory at `dir` is always complete, and
  // two guards fetching at once (the runner starts them together) both end with the same tree.
  fs.mkdirSync(root, { recursive: true })
  const tmp = fs.mkdtempSync(path.join(root, `.fetching-${ref.slice(0, 12)}-`))
  try {
    process.stderr.write(`  fetching upstream ${ref.slice(0, 12)} into ${TREES_REL}/ (once)…\n`)
    sh("git", ["init", "--quiet", tmp])
    gitFrom(repo, ["-C", tmp, "fetch", "--quiet", "--depth", "1", repo, ref])
    sh("git", ["-C", tmp, "-c", "advice.detachedHead=false", "checkout", "--quiet", "FETCH_HEAD"])
    try {
      fs.renameSync(tmp, dir)
    } catch (err) {
      if (!fs.existsSync(dir)) throw err // anything but losing the race is a real failure
    }
    return dir
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
}
