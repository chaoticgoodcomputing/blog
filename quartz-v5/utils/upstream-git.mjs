// Reaching upstream Quartz: the pinned ref's record, and git fetches from the upstream repo it names.
// Shared by the upstream tooling (`upstream.mjs`) and the lock check (`core-lock.mjs`).
import { execFileSync } from "node:child_process"
import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { MANIFEST_REL, REPO_ROOT } from "./core-tiers.mjs"

export const sh = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { encoding: "utf-8", stdio: "pipe", maxBuffer: 256 * 1024 * 1024, ...opts })

/** The pinned ref's record, `quartz-v5/upstream.json`: `{ repo, branch, commit, version, vendoredOn }`. */
export const readManifest = () => JSON.parse(readFileSync(path.join(REPO_ROOT, MANIFEST_REL), "utf-8"))

// Upstream is public, so it is fetched from exactly the URL upstream.json names. A user's
// `url.<base>.insteadOf` rewrite (https to ssh, say) would otherwise send the fetch through
// credentials it doesn't need, and fail wherever they aren't available. Git applies the longest
// matching rewrite, so mapping the URL to itself wins over any shorter one.
const pinUrl = (repo) => ["-c", `url.${repo}.insteadOf=${repo}`]

/** git, fetching from `repo` as upstream.json names it. */
export const gitFrom = (repo, args, opts) => sh("git", [...pinUrl(repo), ...args], opts)

/** Clone `ref` of `repo` into a temp dir and return its path. The caller removes it. */
export function cloneUpstream(repo, ref) {
  const dir = mkdtempSync(path.join(tmpdir(), "quartz-upstream-"))
  process.stderr.write(`  fetching ${ref.slice(0, 12)} from upstream…\n`)
  gitFrom(repo, ["clone", "--quiet", "--no-checkout", repo, dir])
  sh("git", ["-C", dir, "checkout", "--quiet", ref])
  return dir
}

/** The commit a branch of `repo` points at. */
export function resolveLatest(repo, branch) {
  const sha = gitFrom(repo, ["ls-remote", repo, `refs/heads/${branch}`]).split(/\s+/)[0]
  if (!sha) throw new Error(`could not resolve ${branch} on ${repo}`)
  return sha
}

/** The contents of one file of `repo` at commit `ref`, fetched alone (a depth-1 fetch). */
export function showUpstreamFile(repo, ref, file) {
  const dir = mkdtempSync(path.join(tmpdir(), "quartz-upstream-file-"))
  try {
    sh("git", ["init", "--quiet", dir])
    gitFrom(repo, ["-C", dir, "fetch", "--quiet", "--depth", "1", repo, ref])
    return sh("git", ["-C", dir, "show", `FETCH_HEAD:${file}`])
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}
