// Reaching upstream Quartz: the pinned ref's record, and git fetches from the upstream repo it names.
// Every fetch of upstream's files goes through the upstream cache: the upgrade's bare repo
// (`upstream-cache.mjs`), or the checkouts beside it (`upstream-tree.mjs`) that the guards, the
// upstream tooling (`upstream.mjs`) and the lock check (`core-lock.mjs`) read.
import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"
import path from "node:path"
import { MANIFEST_REL, REPO_ROOT } from "./core-tiers.mjs"

export const sh = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { encoding: "utf-8", stdio: "pipe", maxBuffer: 256 * 1024 * 1024, ...opts })

/** The pinned ref's record, `quartz/upstream.json`: `{ repo, branch, commit, version, vendoredOn }`. */
export const readManifest = () => JSON.parse(readFileSync(path.join(REPO_ROOT, MANIFEST_REL), "utf-8"))

// Upstream is public, so it is fetched from exactly the URL upstream.json names. A user's
// `url.<base>.insteadOf` rewrite (https to ssh, say) would otherwise send the fetch through
// credentials it doesn't need, and fail wherever they aren't available. Git applies the longest
// matching rewrite, so mapping the URL to itself wins over any shorter one.
const pinUrl = (repo) => ["-c", `url.${repo}.insteadOf=${repo}`]

/** git, fetching from `repo` as upstream.json names it. */
export const gitFrom = (repo, args, opts) => sh("git", [...pinUrl(repo), ...args], opts)

/** The commit a branch of `repo` points at. */
export function resolveLatest(repo, branch) {
  const sha = gitFrom(repo, ["ls-remote", repo, `refs/heads/${branch}`]).split(/\s+/)[0]
  if (!sha) throw new Error(`could not resolve ${branch} on ${repo}`)
  return sha
}
