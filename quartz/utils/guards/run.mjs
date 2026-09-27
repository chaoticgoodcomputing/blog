// The repo guards' runner, behind `pnpm nx run site:guards` (#89, #97).
//
// Runs every `*.guard.mjs` in this directory at once, each as its own Node process, then prints each
// one's report in name order and a summary. Exits 1 if any guard failed or could not check, else 0.
//
//   node quartz/utils/guards/run.mjs [<guard name>...] [--guards <dir>]
//
// Adding a guard: write `<name>.guard.mjs` here. It calls `guard()` from `guard.mjs` with its rule and
// a check that returns every violation as a line, and takes its inputs as options that default to the
// real repo's, so its test in utils/test/guard-<name>.test.mjs can break the rule in a scratch copy or
// fixture. Then add whatever it reads to the `guards` target's inputs in quartz/project.json, so the
// cache misses when they change.
import fs from "node:fs"
import path from "node:path"
import { spawn } from "node:child_process"
import { fileURLToPath } from "node:url"
import { option } from "./guard.mjs"

const argv = process.argv.slice(2)
const dir = path.resolve(option(argv, "guards", path.dirname(fileURLToPath(import.meta.url))))
const named = argv.filter((arg, i) => !arg.startsWith("--") && !(argv[i - 1] === "--guards"))

const all = fs
  .readdirSync(dir)
  .filter((file) => file.endsWith(".guard.mjs"))
  .map((file) => file.slice(0, -".guard.mjs".length))
  .sort()
const unknown = named.filter((name) => !all.includes(name))
if (unknown.length) {
  console.error(`No such guard: ${unknown.join(", ")}. The guards are: ${all.join(", ")}.`)
  process.exit(2)
}
const guards = named.length ? all.filter((name) => named.includes(name)) : all

const started = Date.now()
const results = await Promise.all(
  guards.map(
    (name) =>
      new Promise((resolve) => {
        const t0 = Date.now()
        const child = spawn(process.execPath, [path.join(dir, `${name}.guard.mjs`)], { stdio: ["ignore", "pipe", "pipe"] })
        let out = ""
        child.stdout.on("data", (chunk) => (out += chunk))
        child.stderr.on("data", (chunk) => (out += chunk))
        child.on("close", (code) => resolve({ name, code: code ?? 1, out, seconds: (Date.now() - t0) / 1000 }))
      }),
  ),
)

// Each report's first line is its verdict: the time goes there.
for (const { out, seconds } of results) {
  const report = out.trimEnd().split("\n")
  const verdict = report.findIndex((line) => /^(PASS|FAIL|ERROR)\b/.test(line))
  report[verdict === -1 ? 0 : verdict] += `  (${seconds.toFixed(1)}s)`
  console.log(report.join("\n"))
}
const [passed, failed, errored] = [0, 1].map((code) => results.filter((r) => r.code === code)).concat([results.filter((r) => r.code > 1)])
const names = (list) => `(${list.map(({ name }) => name).join(", ")})`
console.log(
  `\n${results.length} guard(s): ${passed.length} passed` +
    (failed.length ? `, ${failed.length} failed ${names(failed)}` : "") +
    (errored.length ? `, ${errored.length} could not check ${names(errored)}` : "") +
    `, in ${((Date.now() - started) / 1000).toFixed(1)}s`,
)
process.exitCode = failed.length || errored.length ? 1 : 0
