// The upgrade's `--verify` (#100): after a successful upgrade, run the repo guards, the typechecks,
// the e2e suite and the real-site build, in that order, stopping at the first that fails. Tested at the command line against the synthetic fixture, with stand-in steps
// (QUARTZ_VERIFY_STEPS) that log their names, so the real suite never runs from here.
import { after, before, describe, test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { makeFixture } from "./fixtures/quartz-repo.mjs"
import { VERIFY_STEPS } from "../upgrade.mjs"

const MANIFEST = "quartz/upstream.json"

// Stand-ins for --verify's steps: each appends its name (and its arguments) to a log and exits
// with the given code.
function standIns(fx, codes) {
  const log = path.join(fx.dir, "verify.log")
  const steps = codes.map((code, i) => ({
    name: `step ${i + 1}`,
    command: [
      "node",
      "-e",
      `require("fs").appendFileSync(${JSON.stringify(log)}, process.argv.slice(1).join(" ") + "\\n"); process.exit(${code})`,
      `step-${i + 1}`,
    ],
  }))
  const file = path.join(fx.dir, "verify-steps.json")
  fs.writeFileSync(file, JSON.stringify(steps))
  const ran = () => (fs.existsSync(log) ? fs.readFileSync(log, "utf-8").trim().split("\n") : [])
  return { env: { QUARTZ_VERIFY_STEPS: file }, ran }
}

test("--verify's steps are the repo guards, the typechecks, the e2e suite and the real-site build, in that order", () => {
  assert.deepEqual(
    VERIFY_STEPS.map(({ name }) => name),
    [
      "the repo guards",
      "the typechecks",
      "the e2e suite",
      "the real-site build",
    ],
  )
})

describe("--verify, when every step passes", () => {
  let fx, res, ran
  before(() => {
    fx = makeFixture()
    const stand = standIns(fx, [0, 0, 0, 0])
    res = fx.upgrade([`--ref=${fx.target}`, "--verify"], stand.env)
    ran = stand.ran()
  })
  after(() => fx.cleanup())

  test("runs every step, in order, after the upgrade, and exits 0", () => {
    assert.equal(res.code, 0, res.output)
    assert.deepEqual(ran, ["step-1", "step-2", "step-3", "step-4"])
    assert.ok(
      res.output.indexOf("▸ record the pinned ref") < res.output.indexOf("▸ verify"),
      res.output,
    )
    assert.match(res.output, /all 4 check\(s\) passed/)
  })
})

describe("--verify, when a step fails", () => {
  let fx, res, ran
  before(() => {
    fx = makeFixture()
    const stand = standIns(fx, [0, 3, 0, 0])
    res = fx.upgrade([`--ref=${fx.target}`, "--verify"], stand.env)
    ran = stand.ran()
  })
  after(() => fx.cleanup())

  test("stops at the first failure, naming it, and exits non-zero", () => {
    assert.notEqual(res.code, 0)
    assert.deepEqual(ran, ["step-1", "step-2"])
    assert.match(res.output, /--verify failed at step 2/)
    assert.match(res.output, /not safe to commit/)
  })

  test("says truthfully that the upgrade was recorded", () => {
    assert.equal(JSON.parse(fx.read(MANIFEST)).commit, fx.target)
    assert.match(res.output, /upstream\.json records the target/)
    assert.doesNotMatch(res.output, /upstream\.json is unchanged/)
  })
})
