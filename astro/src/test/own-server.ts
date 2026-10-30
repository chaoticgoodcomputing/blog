// What a Playwright configuration that builds and serves a site of its own in this checkout needs
// (docs/adr/0007): the end-to-end suite's (playwright.config.ts). Its refusal to run beside the dev server, its port, and the
// server that builds and serves the site.

import { createHash } from "node:crypto"
import fs from "node:fs"

/**
 * Never beside the checkout's dev server, at `root`. A build writes its own vault's lists of images
 * and MDX modules into `.astro`, which the dev server reads, and every MDX note is then a 500 until
 * the server is restarted. `astro dev` records itself in `.astro/dev.json` while it runs.
 */
export function refuseBesideDevServer(root: string, what: string): void {
  const devServer = (() => {
    try {
      const lock = JSON.parse(fs.readFileSync(`${root}.astro/dev.json`, "utf8")) as { pid: number; url?: string }
      process.kill(lock.pid, 0)
      return lock
    } catch {
      return undefined
    }
  })()
  if (devServer) {
    throw new Error(
      `A dev server is running in this checkout (pid ${devServer.pid}, ${devServer.url ?? "address unknown"}), and ${what}'s ` +
        `build would break it. Stop it, run ${what}, and start it again, or run ${what} from another worktree ` +
        `(README.md, "Tests"). If no dev server is running, delete ${root}.astro/dev.json.`,
    )
  }
}

/**
 * A port per checkout, from its path, so worktrees differ without anyone choosing. `salt` gives a
 * second server in the same checkout a port of its own.
 */
export const portOf = (root: string, salt = ""): number =>
  20000 + (createHash("sha1").update(root + salt).digest().readUInt16BE(0) % 10000)

/** Where a configuration's own site is built, and what its build is given. */
export interface OwnBuild {
  /** The build's folder, from `root`, beside `dist` and never in it: `dist` stays the real build. */
  outDir: string
  /** The build's cache, so it never clears the real build's (astro.config.ts). */
  cacheDir: string
  port: number
  /** More of the build's environment: `VAULT_ROOT` and `MIRRORS_ROOT`, for a vault other than the real one. */
  env?: Record<string, string>
  /** A command run before the build, from `root`: making what the build reads. */
  before?: string
}

/**
 * The `webServer` that builds this site and serves it, from `root`: a build of its own, with
 * `--force` and a cache of its own, on a port of its own, never a server that is already there.
 */
export function ownServer(root: string, { outDir, cacheDir, port, env = {}, before }: OwnBuild) {
  // Called by its path: under `pnpm exec` the server outlives the run. `--force` because the build's
  // cache keeps a note's rendered HTML, and nothing in it knows that a Markdown plugin's code has
  // changed: nothing is ever tested on HTML an older build rendered. `--ignore-lock` because Astro
  // allows a project one preview server, and puts it in the background when an agent starts it.
  const astro = "./node_modules/.bin/astro"
  return {
    command: `${before ? `${before} && ` : ""}${astro} build --force --outDir ${outDir} && ${astro} preview --outDir ${outDir} --port ${port} --ignore-lock`,
    cwd: root,
    url: `http://localhost:${port}`,
    // E2E_CACHE_DIR also holds the preview server to its port (`preview.strictPort`, astro.config.ts).
    // `--force` clears the rendered notes in the cache and keeps the images.
    env: { E2E_CACHE_DIR: cacheDir, ...env },
    // Never a server that is already there: it could be another checkout's site.
    reuseExistingServer: false,
    timeout: 300_000,
    stdout: "pipe" as const,
  }
}
