// Repo guard: one copy of each of Quartz's shared packages, Core's (#89, #98).
//
// Quartz's shared packages (`SHARED` in utils/packages.mjs: Preact, preact-render-to-string, vfile,
// unified, lightningcss and @quartz-community/*) are the host's singletons. A second Preact on a page
// breaks hooks and vnodes, and a second vfile or unified splits the types and the data plugins share.
// So a package of ours only ever takes them as peers, and resolves the host's:
//   - no plugin, site plugin or library names one in `dependencies`, `devDependencies` or
//     `optionalDependencies`: peers only;
//   - from each plugin's and site plugin's real path, where Quartz loads it from, each one that
//     resolves at all resolves into Core's `node_modules` (through the host link beside the plugins),
//     and each of its peers resolves;
//   - no library has one installed beside it, which a plugin inlining the library would bundle;
//   - no plugin's or site plugin's `dist/` inlines one, directly or through a library it inlines. This
//     reads the path comments esbuild leaves in an unminified bundle, `// <path>/node_modules/<pkg>/…`,
//     so it covers every server-side entry; the browser bundles some plugins minify carry none.
//
//   node quartz-v5/utils/guards/shared-packages.guard.mjs [--repo <dir>]
//
// Test and how to break it by hand: utils/test/guard-shared-packages.test.mjs.
import fs from "node:fs"
import path from "node:path"
import { REPO_ROOT } from "../core-tiers.mjs"
import { SHARED, coreModules, isShared, ourPackages } from "../packages.mjs"
import { CannotCheck, guard, option } from "./guard.mjs"

const FIELDS = ["dependencies", "devDependencies", "optionalDependencies"]
// esbuild's comment before each module it inlines, and the package that module belongs to.
const INLINED = /^\s*\/\/ (\S*?node_modules\/(?:\.pnpm\/[^/\s]+\/node_modules\/)?((?:@[^/\s]+\/)?[^/\s]+)\/\S*)$/gm

/** Where Node's upward walk from `from` finds `name`: the real path of the first `node_modules/<name>`. */
function resolveFrom(from, name) {
  for (let dir = from; ; dir = path.dirname(dir)) {
    const candidate = path.join(dir, "node_modules", name)
    if (fs.existsSync(candidate)) return fs.realpathSync(candidate)
    if (path.dirname(dir) === dir) return undefined
  }
}

/** Every `.js` and `.mjs` file under `dir`, relative to `base`. */
function bundles(dir, base) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile() && /\.m?js$/.test(entry.name))
    .map((entry) => path.relative(base, path.join(entry.parentPath, entry.name)).split(path.sep).join("/"))
    .sort()
}

await guard(import.meta, "One copy of each of Quartz's shared packages, Core's", (argv) => {
  const repo = path.resolve(option(argv, "repo", REPO_ROOT))
  const modules = coreModules(repo)
  if (!fs.existsSync(modules)) throw new CannotCheck(`Quartz Core is not installed (${modules}): pnpm nx run site-v5:install`)
  const core = fs.realpathSync(modules)
  const scopes = SHARED.filter((name) => name.endsWith("/"))
  // Every shared package there is: the named ones, and each in a shared scope that Core has.
  const shared = [
    ...SHARED.filter((name) => !name.endsWith("/")),
    ...scopes.flatMap((scope) => {
      const dir = path.join(modules, scope)
      return fs.existsSync(dir) ? fs.readdirSync(dir).map((name) => `${scope}${name}`) : []
    }),
  ]

  const violations = []
  for (const { kind, rel, path: at, pkg } of ourPackages(repo)) {
    const say = (message) => violations.push(`${rel}: ${message}`)
    for (const field of FIELDS) {
      for (const name of Object.keys(pkg[field] ?? {}).filter(isShared)) say(`declares ${name} in ${field}: a shared package is a peer only`)
    }

    if (kind === "library") {
      // A library is never loaded from where it lives, only inlined into a plugin's build, so what
      // matters is that it brings no copy along for that build to bundle.
      for (const name of shared) {
        if (fs.existsSync(path.join(at, "node_modules", name))) say(`carries its own ${name} (${rel}/node_modules/${name})`)
      }
      continue
    }

    const real = fs.realpathSync(at)
    const peers = Object.keys(pkg.peerDependencies ?? {}).filter(isShared)
    for (const name of [...new Set([...shared, ...peers])]) {
      const resolved = resolveFrom(real, name)
      if (resolved === undefined) {
        if (peers.includes(name)) say(`its peer ${name} resolves nowhere, not to Core's copy`)
      } else if (!resolved.startsWith(`${core}${path.sep}`)) {
        say(`${name} resolves to ${resolved}, not Core's copy`)
      }
    }

    for (const file of bundles(path.join(at, "dist"), at)) {
      const seen = new Set()
      for (const [, from, name] of fs.readFileSync(path.join(at, file), "utf-8").matchAll(INLINED)) {
        if (!isShared(name) || seen.has(name)) continue
        seen.add(name)
        say(`${file} inlines ${name} (${from}): make it a peer, so the build leaves it external`)
      }
    }
  }
  return violations
})
