// What every repo guard shares: its command line, its report and its exit code.
//
// A repo guard checks one rule about the repository against its current state. It lists every
// violation, never only the first, and exits 1 if there is any, 0 if there is none, and 2 if it
// could not check at all (an input it needs is missing, say). It needs no browser and takes
// seconds. `run.mjs` runs every `*.guard.mjs` beside this file; see it for how to add one.
import path from "node:path"
import { fileURLToPath } from "node:url"

/**
 * The value of `--<name> <value>` (or `--<name>=<value>`) in `argv`, or `fallback`. Each guard's
 * inputs default to the real repo's, and its test points them at a scratch copy or fixture instead.
 */
export function option(argv, name, fallback) {
  const at = argv.findIndex((arg) => arg === `--${name}` || arg.startsWith(`--${name}=`))
  if (at === -1) return fallback
  return argv[at].includes("=") ? argv[at].slice(argv[at].indexOf("=") + 1) : argv[at + 1]
}

/** Thrown when a guard cannot check its rule at all. It exits 2, not 1. */
export class CannotCheck extends Error {}

/**
 * Run a guard when its module is the script Node was started with. `check(argv)` returns (or
 * resolves to) every violation as a line of text. The report names the rule, then lists each one.
 */
export async function guard(meta, rule, check) {
  if (!process.argv[1] || path.resolve(process.argv[1]) !== fileURLToPath(meta.url)) return
  const name = path.basename(fileURLToPath(meta.url), ".guard.mjs")
  try {
    const violations = await check(process.argv.slice(2))
    if (violations.length === 0) {
      console.log(`PASS  ${name}: ${rule}`)
      process.exitCode = 0
    } else {
      console.log(`FAIL  ${name}: ${rule}. ${violations.length} violation(s):`)
      for (const violation of violations) console.log(`        ${violation.split("\n").join("\n          ")}`)
      process.exitCode = 1
    }
  } catch (err) {
    console.log(`ERROR ${name}: ${rule}. Could not check it:`)
    console.log(`        ${err instanceof CannotCheck ? err.message : (err.stack ?? err)}`)
    process.exitCode = 2
  }
}
