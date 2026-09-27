// The repo guards' runner (#97), `utils/guards/run.mjs`, behind `site:guards`: it runs every
// `*.guard.mjs` in its directory at once, prints each one's report in name order, and exits non-zero
// if any guard failed or could not check. Tested on stand-in guards in a temp dir.
import { test } from "node:test"
import assert from "node:assert/strict"
import path from "node:path"
import { spawnSync } from "node:child_process"
import { GUARDS, scratch, writeTree } from "./guard-helpers.mjs"

const RUNNER = path.join(GUARDS, "run.mjs")
const run = (args) => spawnSync(process.execPath, [RUNNER, ...args], { encoding: "utf-8" })

const standIn = (line, code) => `console.log(${JSON.stringify(line)}); process.exitCode = ${code}\n`

test("every guard runs, each report is printed, and one failure fails the run", () => {
  const dir = writeTree(scratch(), {
    "b-fails.guard.mjs": standIn("FAIL  b-fails: two violations", 1),
    "a-passes.guard.mjs": standIn("PASS  a-passes", 0),
    "c-errors.guard.mjs": standIn("ERROR c-errors", 2),
    "helper.mjs": "throw new Error('not a guard: never run')\n",
  })
  const { status, stdout } = run(["--guards", dir])
  assert.equal(status, 1, stdout)
  const order = ["PASS  a-passes", "FAIL  b-fails", "ERROR c-errors"].map((line) => stdout.indexOf(line))
  assert.ok(order.every((at) => at >= 0), stdout)
  assert.deepEqual([...order].sort((x, y) => x - y), order, "reports print in name order")
  assert.match(stdout, /3 guard\(s\): 1 passed, 1 failed \(b-fails\), 1 could not check \(c-errors\)/)
  assert.ok(!stdout.includes("not a guard"))
})

test("all guards passing passes the run", () => {
  const dir = writeTree(scratch(), { "a.guard.mjs": standIn("PASS  a", 0), "b.guard.mjs": standIn("PASS  b", 0) })
  const { status, stdout } = run(["--guards", dir])
  assert.equal(status, 0, stdout)
  assert.match(stdout, /2 guard\(s\): 2 passed/)
})

test("naming guards runs only those", () => {
  const dir = writeTree(scratch(), { "a.guard.mjs": standIn("PASS  a", 0), "b.guard.mjs": standIn("FAIL  b", 1) })
  const { status, stdout } = run(["--guards", dir, "a"])
  assert.equal(status, 0, stdout)
  assert.ok(!stdout.includes("FAIL  b"))
  assert.equal(run(["--guards", dir, "nope"]).status, 2)
})
